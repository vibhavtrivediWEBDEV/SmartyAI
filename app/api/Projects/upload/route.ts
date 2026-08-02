import { NextResponse } from "next/server";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { cloudinary } from "@/lib/storage/cloudinary";
import { isSourceFile } from "@/lib/utils/sourceFile";
import { createFinderNode, updateFinderNode } from "@/modules/finder/finder.repository";
import {
  cancelUploadReservation,
  commitReservedStorage,
  completeUploadReservation,
  createUploadReservation,
  releaseExpiredReservations,
  releaseReservedStorage,
  reserveStorage,
} from "@/modules/storage/storage.repository";

export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;
  const formData = await request.formData();
  const file = formData.get("file");
  const parentId = formData.get("parentId")?.toString() || null;
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Maximum file size is 25 MB" }, { status: 413 });

  await releaseExpiredReservations(user.id);

  if (isSourceFile(file.name, file.type)) {
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximum source file size is 8 MB" }, { status: 413 });
    }
    const hasBytes = file.size > 0;
    if (hasBytes && !(await reserveStorage(user.id, user.plan, "text", file.size))) {
      return NextResponse.json({ error: "Text storage limit exceeded" }, { status: 413 });
    }

    try {
      const content = await file.text();
      const actualBytes = Buffer.byteLength(content, "utf8");
      const saved = await createFinderNode(user.id, {
        name: file.name,
        type: "document",
        parentId,
        content,
      });
      if (hasBytes) await commitReservedStorage(user.id, "text", file.size, actualBytes);
      return NextResponse.json({ data: saved }, { status: 201 });
    } catch (error) {
      if (hasBytes) await releaseReservedStorage(user.id, "text", file.size);
      console.error("Finder source upload failed:", error);
      return NextResponse.json({ error: "Source file upload failed" }, { status: 500 });
    }
  }

  if (!(await reserveStorage(user.id, user.plan, "file", file.size))) {
    return NextResponse.json({ error: "Storage limit exceeded" }, { status: 413 });
  }

  const uploadId = await createUploadReservation({
    userId: user.id,
    kind: "file",
    bytes: file.size,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
  });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `smarty/users/${user.id}`,
          public_id: uploadId,
          type: "authenticated",
          resource_type: "auto",
        },
        (error, result) => error ? reject(error) : resolve(result),
      );
      stream.end(buffer);
    });
    const saved = await completeUploadReservation({
      userId: user.id,
      uploadId,
      storageKey: asset.public_id,
      secureUrl: asset.secure_url,
      resourceType: asset.resource_type,
      actualBytes: asset.bytes,
    });
    if (!saved) throw new Error("Could not save uploaded file");
    if (parentId) await updateFinderNode(user.id, saved.id, { parentId });
    return NextResponse.json({ data: { ...saved, type: "file", parentId } }, { status: 201 });
  } catch (error) {
    await cancelUploadReservation(user.id, uploadId);
    console.error("Finder upload failed:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
