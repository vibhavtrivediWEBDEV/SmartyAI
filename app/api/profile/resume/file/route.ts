import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { cloudinary } from "@/lib/storage/cloudinary";
import { findUserById } from "@/modules/users/user.repository";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await findUserById(sessionUser.id);
  if (!user?.resumeStorageKey) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const signedUrl = cloudinary.url(user.resumeStorageKey, {
    resource_type: user.resumeResourceType ?? "raw",
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
  const asset = await fetch(signedUrl, { cache: "no-store" });
  if (!asset.ok || !asset.body) {
    return NextResponse.json({ error: "Stored resume could not be read" }, { status: 502 });
  }

  const safeName = (user.resumeFileName ?? "Resume.pdf").replace(/["\r\n]/g, "");
  return new Response(asset.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
