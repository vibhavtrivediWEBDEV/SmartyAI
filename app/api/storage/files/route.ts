import { NextResponse } from "next/server";

import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { getStorageUsage, listFileNodes } from "@/modules/storage/storage.repository";
import { getStorageLimit } from "@/modules/storage/storage-quota";

export async function GET(request: Request) {
  const access = await requireFinderSubscription();
  if (access.response) return access.response;
  const user = access.user!;

  const parentId = new URL(request.url).searchParams.get("parentId");
  const [files, usage] = await Promise.all([
    listFileNodes(user.id, parentId),
    getStorageUsage(user.id),
  ]);

  return NextResponse.json({
    data: files,
    storage: {
      usage,
      limitBytes: getStorageLimit(user.plan),
    },
  });
}
