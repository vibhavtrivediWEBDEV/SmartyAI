// lib/capabilityManager.ts
/**
 * Capability Manager (skeleton)
 *
 * Responsibilities (minimal initial implementation):
 * - Define capability scopes
 * - Check whether required capabilities are granted
 * - Keep a pending permission queue
 * - Provide simple request API (UI integration will consume pending queue)
 *
 * This is a safe, local boundary. It does NOT perform native actions itself —
 * those are the responsibility of the Mac Node or other providers.
 */

export type Capability =
  | 'filesystem.read'
  | 'filesystem.write'
  | 'filesystem.move'
  | 'filesystem.delete'
  | 'finder.control'
  | 'mail.read'
  | 'mail.compose'
  | 'mail.send'
  | 'calendar.read'
  | 'calendar.write'
  | 'screen.read'
  | 'screen.capture'
  | 'app.launch'
  | 'browser.control'
  | 'system.command'
  | 'clipboard.read'
  | 'clipboard.write'
  | 'microphone'
  | 'camera'
  | string;

export interface PermissionEntry {
  capability: Capability;
  status: 'granted' | 'denied' | 'pending';
  requestedAt: number;
}

const grantedPermissions = new Set<Capability>();
const pendingQueue: PermissionEntry[] = [];
const PERSIST_KEY = 'smarty.capability.grants.v1';
const DEV_BYPASS_KEY = 'smarty.capability.devBypass.v1';

// Ephemeral (Allow Once) grants tracked in-memory and persisted briefly for server-side use
const ephemeralGrants: Array<{ capability: Capability; expiresAt: number }> = [];

// Server-side persisted grants file (Next.js server may run in Node)
let PERSIST_FILE_PATH: string | null = null;
function persistToDisk() {
  if (!PERSIST_FILE_PATH) return;
  try {
    const fs = require('fs');
    const obj = {
      persistent: Array.from(grantedPermissions),
      ephemeral: ephemeralGrants.filter(e => e.expiresAt > Date.now())
    };
    fs.writeFileSync(PERSIST_FILE_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    // ignore
  }
}

// --- Ephemeral token issuance (HMAC-based) for distributed-safe Allow Once ---
function getOrCreateSecret(): string {
  try {
    const fs = require('fs');
    if (!PERSIST_FILE_PATH) return process.env.CAPABILITY_JWT_SECRET || 'dev-secret';
    const secretPath = PERSIST_FILE_PATH + '.secret';
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf8');
    }
    const crypto = require('crypto');
    const secret = crypto.randomBytes(32).toString('hex');
    try { fs.writeFileSync(secretPath, secret, 'utf8'); } catch (e) {}
    return secret;
  } catch (e) {
    return process.env.CAPABILITY_JWT_SECRET || 'dev-secret';
  }
}

