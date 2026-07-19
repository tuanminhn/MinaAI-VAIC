import "server-only";
import { cookies } from "next/headers";
import { loginDemoStudent } from "./repository";

export const STUDENT_SESSION_COOKIE = "mina_student_number";

export async function getStudentSession() {
  const token = (await cookies()).get(STUDENT_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await loginDemoStudent(token);
  } catch {
    return null;
  }
}
