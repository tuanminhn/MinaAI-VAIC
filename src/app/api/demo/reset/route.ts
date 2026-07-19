import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(await resetDemo());
}