function signToken(payload: any): string {
  const crypto = require('crypto');
  const secret = getOrCreateSecret();
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

function verifyToken(token: string): { ok: boolean; payload?: any } {
  try {
    const crypto = require('crypto');
    const secret = getOrCreateSecret();
    const parts = token.split('.');
    if (parts.length !== 3) return { ok: false };
    const [header, body, sig] = parts;
    const expected = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (expected !== sig) return { ok: false };
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return { ok: false };
    return { ok: true, payload };
  } catch (e) {
    return { ok: false };
  }
}

export function issueEphemeralToken(capability: Capability, ttlMs = 5 * 60 * 1000): string {
  const payload = { cap: capability, iat: Date.now(), exp: Date.now() + ttlMs };
  return signToken(payload);
}

export function verifyEphemeralToken(token: string, capability: Capability): boolean {
  const v = verifyToken(token);
  if (!v.ok || !v.payload) return false;
  return v.payload.cap === capability && v.payload.exp && Date.now() <= v.payload.exp;
}

// Load persisted grants (either from disk on server, or from localStorage in browser)
try {
  if (typeof window === 'undefined') {
    const path = require('path');
    const fs = require('fs');
    PERSIST_FILE_PATH = path.join(process.cwd(), '.capability_grants.json');
    if (fs.existsSync(PERSIST_FILE_PATH)) {
      try {
        const raw = fs.readFileSync(PERSIST_FILE_PATH, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        const arr: Capability[] = parsed?.persistent || [];
        for (const a of arr) grantedPermissions.add(a);
        const eph: Array<{ capability: Capability; expiresAt: number }> = parsed?.ephemeral || [];
        const now = Date.now();
        for (const e of eph) {
          if (e.expiresAt > now) ephemeralGrants.push(e);
        }
      } catch (e) {}
    }
  } else {
    if (window.localStorage) {
      const raw = window.localStorage.getItem(PERSIST_KEY);
      if (raw) {
        const arr: Capability[] = JSON.parse(raw || '[]');
        for (const a of arr) grantedPermissions.add(a);
      }
      const rawDev = window.localStorage.getItem(DEV_BYPASS_KEY);
      if (rawDev === 'true') {
        console.log('[capabilityManager] DEV_BYPASS enabled (from localStorage)');
      }
    }
  }
} catch (e) {
  // ignore
}
// Pending operations waiting for permission
export interface PendingOperation {
  id: string;
  sequence: any[];
  intent?: string;
  parameters?: Record<string, any>;
  requiredCapabilities?: Capability[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  executor?: () => Promise<any>;
}

const pendingOperations: PendingOperation[] = [];

// Recently cancelled operations (for telemetry / re-request)
const recentCancelled: Array<{
  operationId: string;
  intent?: string;
  sequence?: any[];
  requiredCapabilities?: Capability[];
  cancelledAt: number;
  reason?: Capability;
  executor?: () => Promise<any>;
}> = [];

// --- Basic capability inference from intent keys ---
export function inferCapabilitiesForIntent(intentKey: string, params: Record<string, any> = {}): Capability[] {
  const caps: Set<Capability> = new Set();

  // Simple heuristics. Expand as needed.
  // If the intent is conversational (eg. `ai.chat`) the actionable text may
  // be inside `params.prompt` or `params.text` — check those as well.
  const text = String(params?.prompt || params?.text || '').toLowerCase();

  if (
    intentKey.startsWith('filesystem') ||
    intentKey.includes('file') ||
    intentKey.includes('resume') ||
    intentKey.includes('import') ||
    text.includes('file') ||
    text.includes('find') ||
    text.includes('resume')
  ) {
    caps.add('filesystem.read');
  }

  // Heuristic: tracker/BR_FR related commands likely need filesystem access
  if (
    intentKey.toLowerCase().includes('track') ||
    intentKey.toLowerCase().includes('tracker') ||
    intentKey.toLowerCase().includes('br_fr') ||
    text.includes('br_fr') ||
    text.includes('tracker')
  ) {
    caps.add('filesystem.read');
    caps.add('filesystem.write');
  }

  if (intentKey.includes('move') || intentKey.includes('copy') || intentKey.includes('import')) {
    caps.add('filesystem.write');
  }

  if (intentKey.startsWith('mail') || intentKey.includes('mail')) {
    caps.add('mail.compose');
    caps.add('mail.send');
  }

  if (intentKey.startsWith('calendar') || intentKey.includes('calendar')) {
    caps.add('calendar.write');
  }

  if (intentKey.startsWith('settings') || intentKey.includes('dock') || intentKey.includes('wallpaper')) {
    caps.add('system.command');
  }

  if (intentKey.includes('browser') || intentKey.startsWith('youtube') || intentKey.includes('search')) {
    caps.add('browser.control');
  }

  if (intentKey.startsWith('screen') || intentKey.includes('screenshot')) {
    caps.add('screen.capture');
  }

  if (
    intentKey.startsWith('finder') ||
    intentKey.includes('finder') ||
    intentKey.includes('open Finder') ||
    intentKey.includes('finder.search') ||
    intentKey.includes('finder.searchWithPermission') ||
    text.includes('finder') ||
    text.includes('open claw') ||
    text.includes('openclaw') ||
    text.includes('open finder')
  ) {
    caps.add('finder.control');
    caps.add('filesystem.read');
  }

  return Array.from(caps);
}

// --- Check capabilities ---
export function checkCapabilities(required: Capability[] = []): { granted: boolean; missing: Capability[] } {
  const missing: Capability[] = [];
  for (const c of required) {
    // consider ephemeral grants as granted until expiry
    const now = Date.now();
    const hasEphemeral = ephemeralGrants.find(e => e.capability === c && e.expiresAt > now);
    if (!grantedPermissions.has(c) && !hasEphemeral) missing.push(c);
  }
  return { granted: missing.length === 0, missing };
}

// --- Request capabilities (adds to pending queue) ---
export function requestCapabilities(required: Capability[] = []): { queued: Capability[] } {
  const now = Date.now();
  const queued: Capability[] = [];

  // If dev bypass is enabled, auto-grant capabilities and persist
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem(DEV_BYPASS_KEY) === 'true') {
      for (const c of required) {
        grantedPermissions.add(c);
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(PERSIST_KEY, JSON.stringify(Array.from(grantedPermissions)));
        }
      } catch (e) {}
      console.log('[capabilityManager] DEV_BYPASS: auto-granted', required);
      try { window.dispatchEvent(new CustomEvent('capability:granted', { detail: { capability: required } })); } catch(e){}
      return { queued: [] };
    }
  } catch (e) {}

  for (const c of required) {
    const existing = pendingQueue.find(p => p.capability === c);
    if (!existing && !grantedPermissions.has(c)) {
      pendingQueue.push({ capability: c, status: 'pending', requestedAt: now });
      queued.push(c);
    }
  }
  // notify client listeners if running in browser
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('capability:request', { detail: { capabilities: queued } }));
    }
  } catch (e) {}

  return { queued };
}

