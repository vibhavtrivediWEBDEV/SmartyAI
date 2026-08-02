import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { cloudinary } from "@/lib/storage/cloudinary";
import {
  cancelUploadReservation,
  completeUploadReservation,
  getPendingUploadReservation,
} from "@/modules/storage/storage.repository";

const requestSchema = z.object({
  uploadId: z.string().min(1),
  resourceType: z.enum(["image", "video", "raw"]),
});

export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid completion request" }, { status: 400 });
  }

  const reservation = await getPendingUploadReservation(user.id, parsed.data.uploadId);
  if (!reservation) {
    return NextResponse.json({ error: "Upload reservation not found or expired" }, { status: 404 });
  }

  const publicId = `${`smarty/users/${user.id}`}/${parsed.data.uploadId}`;

  try {
    const asset = await cloudinary.api.resource(publicId, {
      resource_type: parsed.data.resourceType,
      type: "authenticated",
    });

    if (!asset.secure_url || !Number.isSafeInteger(asset.bytes) || asset.bytes <= 0) {
      return NextResponse.json({ error: "Cloudinary asset is invalid" }, { status: 422 });
    }

    if (asset.bytes > reservation.bytes) {
      await cloudinary.uploader.destroy(publicId, { resource_type: parsed.data.resourceType, type: "authenticated" });
      await cancelUploadReservation(user.id, parsed.data.uploadId);
      return NextResponse.json({ error: "Uploaded file exceeds the reserved size" }, { status: 413 });
    }

    const file = await completeUploadReservation({
      userId: user.id,
      uploadId: parsed.data.uploadId,
      storageKey: publicId,
      secureUrl: asset.secure_url,
      resourceType: parsed.data.resourceType,
      actualBytes: asset.bytes,
    });

    if (!file) {
      await cloudinary.uploader.destroy(publicId, { resource_type: parsed.data.resourceType, type: "authenticated" });
      await cancelUploadReservation(user.id, parsed.data.uploadId);
      return NextResponse.json({ error: "Upload could not be finalized" }, { status: 409 });
    }

    return NextResponse.json({ data: file }, { status: 201 });
  } catch (error) {
    console.error("Could not finalize Cloudinary upload:", error);
    return NextResponse.json({ error: "Uploaded asset could not be verified" }, { status: 422 });
  }
}
