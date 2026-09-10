import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUserId } from "@/lib/auth/session";
import {
  findLatestPublications,
  publishCareerArtifact,
  unpublishCareerArtifact,
} from "@/modules/publications/publication.repository";

export const dynamic = "force-dynamic";

const publicationSchema = z.object({
  kind: z.enum(["note", "workspace", "youtube"]),
  sourceId: z.string().trim().min(1).max(100),
  published: z.boolean().default(true),
});

export async function GET() {
  try {
    return NextResponse.json(
      { publications: await findLatestPublications() },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Latest public artifacts failed:", error);
    return NextResponse.json({ error: "Published work is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = publicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid publication request." }, { status: 400 });

  const { kind, sourceId, published } = parsed.data;
  if (!published) {
    const unpublished = await unpublishCareerArtifact(userId, kind, sourceId);
    return unpublished
      ? NextResponse.json({ published: false })
      : NextResponse.json({ error: "Published item not found." }, { status: 404 });
  }

  const publication = await publishCareerArtifact(userId, kind, sourceId);
  return publication
    ? NextResponse.json({ publication })
    : NextResponse.json({ error: "Career artifact not found or not owned by this account." }, { status: 404 });
}