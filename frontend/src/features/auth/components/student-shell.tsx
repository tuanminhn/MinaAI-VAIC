import { Outlet, useLocation } from "react-router-dom";
import { SkipLink } from "@/components/common/skip-link";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ShellHeader, type ShellNavItem } from "@/features/auth/components/shell-header";

const studentNavItems: ShellNavItem[] = [
  { label: "Trang chính", to: "/student" },
  { label: "Bài được giao", to: "/student/assignments" },
];

export function StudentShell(): JSX.Element {
  const { user } = useAuth();
  const location = useLocation();
  const isDiagnosticRoute = location.pathname.includes("/student/diagnostic/");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SkipLink />
      <ShellHeader
        brandSubtitle={isDiagnosticRoute ? "Đang làm bài chẩn đoán" : "Không gian học sinh"}
        userName={user?.displayName ?? "Học sinh"}
        userMeta={user?.classroomName}
        navItems={isDiagnosticRoute ? [] : studentNavItems}
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
