import { NextResponse } from "next/server";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { cloudinary } from "@/lib/storage/cloudinary";
import { getFinderNode } from "@/modules/finder/finder.repository";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const node = await getFinderNode(user.id, (await params).id);
  if (!node?.storageKey) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const signedUrl = cloudinary.url(node.storageKey, {
    resource_type: node.resourceType ?? "raw",
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
  return NextResponse.redirect(signedUrl);
}
