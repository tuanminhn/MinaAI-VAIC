import { Link, NavLink, Outlet } from "react-router-dom";
import { BookOpen, ClipboardList, LayoutDashboard, LogIn, School, Users } from "lucide-react";
import { SkipLink } from "@/components/common/skip-link";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

type NavItem = {
  label: string;
  to: string;
  icon: JSX.Element;
};

const publicItems: NavItem[] = [{ label: "Đăng nhập", to: "/login", icon: <LogIn aria-hidden="true" className="size-4" /> }];
const studentItems: NavItem[] = [
  { label: "Trang chính", to: "/student", icon: <BookOpen aria-hidden="true" className="size-4" /> },
  {
    label: "Bài được giao",
    to: "/student/assignments",
    icon: <ClipboardList aria-hidden="true" className="size-4" />,
  },
];
const teacherItems: NavItem[] = [
  { label: "Tổng quan", to: "/teacher", icon: <LayoutDashboard aria-hidden="true" className="size-4" /> },
  { label: "Lớp học", to: "/teacher/classes/demo-class", icon: <School aria-hidden="true" className="size-4" /> },
  { label: "Nhóm hỗ trợ", to: "/teacher/groups", icon: <Users aria-hidden="true" className="size-4" /> },
  {
    label: "Can thiệp",
    to: "/teacher/interventions",
    icon: <ClipboardList aria-hidden="true" className="size-4" />,
  },
];

const showDevLink = import.meta.env.DEV;

function NavSection({ title, items }: { title: string; items: NavItem[] }): JSX.Element {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-[var(--text-muted)]">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "motion-standard inline-flex min-h-[var(--size-button-default)] items-center gap-2 rounded-[var(--radius-base)] border px-3 py-2 text-sm font-medium no-underline",
                isActive
                  ? "border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--text-primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]",
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function PlaceholderLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SkipLink />
      <header className="border-b bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-[var(--layout-content-max)] flex-col gap-4 px-[var(--layout-page-padding-mobile)] py-4 md:px-[var(--layout-page-padding-tablet)] xl:px-[var(--layout-page-padding-desktop)]">
          <div className="flex items-center justify-between gap-4">
            <Link to="/login" className="text-lg font-bold no-underline">
              Mina AI
            </Link>
            <span className="text-sm text-[var(--text-secondary)]">Frontend foundation</span>
          </div>
          <NavSection title="Công khai" items={publicItems} />
          <Separator />
          <NavSection title="Học sinh" items={studentItems} />
          <Separator />
          <NavSection title="Giáo viên" items={teacherItems} />
          {showDevLink ? (
            <>
              <Separator />
              <div className="flex">
                <NavLink
                  to="/dev/design-system"
                  className={({ isActive }) =>
                    cn(
                      "motion-standard inline-flex min-h-[var(--size-button-default)] items-center rounded-[var(--radius-base)] border px-3 py-2 text-sm font-medium no-underline",
                      isActive
                        ? "border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--text-primary)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]",
                    )
                  }
                >
                  Design system preview
                </NavLink>
              </div>
            </>
          ) : null}
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-[var(--layout-content-max)] px-[var(--layout-page-padding-mobile)] py-8 md:px-[var(--layout-page-padding-tablet)] xl:px-[var(--layout-page-padding-desktop)]"
      >
        <Outlet />
      </main>
    </div>
  );
}
