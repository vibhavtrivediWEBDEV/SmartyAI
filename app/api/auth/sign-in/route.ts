import { NextResponse } from "next/server";

import { signIn } from "@/lib/actions/auth.action";

export async function POST(request: Request) {
  const result = await signIn(await request.json());
  return NextResponse.json(result, { status: result.success ? 200 : 401 });
}