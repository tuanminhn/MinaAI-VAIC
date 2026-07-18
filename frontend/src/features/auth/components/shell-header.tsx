import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLogoutMutation } from "@/features/auth/hooks/use-auth-mutations";
import { cn } from "@/lib/utils/cn";

export type ShellNavItem = {
  label: string;
  to: string;
};

type ShellHeaderProps = {
  brandSubtitle: string;
  userName: string;
  userMeta?: string;
  navItems: ShellNavItem[];
  compactLabel: string;
};

function shellLinkClass(isActive: boolean): string {
  return cn(
    "motion-standard inline-flex min-h-[var(--size-button-default)] items-center rounded-[var(--radius-base)] px-3 py-2 text-sm font-medium no-underline",
    isActive
      ? "bg-[var(--primary-subtle)] text-[var(--text-primary)]"
      : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
  );
}

export function ShellHeader({
  brandSubtitle,
  userName,
  userMeta,
  navItems,
  compactLabel,
}: ShellHeaderProps): JSX.Element {
  const logoutMutation = useLogoutMutation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasNavigation = navItems.length > 0;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex w-full max-w-[var(--layout-content-max)] flex-col gap-4 px-[var(--layout-page-padding-mobile)] py-4 md:px-[var(--layout-page-padding-tablet)] xl:px-[var(--layout-page-padding-desktop)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Mina AI
            </p>
            <p className="text-sm text-[var(--text-primary)]">{brandSubtitle}</p>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
              {userMeta ? <p className="text-sm text-[var(--text-secondary)]">{userMeta}</p> : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void logoutMutation.mutateAsync();
              }}
              isLoading={logoutMutation.isPending}
              loadingLabel="Đang đăng xuất"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Đăng xuất
            </Button>
          </div>

          {hasNavigation ? (
            <button
              type="button"
              className="motion-standard inline-flex min-h-[var(--size-button-default)] min-w-[var(--size-button-default)] items-center justify-center rounded-[var(--radius-base)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:hidden"
              aria-expanded={isMenuOpen}
              aria-controls="shell-mobile-menu"
              aria-label={isMenuOpen ? `Đóng menu ${compactLabel}` : `Mở menu ${compactLabel}`}
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            >
              {isMenuOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          ) : null}
        </div>

        {hasNavigation ? (
          <nav className="hidden flex-wrap gap-2 md:flex" aria-label={compactLabel}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => shellLinkClass(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        {hasNavigation && isMenuOpen ? (
          <div
            id="shell-mobile-menu"
            className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 md:hidden"
          >
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{userName}</p>
              {userMeta ? <p className="text-sm text-[var(--text-secondary)]">{userMeta}</p> : null}
            </div>
            <Separator />
            <nav className="grid gap-2" aria-label={compactLabel}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => shellLinkClass(isActive)}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => {
                setIsMenuOpen(false);
                void logoutMutation.mutateAsync();
              }}
              isLoading={logoutMutation.isPending}
              loadingLabel="Đang đăng xuất"
            >
              <LogOut aria-hidden="true" className="size-4" />
              Đăng xuất
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
