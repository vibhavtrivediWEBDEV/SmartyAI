import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { createFinderNode, listFinderNodes, trashFinderNodes } from "@/modules/finder/finder.repository";
import { commitReservedStorage, releaseReservedStorage, reserveStorage } from "@/modules/storage/storage.repository";

const createSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().default("folder"),
  parentId: z.string().nullable().optional(),
  content: z.string().max(5 * 1024 * 1024).optional(),
  url: z.string().url().optional(),
});

export async function GET(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const includeTrash = new URL(request.url).searchParams.get("trash") === "true";
  return NextResponse.json({ data: await listFinderNodes(user.id, includeTrash) });
}

export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Finder item", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  const bytes = Buffer.byteLength(parsed.data.content ?? "", "utf8");
  if (bytes && !(await reserveStorage(user.id, user.plan, "text", bytes))) {
    return NextResponse.json({ error: "Finder storage limit exceeded" }, { status: 413 });
  }
  try {
    const data = await createFinderNode(user.id, parsed.data);
    if (bytes) await commitReservedStorage(user.id, "text", bytes, bytes);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (bytes) await releaseReservedStorage(user.id, "text", bytes);
    throw error;
  }
}

export async function DELETE(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids : body?.id ? [body.id] : [];
  if (!ids.length) return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
  return NextResponse.json({ deleted: await trashFinderNodes(user.id, ids) });
}
