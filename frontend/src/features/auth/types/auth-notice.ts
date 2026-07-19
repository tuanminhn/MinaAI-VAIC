export type AuthNoticeVariant = "error" | "warning" | "info";

export type AuthNotice = {
  title: string;
  message: string;
  variant: AuthNoticeVariant;
};
