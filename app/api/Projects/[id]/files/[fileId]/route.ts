import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { getFinderNode, updateFinderNode } from "@/modules/finder/finder.repository";
import { commitReservedStorage, releaseReservedStorage, releaseUsedStorage, reserveStorage } from "@/modules/storage/storage.repository";

const schema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  content: z.string().max(5 * 1024 * 1024).optional(),
  parentId: z.string().nullable().optional(),
});

type Context = { params: Promise<{ id: string; fileId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid file update" }, { status: 400 });
  const fileId = (await params).fileId;
  const current = parsed.data.content === undefined ? null : await getFinderNode(user.id, fileId);
  const nextBytes = parsed.data.content === undefined ? 0 : Buffer.byteLength(parsed.data.content, "utf8");
  const delta = current ? nextBytes - current.sizeBytes : 0;
  if (delta > 0 && !(await reserveStorage(user.id, user.plan, "text", delta))) {
    return NextResponse.json({ error: "Finder storage limit exceeded" }, { status: 413 });
  }
  const item = await updateFinderNode(user.id, fileId, parsed.data);
  if (!item && delta > 0) await releaseReservedStorage(user.id, "text", delta);
  if (item && delta > 0) await commitReservedStorage(user.id, "text", delta, delta);
  if (item && delta < 0) await releaseUsedStorage(user.id, "text", -delta);
  return item ? NextResponse.json(item) : NextResponse.json({ error: "File not found" }, { status: 404 });
}