// --- App-level APIs ---
export async function check(capability: Capability): Promise<{ status: 'granted' | 'pending' | 'denied' }> {
  const res = checkCapabilities([capability]);
  if (res.granted) return { status: 'granted' };
  const pending = pendingQueue.find(p => p.capability === capability);
  if (pending) return { status: 'pending' };
  return { status: 'denied' };
}

export function request(capability: Capability): { requestId: string } {
  const now = Date.now();
  const existing = pendingQueue.find(p => p.capability === capability);
  if (existing) return { requestId: `${existing.capability}-${existing.requestedAt}` };
  pendingQueue.push({ capability, status: 'pending', requestedAt: now });
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('capability:request', { detail: { capability } })); } catch(e){}
  return { requestId: `${capability}-${now}` };
}

export async function execute(capability: Capability, action: () => Promise<any>): Promise<{ success: boolean; result?: any; needConsent?: boolean; error?: any }> {
  const now = Date.now();
  const ephIdx = ephemeralGrants.findIndex(e => e.capability === capability && e.expiresAt > now);
  const isGranted = grantedPermissions.has(capability) || ephIdx !== -1;
  if (!isGranted) {
    request(capability);
    return { success: false, needConsent: true, error: 'consent_required' };
  }

  try {
    const res = await action();
    if (ephIdx !== -1) {
      ephemeralGrants.splice(ephIdx, 1);
      persistToDisk();
      grantedPermissions.delete(capability);
    }
    return { success: true, result: res };
  } catch (e) {
    return { success: false, error: e };
  }
}

export function revokeCapability(capability: Capability) {
  if (grantedPermissions.has(capability)) grantedPermissions.delete(capability);
  for (let i = ephemeralGrants.length - 1; i >= 0; i--) if (ephemeralGrants[i].capability === capability) ephemeralGrants.splice(i, 1);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(Array.from(grantedPermissions)));
    } else {
      persistToDisk();
    }
  } catch (e) {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('capability:revoked', { detail: { capability } })); } catch(e){}
}

// --- Audit logging ---
const auditLogs: Array<{ action: string; capability: Capability; actor?: string; at: number; meta?: any }> = [];
export function logAudit(action: string, capability: Capability, actor = 'unknown', meta?: any) {
  const entry = { action, capability, actor, at: Date.now(), meta };
  auditLogs.push(entry);
  try {
    const fs = require('fs');
    if (PERSIST_FILE_PATH) {
      const auditPath = PERSIST_FILE_PATH + '.audit.json';
      const prev = fs.existsSync(auditPath) ? JSON.parse(fs.readFileSync(auditPath, 'utf8') || '[]') : [];
      prev.push(entry);
      try { fs.writeFileSync(auditPath, JSON.stringify(prev, null, 2), 'utf8'); } catch (e) {}
    }
  } catch (e) {}
}

export function getAuditLogs() {
  return auditLogs.slice().reverse();
}

export function queueOperation(op: Omit<PendingOperation, 'id' | 'createdAt' | 'status'>): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry: PendingOperation = {
    id,
    sequence: op.sequence,
    intent: op.intent,
    parameters: op.parameters,
    requiredCapabilities: (op as any).requiredCapabilities || [],
    status: 'pending',
    createdAt: Date.now(),
    executor: op.executor
  };
  pendingOperations.push(entry);
  console.log('[capabilityManager] queued operation', entry.id, 'requires', entry.requiredCapabilities);
  return id;
}

