import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    // Attempt to open the helper app by bundle name
    // This requires the helper app to be installed in /Applications or be findable by Spotlight
    const cmd = `open -a "SmartyFinderHelper"`;
    await execAsync(cmd);
    // Poll the helper /health endpoint until it responds or we hit a timeout
    const healthUrl = 'http://127.0.0.1:45678/health';
    const maxAttempts = 30;
    let attempt = 0;
    let delay = 250; // ms
    const start = Date.now();
    let lastErr: any = null;
    while (attempt < maxAttempts) {
      try {
        const res = await fetch(healthUrl, { method: 'GET' });
        if (res.ok) {
          try {
            const json = await res.json().catch(() => null);
            if (!json || json.status === 'ok') {
              const elapsed = Date.now() - start;
              return NextResponse.json({ success: true, attempts: attempt + 1, elapsedMs: elapsed });
            }
          } catch (_) {
            const elapsed = Date.now() - start;
            return NextResponse.json({ success: true, attempts: attempt + 1, elapsedMs: elapsed });
          }
        }
      } catch (err) {
        lastErr = String(err?.message || err);
      }
      // exponential backoff
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
      delay = Math.min(3000, Math.round(delay * 1.9));
    }

    return NextResponse.json({ success: false, error: 'helper_not_responding', attempts: attempt, elapsedMs: Date.now() - start, lastError: lastErr, guidance: {
      title: 'SmartyFinderHelper did not start',
      steps: [
        'Ensure SmartyFinderHelper.app is installed in /Applications and has been launched at least once',
        'Check macOS may ask you to allow the app to run — open System Settings → Privacy & Security',
        'If necessary, start the app from Finder or Xcode and retry'
      ]
    } }, { status: 504 });
  } catch (e: any) {
    // If open fails, return helpful guidance
    return NextResponse.json({ success: false, error: String(e?.message || e), guidance: {
      title: 'Could not start SmartyFinderHelper',
      steps: [
        'Ensure SmartyFinderHelper.app is built and placed in /Applications or launched once from Xcode',
        'If needed, open the app manually from Finder',
        'Then retry starting the helper'
      ]
    } }, { status: 500 });
  }
}
