import { Outlet, useLocation } from "react-router-dom";
import { SkipLink } from "@/components/common/skip-link";
import { ShellHeader, type ShellNavItem } from "@/features/auth/components/shell-header";
import { useAuth } from "@/features/auth/hooks/use-auth";

const studentNavItems: ShellNavItem[] = [
  { label: "Trang chính", to: "/student" },
  { label: "Bài được giao", to: "/student/assignments" },
];

export function StudentShell(): JSX.Element {
  const { user } = useAuth();
  const location = useLocation();
  const isFocusedLearningRoute =
    location.pathname.includes("/student/diagnostic/") ||
    location.pathname.includes("/student/remediation/") ||
    location.pathname.includes("/student/transfer/") ||
    location.pathname.includes("/student/result/");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SkipLink />
      <ShellHeader
        brandSubtitle={isFocusedLearningRoute ? "Đang thực hiện bài học" : "Không gian học sinh"}
        userName={user?.displayName ?? "Học sinh"}
        userMeta={user?.classroomName ?? undefined}
        navItems={isFocusedLearningRoute ? [] : studentNavItems}
        compactLabel="điều hướng học sinh"
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[var(--layout-content-max)] px-[var(--layout-page-padding-mobile)] py-8 md:px-[var(--layout-page-padding-tablet)] xl:px-[var(--layout-page-padding-desktop)]"
      >
        <Outlet />
      </main>
    </div>
  );
}
