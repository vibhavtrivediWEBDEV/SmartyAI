import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { getFinderNode, serializeFinderNode, trashFinderNodes, updateFinderNode } from "@/modules/finder/finder.repository";
import { commitReservedStorage, releaseReservedStorage, releaseUsedStorage, reserveStorage } from "@/modules/storage/storage.repository";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  parentId: z.string().nullable().optional(),
  content: z.string().max(5 * 1024 * 1024).optional(),
  isStarred: z.boolean().optional(),
  showOnDesktop: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const item = await getFinderNode(access.user!.id, (await params).id);
  return item
    ? NextResponse.json({ data: serializeFinderNode(item) })
    : NextResponse.json({ error: "Item not found" }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const id = (await params).id;
  const current = parsed.data.content === undefined ? null : await getFinderNode(user.id, id);
  const nextBytes = parsed.data.content === undefined ? 0 : Buffer.byteLength(parsed.data.content, "utf8");
  const delta = current ? nextBytes - current.sizeBytes : 0;
  if (delta > 0 && !(await reserveStorage(user.id, user.plan, "text", delta))) {
    return NextResponse.json({ error: "Finder storage limit exceeded" }, { status: 413 });
  }
  try {
    const item = await updateFinderNode(user.id, id, parsed.data);
    if (!item && delta > 0) await releaseReservedStorage(user.id, "text", delta);
    if (item && delta > 0) await commitReservedStorage(user.id, "text", delta, delta);
    if (item && delta < 0) await releaseUsedStorage(user.id, "text", -delta);
    return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: "Item not found" }, { status: 404 });
  } catch (error) {
    if (delta > 0) await releaseReservedStorage(user.id, "text", delta);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 409 });
  }
}

export const PATCH = PUT;

export async function DELETE(_request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const deleted = await trashFinderNodes(user.id, [(await params).id]);
  return deleted ? NextResponse.json({ deleted }) : NextResponse.json({ error: "Item not found" }, { status: 404 });
}