export function setDevBypass(enabled: boolean) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEV_BYPASS_KEY, enabled ? 'true' : 'false');
    }
  } catch (e) {}

  // If enabling, auto-grant any pending queue items
  if (enabled) {
    // grant all current pendingQueue capabilities
    for (const p of pendingQueue) {
      grantedPermissions.add(p.capability);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(PERSIST_KEY, JSON.stringify(Array.from(grantedPermissions)));
      }
    } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('capability:granted', { detail: { capability: 'dev_bypass' } })); } catch(e){}
    console.log('[capabilityManager] setDevBypass enabled');
  } else {
    console.log('[capabilityManager] setDevBypass disabled');
  }
}

export function isDevBypass() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(DEV_BYPASS_KEY) === 'true';
    }
  } catch (e) {}
  return false;
}

export function getPendingOperations(): PendingOperation[] {
  return [...pendingOperations];
}

export async function resumeOperation(id: string): Promise<{ success: boolean; error?: any }> {
  const idx = pendingOperations.findIndex(p => p.id === id);
  if (idx === -1) return { success: false, error: 'not_found' };

  const op = pendingOperations[idx];
  if (!op.executor) return { success: false, error: 'no_executor' };

  // Before running, check whether the stored sequence still contains
  // unresolved file placeholders (e.g. {{selectedFilePath}}). If so,
  // trigger the OpenClaw flow (finder) so the user can select the file,
  // and keep the operation pending until selection completes.
  try {
    const seqStr = JSON.stringify(op.sequence || []);
    if (seqStr.includes('{{selectedFilePath}}')) {
      // Re-open finder for this operation
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('capability:userOPENCLAW', { detail: { operationId: op.id, operationIds: [op.id], capability: 'filesystem.read' } }));
        }
      } catch (e) {
        // ignore
      }

      // Keep status as pending
      op.status = 'pending';
      return { success: false, error: 'awaiting_file' };
    }
  } catch (e) {
    // if JSON stringify fails, proceed to attempt execution
  }

  op.status = 'running';
  try {
    const res = await op.executor();
    op.status = 'completed';
    // remove from queue
    pendingOperations.splice(idx, 1);
    return { success: true };
  } catch (error) {
    op.status = 'failed';
    return { success: false, error };
  }
}

export function requeueCancelledOperation(operationId: string): { success: boolean; error?: any } {
  const idx = recentCancelled.findIndex(r => r.operationId === operationId);
  if (idx === -1) return { success: false, error: 'not_found' };

  const item = recentCancelled[idx];
  // Push back to pendingOperations
  const entry: PendingOperation = {
    id: item.operationId,
    sequence: item.sequence || [],
    intent: item.intent,
    parameters: undefined,
    requiredCapabilities: item.requiredCapabilities || [],
    status: 'pending',
    createdAt: Date.now(),
    executor: item.executor
  };

  pendingOperations.push(entry);

  // Remove from recentCancelled
  recentCancelled.splice(idx, 1);

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('capability:operationRequeued', { detail: { operationId: entry.id } }));
    }
  } catch (e) {}

  return { success: true };
}

export function updatePendingOperation(operationId: string, updates: Partial<PendingOperation>): { success: boolean; error?: any } {
  const idx = pendingOperations.findIndex(p => p.id === operationId);
  if (idx === -1) return { success: false, error: 'not_found' };

  const op = pendingOperations[idx];
  // Only allow specific safe updates
  if (updates.parameters) {
    op.parameters = { ...(op.parameters || {}), ...(updates.parameters || {}) };

    // If selectedFilePath provided, attempt simple template replacement in stored sequence
    const selected = (updates.parameters as any).selectedFilePath;
    if (selected && op.sequence && Array.isArray(op.sequence)) {
      try {
        op.sequence = op.sequence.map((step: any) => {
          const s = JSON.parse(JSON.stringify(step));
          const replace = (val: any) => {
            if (typeof val !== 'string') return val;
            return val.replace(/{{selectedFilePath}}/g, String(selected));
          };

          if (s.target) s.target = replace(s.target);
          if (s.params) {
            Object.keys(s.params).forEach(k => {
              s.params[k] = replace(s.params[k]);
            });
          }
          return s;
        });
      } catch (e) {
        // ignore template replace errors
      }
    }
  }
  if (updates.sequence) op.sequence = updates.sequence;

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('capability:operationUpdated', { detail: { operationId } }));
    }
  } catch (e) {}

  return { success: true };
}

