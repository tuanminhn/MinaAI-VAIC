import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/server/student-session";
import { getStudentPractices } from "@/lib/server/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const student = await getStudentSession();
  if (!student) return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn." }, { status: 401 });
  const practices = await getStudentPractices(student.id);
  return NextResponse.json(practices.map((practice) => ({
    id: practice.id, skillId: practice.skillId, skillName: practice.skillName, title: practice.title,
    objective: practice.objective, instructions: practice.instructions, status: practice.status,
    score: practice.score, total: practice.total,
    questions: practice.questions.map((question) => ({
      id: question.id, stem: question.stem, difficulty: question.difficulty,
      options: question.options.map((option) => ({ id: option.id, content: option.content })),
    })),
  })));
}
