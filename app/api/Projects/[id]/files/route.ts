import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { createFinderNode } from "@/modules/finder/finder.repository";
import { commitReservedStorage, releaseReservedStorage, reserveStorage } from "@/modules/storage/storage.repository";

const schema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().default("document"),
  content: z.string().max(5 * 1024 * 1024).optional(),
  url: z.string().url().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  const bytes = Buffer.byteLength(parsed.data.content ?? "", "utf8");
  if (bytes && !(await reserveStorage(user.id, user.plan, "text", bytes))) {
    return NextResponse.json({ error: "Finder storage limit exceeded" }, { status: 413 });
  }
  try {
    const data = await createFinderNode(user.id, { ...parsed.data, parentId: (await params).id });
    if (bytes) await commitReservedStorage(user.id, "text", bytes, bytes);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (bytes) await releaseReservedStorage(user.id, "text", bytes);
    throw error;
  }
}
