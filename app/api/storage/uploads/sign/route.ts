import { NextResponse } from "next/server";
import { z } from "zod";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { cloudinary } from "@/lib/storage/cloudinary";
import {
  createUploadReservation,
  releaseExpiredReservations,
  releaseReservedStorage,
  reserveStorage,
} from "@/modules/storage/storage.repository";

const requestSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  bytes: z.number().int().positive().max(25 * 1024 * 1024),
});

export async function POST(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid upload request", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { filename, mimeType, bytes } = parsed.data;
  await releaseExpiredReservations(user.id);
  const reserved = await reserveStorage(user.id, user.plan, "file", bytes);
  if (!reserved) {
    return NextResponse.json({ error: "Storage limit exceeded" }, { status: 413 });
  }

  try {
    const uploadId = await createUploadReservation({
      userId: user.id,
      kind: "file",
      bytes,
      filename,
      mimeType,
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `smarty/users/${user.id}`;
    const publicId = uploadId;
    const signature = cloudinary.utils.api_sign_request(
      { folder, public_id: publicId, timestamp, type: "authenticated" },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return NextResponse.json({
      uploadId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder,
      publicId,
      deliveryType: "authenticated",
      timestamp,
      signature,
      expiresInSeconds: 15 * 60,
    });
  } catch (error) {
    await releaseReservedStorage(user.id, "file", bytes);
    console.error("Could not create upload reservation:", error);
    return NextResponse.json({ error: "Could not prepare upload" }, { status: 500 });
  }
}
