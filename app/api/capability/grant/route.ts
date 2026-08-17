import { NextResponse } from 'next/server';
import capabilityManager from '@/lib/capabilityManager';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const capability = body?.capability;
    const persistent = Boolean(body?.persistent);
    if (!capability) return NextResponse.json({ success: false, error: 'missing_capability' }, { status: 400 });

    // If persistent, grant and persist. If ephemeral (Allow Once), issue a signed short-lived token
    if (persistent) {
      try {
        capabilityManager.grantCapability(capability, true);
      } catch (e) {
        try { const cm = require('@/lib/capabilityManager'); if (cm && cm.grantCapability) cm.grantCapability(capability, true); } catch (ee) {}
      }
      // audit
      try { if ((capabilityManager as any).logAudit) (capabilityManager as any).logAudit('grant', capability, 'user'); } catch(e){}
      return NextResponse.json({ success: true });
    }

    // ephemeral: issue token for the client to present when invoking protected APIs
    try {
      const token = (capabilityManager as any).issueEphemeralToken ? (capabilityManager as any).issueEphemeralToken(capability, 5 * 60 * 1000) : null;
      try { if ((capabilityManager as any).logAudit) (capabilityManager as any).logAudit('grant_ephemeral', capability, 'user'); } catch(e){}
      return NextResponse.json({ success: true, token });
    } catch (e) {
      return NextResponse.json({ success: false, error: 'could_not_issue_token' }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}
