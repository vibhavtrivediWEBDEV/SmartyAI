import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { findTaskByIdForUser } from "@/modules/career/career.repository";

type Context = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  const task = await findTaskByIdForUser(taskId, userId);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json({ task });
}