import { NextResponse } from 'next/server';
import capabilityManager from '@/lib/capabilityManager';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const capability = body?.capability;
    if (!capability) return NextResponse.json({ success: false, error: 'missing_capability' }, { status: 400 });

    try {
      if (capabilityManager.revokeCapability) capabilityManager.revokeCapability(capability);
    } catch (e) {
      try {
        const cm = require('@/lib/capabilityManager');
        if (cm && cm.revokeCapability) cm.revokeCapability(capability);
      } catch (ee) {}
    }

    try { if ((capabilityManager as any).logAudit) (capabilityManager as any).logAudit('revoke', capability, 'user'); } catch(e){}

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}
