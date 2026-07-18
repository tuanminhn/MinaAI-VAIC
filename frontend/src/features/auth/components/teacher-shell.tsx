import { ClipboardList, LayoutDashboard, School, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { SkipLink } from "@/components/common/skip-link";
import { ShellHeader } from "@/features/auth/components/shell-header";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils/cn";

const teacherNavItems = [
  {
    label: "Tổng quan",
    to: "/teacher",
    icon: <LayoutDashboard aria-hidden="true" className="size-4" />,
  },
  {
    label: "Lớp học",
    to: "/teacher",
    icon: <School aria-hidden="true" className="size-4" />,
  },
  {
    label: "Nhóm hỗ trợ",
    to: "/teacher/groups",
    icon: <Users aria-hidden="true" className="size-4" />,
  },
  {
    label: "Can thiệp",
    to: "/teacher/interventions",
    icon: <ClipboardList aria-hidden="true" className="size-4" />,
  },
];

export function TeacherShell(): JSX.Element {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[var(--layout-sidebar-teacher)_1fr]">
      <SkipLink />
      <aside className="hidden border-r border-[var(--border)] bg-[var(--surface)] lg:block">
        <div className="flex h-full flex-col gap-6 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Mina AI
            </p>
            <h1 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              Không gian giáo viên
            </h1>
            <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              {user?.displayName ?? "Giáo viên"}
            </p>
            {user?.schoolName ? (
              <p className="text-sm text-[var(--text-secondary)]">{user.schoolName}</p>
            ) : null}
          </div>

          <nav className="grid gap-2" aria-label="Điều hướng giáo viên">
            {teacherNavItems.map((item) => (
              <NavLink
                key={`${item.to}:${item.label}`}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "motion-standard inline-flex min-h-[var(--size-button-default)] items-center gap-2 rounded-[var(--radius-base)] px-3 py-2 text-sm font-medium no-underline",
                    isActive
                      ? "bg-[var(--teacher-surface-bg)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0">
        <ShellHeader
          brandSubtitle="Không gian giáo viên"
          userName={user?.displayName ?? "Giáo viên"}
          userMeta={user?.schoolName ?? undefined}
          navItems={teacherNavItems.map(({ label, to }) => ({ label, to }))}
          compactLabel="điều hướng bổ sung giáo viên"
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[var(--layout-content-max)] px-[var(--layout-page-padding-mobile)] py-8 md:px-[var(--layout-page-padding-tablet)] xl:px-[var(--layout-page-padding-desktop)]"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
