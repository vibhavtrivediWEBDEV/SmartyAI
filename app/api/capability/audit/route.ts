import { NextResponse } from 'next/server';
import capabilityManager from '@/lib/capabilityManager';

export async function GET() {
  try {
    if ((capabilityManager as any).getAuditLogs) {
      const logs = (capabilityManager as any).getAuditLogs();
      return NextResponse.json({ success: true, logs });
    }
    return NextResponse.json({ success: true, logs: [] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e?.message || e) }, { status: 500 });
  }
}
