import React from 'react';
import useCapabilityManager from '@/hooks/useCapabilityManager';
import { useEffect, useState } from 'react';

export const CapabilityCenter: React.FC = () => {
  const { granted, pending, operations, cancelled, grant, deny, resume, cancel, requeue } = useCapabilityManager(1000);
  const [audit, setAudit] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/capability/audit');
        const body = await res.json().catch(() => ({}));
        if (mounted && body && body.logs) setAudit(body.logs);
      } catch (e) {}
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div style={{ padding: 16, width: 360, background: 'rgba(255,255,255,0.98)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
      <h3 style={{ marginTop: 0 }}>Capability Center</h3>

      <section style={{ marginBottom: 12 }}>
        <strong>Granted</strong>
        <ul>
          {granted.length === 0 && <li style={{ color: '#666' }}>No granted capabilities</li>}
          {granted.map(g => <li key={g}>{g}</li>)}
        </ul>
      </section>

      <section style={{ marginBottom: 12 }}>
        <strong>Pending Permissions</strong>
        <ul>
          {pending.length === 0 && <li style={{ color: '#666' }}>No pending permissions</li>}
          {pending.map(p => (
            <li key={p.capability} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{p.capability}</span>
              <span>
                <button onClick={async () => {
                  try {
                    const res = await fetch('/api/capability/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: p.capability, persistent: false }) });
                    const body = await res.json().catch(() => ({}));
                    if (body && body.token) {
                      (window as any).__smarty_ephemeral_tokens = (window as any).__smarty_ephemeral_tokens || {};
                      (window as any).__smarty_ephemeral_tokens[p.capability] = body.token;
                    }
                  } catch (e) {}
                  grant(p.capability, false);
                }} style={{ marginRight: 6 }}>Allow Once</button>
                <button onClick={() => { fetch('/api/capability/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ capability: p.capability, persistent: true }) }).catch(() => {}); grant(p.capability, true); }} style={{ marginRight: 6 }}>Allow</button>
                <button onClick={() => deny(p.capability)}>Deny</button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <strong>Pending Operations</strong>
        <ul>
          {operations.length === 0 && <li style={{ color: '#666' }}>No pending operations</li>}
          {operations.map((op: any) => (
            <li key={op.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#222' }}>{op.intent || 'automation'}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{(op.sequence?.length) || 0} steps • {op.status}</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={async () => { await resume(op.id); }} style={{ marginRight: 6 }}>Resume</button>
                <button onClick={() => cancel(op.id)}>Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 12 }}>
        <strong>Recently Cancelled</strong>
        <ul>
          {cancelled && cancelled.length === 0 && <li style={{ color: '#666' }}>No recently cancelled operations</li>}
          {cancelled && cancelled.map((c: any) => (
            <li key={c.operationId} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#222' }}>{c.intent || 'automation'} <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>• {new Date(c.cancelledAt).toLocaleString()}</span></div>
              <div style={{ fontSize: 12, color: '#555' }}>Reason: {c.reason} • Requires: {(c.requiredCapabilities || []).join(', ')}</div>
              <div style={{ marginTop: 6 }}>
                <button onClick={() => { requeue(c.operationId); }} style={{ marginRight: 6 }}>Re-request</button>
                <button onClick={() => { /* dismiss locally by reloading */ window.location.reload(); }}>Dismiss</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 12 }}>
        <strong>Audit History</strong>
        <ul>
          {audit.length === 0 && <li style={{ color: '#666' }}>No audit entries</li>}
          {audit.map((a: any, i: number) => (
            <li key={i} style={{ fontSize: 12, color: '#444', marginBottom: 6 }}>
              <div><strong>{a.action}</strong> • {a.capability} <span style={{ color: '#999', fontSize: 11 }}>• {a.actor} • {new Date(a.at).toLocaleString()}</span></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default CapabilityCenter;
