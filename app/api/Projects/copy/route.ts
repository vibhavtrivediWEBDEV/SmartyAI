import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { copyFinderNodes, getCopiedTextBytes } from "@/modules/finder/finder.repository";
import { commitReservedStorage, releaseReservedStorage, reserveStorage } from "@/modules/storage/storage.repository";

const schema = z.object({
  sourceIds: z.array(z.string()).min(1).max(100),
  targetParentId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid copy request" }, { status: 400 });
  const textBytes = await getCopiedTextBytes(user.id, parsed.data.sourceIds);
  if (textBytes && !(await reserveStorage(user.id, user.plan, "text", textBytes))) {
    return NextResponse.json({ error: "Finder storage limit exceeded" }, { status: 413 });
  }
  try {
    const data = await copyFinderNodes(user.id, parsed.data.sourceIds, parsed.data.targetParentId);
    if (textBytes) await commitReservedStorage(user.id, "text", textBytes, textBytes);
    return NextResponse.json({ data });
  } catch (error) {
    if (textBytes) await releaseReservedStorage(user.id, "text", textBytes);
    throw error;
  }
}
