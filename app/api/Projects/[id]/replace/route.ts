import { NextResponse } from "next/server";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { cloudinary } from "@/lib/storage/cloudinary";
import { getFinderNode, replaceFinderAsset } from "@/modules/finder/finder.repository";
import { releaseReservedStorage, reserveStorage } from "@/modules/storage/storage.repository";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const id = (await params).id;
  const existing = await getFinderNode(user.id, id);
  if (!existing || existing.kind === "folder") return NextResponse.json({ error: "File not found" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No replacement file provided" }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Maximum file size is 25 MB" }, { status: 413 });
  const reservedBytes = Math.max(0, file.size - existing.sizeBytes);
  if (reservedBytes && !(await reserveStorage(user.id, user.plan, "file", reservedBytes))) {
    return NextResponse.json({ error: "Storage limit exceeded" }, { status: 413 });
  }

  let uploadedPublicId: string | undefined;
  let uploadedResourceType: "image" | "video" | "raw" = "raw";
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `smarty/users/${user.id}`,
          public_id: `replacement-${id}-${Date.now()}`,
          type: "authenticated",
          resource_type: "auto",
        },
        (error, result) => error ? reject(error) : resolve(result),
      );
      stream.end(buffer);
    });
    uploadedPublicId = asset.public_id;
    uploadedResourceType = asset.resource_type;
    const result = await replaceFinderAsset(user.id, id, {
      mimeType: file.type || existing.mimeType || "application/octet-stream",
      sizeBytes: asset.bytes,
      storageKey: asset.public_id,
      secureUrl: asset.secure_url,
      resourceType: asset.resource_type,
      reservedBytes,
    });
    if (!result) throw new Error("Could not update Finder file");

    if (result.previousStorageKey) {
      await cloudinary.uploader.destroy(result.previousStorageKey, {
        resource_type: result.previousResourceType ?? "raw",
        type: "authenticated",
        invalidate: true,
      }).catch(() => undefined);
    }
    return NextResponse.json({ data: result.item });
  } catch (error) {
    if (reservedBytes) await releaseReservedStorage(user.id, "file", reservedBytes);
    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: uploadedResourceType, type: "authenticated" }).catch(() => undefined);
    }
    console.error("Finder replacement failed:", error);
    return NextResponse.json({ error: "Could not replace file" }, { status: 500 });
  }
}
