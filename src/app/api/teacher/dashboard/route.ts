import { NextResponse } from "next/server";
import { getTeacherDashboard } from "@/lib/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getTeacherDashboard());
}