export function cancelOperation(id: string) {
  const idx = pendingOperations.findIndex(p => p.id === id);
  if (idx !== -1) {
    pendingOperations[idx].status = 'cancelled';
    pendingOperations.splice(idx, 1);
    return true;
  }
  return false;
}

// --- Grant / Deny (these would be invoked by local UI after user decision) ---
export function grantCapability(capability: Capability, persistent = false) {
  // mark pending entries as granted
  pendingQueue.forEach(p => {
    if (p.capability === capability) p.status = 'granted';
  });

  if (persistent) {
    grantedPermissions.add(capability);
    // persist to localStorage or disk
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const arr = Array.from(grantedPermissions);
        window.localStorage.setItem(PERSIST_KEY, JSON.stringify(arr));
      } else {
        persistToDisk();
      }
    } catch (e) {}
  } else {
    // ephemeral (Allow Once)
    grantedPermissions.add(capability);
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    ephemeralGrants.push({ capability, expiresAt });
    persistToDisk();
  }

  // Notify UI/listeners that a capability has been granted
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('capability:granted', { detail: { capability } }));
    }
  } catch (e) {
    // ignore
  }

  // After granting, attempt to auto-resume any pending operations whose requiredCapabilities are now satisfied
  try {
    const opsToResume = pendingOperations.filter(op => op.status === 'pending' && op.requiredCapabilities && op.requiredCapabilities.length > 0)
      .filter(op => {
        const missing = op.requiredCapabilities!.filter(rc => !grantedPermissions.has(rc));
        return missing.length === 0;
      });

    for (const op of opsToResume) {
      // resume asynchronously
      resumeOperation(op.id).then(res => {
        try {
          window.dispatchEvent(new CustomEvent('capability:operationAutoResumed', { detail: { operationId: op.id, success: res.success } }));
        } catch (e) {
          // ignore
        }
      }).catch(() => {});
    }
  } catch (e) {
    // ignore errors in auto-resume path
  }
}

export function denyCapability(capability: Capability) {
  // Mark pending queue entries as denied
  for (let i = pendingQueue.length - 1; i >= 0; i--) {
    if (pendingQueue[i].capability === capability) {
      pendingQueue[i].status = 'denied';
      // Remove from pendingQueue to keep UI clean
      pendingQueue.splice(i, 1);
    }
  }

  // Cancel any pending operations that require this capability
  try {
    const opsToCancel = pendingOperations.filter(op => op.status === 'pending' && op.requiredCapabilities && op.requiredCapabilities.includes(capability));
    for (const op of opsToCancel) {
      // save cancelled op for telemetry and possible re-request
      recentCancelled.push({
        operationId: op.id,
        intent: op.intent,
        sequence: op.sequence,
        requiredCapabilities: op.requiredCapabilities,
        cancelledAt: Date.now(),
        reason: capability,
        executor: op.executor
      });

      // mark as cancelled and remove
      const idx = pendingOperations.findIndex(p => p.id === op.id);
      if (idx !== -1) {
        pendingOperations[idx].status = 'cancelled';
        pendingOperations.splice(idx, 1);
      }

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('capability:operationCancelled', { detail: { operationId: op.id, capability } }));
        }
      } catch (e) {}
    }
  } catch (e) {
    // ignore
  }

  // Notify UI/listeners that a capability was denied
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('capability:denied', { detail: { capability } }));
    }
  } catch (e) {
    // ignore
  }
}

export function getPendingQueue(): PermissionEntry[] {
  return [...pendingQueue];
}

export function getCancelledOperations() {
  return recentCancelled.map(r => ({ ...r }));
}

export function listGrantedPermissions(): Capability[] {
  return Array.from(grantedPermissions);
}

// Expose minimal API
export const capabilityManager = {
  inferCapabilitiesForIntent,
  checkCapabilities,
  requestCapabilities,
  grantCapability,
  denyCapability,
  check,
  request,
  execute,
  revokeCapability,
  getPendingQueue,
  listGrantedPermissions,
  // Operation management
  queueOperation,
  getPendingOperations: () => [...pendingOperations],
  resumeOperation,
  cancelOperation
  ,
  // cancelled operations
  getCancelledOperations,
  requeueCancelledOperation
  ,
  updatePendingOperation
  ,
  setDevBypass,
  isDevBypass
  ,
  // audit & token utilities
  logAudit,
  getAuditLogs,
  issueEphemeralToken,
  verifyEphemeralToken
};

export default capabilityManager;
