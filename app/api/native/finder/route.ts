import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import capabilityManager from '@/lib/capabilityManager';

const execAsync = promisify(exec);

// Known macOS TCC/Automation denial signatures from osascript stderr
const TCC_DENIAL_PATTERNS = [
  /Not authorized to send Apple events/i,
  /osascript is not allowed/i,
  /-1743/, // errAEEventNotPermitted
  /-10004/, // errOSAScriptError / privilege violation variants
];

function isTccDenial(stderr: string): boolean {
  return TCC_DENIAL_PATTERNS.some((pattern) => pattern.test(stderr));
}

async function chooseFileAppleScript(): Promise<string> {
  // AppleScript: display dialog to choose file and return POSIX path
  const script = `set theFile to choose file with prompt "Select a file for Smarty"\nPOSIX path of theFile`;
  const safe = script.replace(/'/g, "'\\''");
  const { stdout, stderr } = await execAsync(`osascript -e '${safe}'`);
  if (stderr && stderr.trim()) {
    const s = String(stderr || '');
    if (isTccDenial(s)) throw { tcc: true, stderr: s };
    throw new Error(s);
  }
  return String(stdout || '').trim();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Allow callers to provide a custom script (for other actions), else run choose-file
  const scriptProvided: string | undefined = body?.script;

  // Gate through Capability Manager: require `finder.control` at app-level consent
  try {
    const cap = await (capabilityManager as any).check('finder.control');
    if (!cap || cap.status !== 'granted') {
      // Signal client that app-level consent is required before attempting OS automation
      return NextResponse.json({ success: false, needConsent: true, capability: 'finder.control', requiredCapabilities: ['finder.control'] }, { status: 403 });
    }

    // First try: call the local helper HTTP listener (Option 1)
    try {
      const helperUrl = 'http://127.0.0.1:45678/choose-file';

      // Check for ephemeral token provided by client for distributed Allow Once
      const ephemeralToken = (req.headers.get('x-smarty-ephemeral') || (body && body.ephemeralToken)) as string | null;
      let tokenValid = false;
      if (ephemeralToken) {
        try {
          tokenValid = (capabilityManager as any).verifyEphemeralToken ? (capabilityManager as any).verifyEphemeralToken(ephemeralToken, 'finder.control') : false;
        } catch (e) { tokenValid = false; }
      }

      // If client provided a valid ephemeral token, bypass app-state and call helper directly
      if (tokenValid) {
        const helperRes = await fetch(helperUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationIds: body.operationIds || (body.operationId ? [body.operationId] : []) })
        });
        const helperBody = await helperRes.json().catch(() => null);
        if (!helperRes.ok) {
          if (helperBody && helperBody.errorType === 'TCC_DENIED') {
            return NextResponse.json(helperBody, { status: 403 });
          }
          return NextResponse.json({ success: false, errorType: 'HELPER_ERROR', error: helperBody || 'Helper returned error' }, { status: 500 });
        }
        if (helperBody && helperBody.success && helperBody.filePath) {
          return NextResponse.json({ success: true, filePath: helperBody.filePath, operationIds: helperBody.operationIds || [] });
        }
        return NextResponse.json({ success: false, errorType: 'HELPER_INVALID_RESPONSE', error: helperBody || 'Invalid helper response' }, { status: 500 });
      }

      // Use capabilityManager.execute to ensure allow-once grants are honored and revoked
      const execResult = await (capabilityManager as any).execute('finder.control', async () => {
        const helperRes = await fetch(helperUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationIds: body.operationIds || (body.operationId ? [body.operationId] : []) })
        });
        const helperBody = await helperRes.json().catch(() => null);
        if (!helperRes.ok) {
          if (helperBody && helperBody.errorType === 'TCC_DENIED') {
            const e: any = new Error('TCC_DENIED');
            (e as any).helperBody = helperBody;
            throw e;
          }
          const e: any = new Error('HELPER_ERROR');
          (e as any).helperBody = helperBody;
          throw e;
        }
        if (helperBody && helperBody.success && helperBody.filePath) {
          return { success: true, filePath: helperBody.filePath, operationIds: helperBody.operationIds || [] };
        }
        const e: any = new Error('HELPER_INVALID_RESPONSE');
        (e as any).helperBody = helperBody;
        throw e;
      });

      if (execResult.success) {
        return NextResponse.json(execResult.result);
      }
      // If needConsent bubbled up, return that to client
      if (execResult.needConsent) {
        return NextResponse.json({ success: false, needConsent: true, capability: 'finder.control' }, { status: 403 });
      }
      return NextResponse.json({ success: false, error: execResult.error || 'helper_error' }, { status: 500 });
    } catch (fetchErr: any) {
      // Likely connection refused / helper not running
      if (fetchErr && fetchErr.message === 'TCC_DENIED' && (fetchErr as any).helperBody) {
        return NextResponse.json((fetchErr as any).helperBody, { status: 403 });
      }
      return NextResponse.json({ success: false, errorType: 'HELPER_NOT_RUNNING', error: 'Finder helper is not running. Start the "SmartyAI Finder Helper" app to enable native file picking.', guidance: {
        title: 'Start the SmartyAI Finder Helper',
        steps: [
          'Open the SmartyAI Finder Helper app (located in /Applications or the project folder)',
          'If you just built it, run it once from Xcode to register permissions',
          'Retry the action in SmartyAI'
        ]
      } }, { status: 503 });
    }
  } catch (err: any) {
    // As a last resort, fall back to running osascript directly (best-effort)
    try {
      if (scriptProvided) {
        const safe = scriptProvided.replace(/'/g, "'\\''");
        const { stdout, stderr } = await execAsync(`osascript -e '${safe}'`);
        if (stderr && stderr.trim()) {
          const s = String(stderr || '');
          if (isTccDenial(s)) {
            return NextResponse.json({ success: false, errorType: 'TCC_DENIED', error: 'Automation permission not granted for Finder.', guidance: {
              title: 'Finder access blocked by macOS',
              steps: [
                'Open System Settings → Privacy & Security → Automation',
                'Find this app (Terminal / Node / SmartyAI helper) in the list',
                'Enable the toggle next to Finder',
                'Retry the action'
              ],
              deepLink: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation'
            } }, { status: 403 });
          }
          return NextResponse.json({ success: false, errorType: 'UNKNOWN', error: s }, { status: 500 });
        }
        return NextResponse.json({ success: true, result: String(stdout || '').trim(), operationIds: body.operationIds || (body.operationId ? [body.operationId] : []) });
      }

      // Default: choose file via osascript
      try {
        const filePath = await chooseFileAppleScript();
        return NextResponse.json({ success: true, filePath, operationIds: body.operationIds || (body.operationId ? [body.operationId] : []) });
      } catch (e: any) {
        if (e && e.tcc) {
          return NextResponse.json({ success: false, errorType: 'TCC_DENIED', error: 'Automation permission not granted for Finder.', guidance: {
            title: 'Finder access blocked by macOS',
            steps: [
              'Open System Settings → Privacy & Security → Automation',
              'Find this app (Terminal / Node / SmartyAI helper) in the list',
              'Enable the toggle next to Finder',
              'Retry the action'
            ],
            deepLink: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation'
          } }, { status: 403 });
        }
        return NextResponse.json({ success: false, errorType: 'UNKNOWN', error: String(e && e.message ? e.message : e) }, { status: 500 });
      }
    } catch (finalErr: any) {
      const stderr: string = finalErr?.stderr || finalErr?.message || '';
      if (isTccDenial(stderr)) {
        return NextResponse.json({ success: false, errorType: 'TCC_DENIED', error: 'Automation permission not granted for Finder.', guidance: {
          title: 'Finder access blocked by macOS',
          steps: [
            'Open System Settings → Privacy & Security → Automation',
            'Find this app (Terminal / Node / SmartyAI helper) in the list',
            'Enable the toggle next to Finder',
            'Retry the action'
          ],
          deepLink: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation'
        } }, { status: 403 });
      }
      return NextResponse.json({ success: false, errorType: 'UNKNOWN', error: stderr || 'osascript failed' }, { status: 500 });
    }
  }
}
