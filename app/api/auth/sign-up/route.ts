import { NextResponse } from "next/server";

import { signUp } from "@/lib/actions/auth.action";

export async function POST(request: Request) {
  const result = await signUp(await request.json());
  return NextResponse.json(result, { status: result.success ? 201 : 400 });
}