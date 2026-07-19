import { NextResponse } from "next/server";
import { STUDENT_SESSION_COOKIE, getStudentSession } from "@/lib/server/student-session";
import { loginOrRegisterDemoStudent } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function GET() {
  const student = await getStudentSession();
  return student ? NextResponse.json(student) : NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { displayName?: string; studentNumber?: string };
    if (!body.studentNumber?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập số báo danh." }, { status: 400 });
    }
    const student = await loginOrRegisterDemoStudent(body.displayName, body.studentNumber);
    const response = NextResponse.json(student);
    response.cookies.set(STUDENT_SESSION_COOKIE, student.studentNumber, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60,
    });
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const message = code === "INVALID_STUDENT_NAME"
      ? "Họ tên không hợp lệ hoặc dài quá 80 ký tự."
      : code === "INVALID_STUDENT_NUMBER"
        ? "Số báo danh chỉ được gồm chữ số và dài tối đa 40 ký tự."
        : "Chưa thể mở hoặc tạo tài khoản học sinh.";
    return NextResponse.json({ error: message }, { status: code === "STUDENT_ACCOUNT_CONFLICT" ? 409 : 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ loggedOut: true });
  response.cookies.set(STUDENT_SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
