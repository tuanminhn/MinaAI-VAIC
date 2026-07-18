import { NextRequest, NextResponse } from "next/server";
import { runAllScenarios, runScenario } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    return NextResponse.json(body.studentId ? await runScenario(body.studentId) : await runAllScenarios());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, { status: 400 });
  }
}
