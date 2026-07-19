import { z } from "zod";
import type { AuthSession } from "@/contracts/auth";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui long nhap ten dang nhap."),
  password: z.string().min(1, "Vui long nhap mat khau."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const authUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  role: z.enum(["student", "teacher"]),
  schoolName: z.string().nullable().optional().transform((value) => value ?? undefined),
  classroomName: z.string().nullable().optional().transform((value) => value ?? undefined),
});

export const authSessionSchema: z.ZodType<AuthSession> = z.object({
  user: authUserSchema,
});

export const authUserSchemaForApi = authUserSchema;
