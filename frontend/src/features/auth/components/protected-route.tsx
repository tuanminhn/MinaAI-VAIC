import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppLoading } from "@/components/feedback/app-loading";
import { useAuth } from "@/features/auth/hooks/use-auth";
import type { UserRole } from "@/contracts/auth";

export function PublicOnlyRoute(): JSX.Element {
  const { status, user } = useAuth();

  if (status === "restoring") {
    return <AppLoading message="Dang kiem tra phien dang nhap" />;
  }

  if (status === "authenticated" && user) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return <Outlet />;
}

export function AuthenticatedRoute(): JSX.Element {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "restoring") {
    return <AppLoading message="Dang xac minh phien dang nhap" />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RoleRoute({ role }: { role: UserRole }): JSX.Element {
  const { status, user } = useAuth();

  if (status === "restoring") {
    return <AppLoading message="Dang xac minh quyen truy cap" />;
  }

  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
