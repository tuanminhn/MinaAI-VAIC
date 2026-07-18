import { lazy, Suspense } from "react";
import {
  Navigate,
  createBrowserRouter,
  createMemoryRouter,
  type RouteObject,
} from "react-router-dom";
import { AppLoading } from "@/components/feedback/app-loading";
import {
  AuthenticatedRoute,
  PublicOnlyRoute,
  RoleRoute,
} from "@/features/auth/components/protected-route";
import { StudentShell } from "@/features/auth/components/student-shell";
import { TeacherShell } from "@/features/auth/components/teacher-shell";

const LoginPage = lazy(() => import("@/routes/login-page"));
const StudentHomePage = lazy(() => import("@/routes/student-home-page"));
const StudentAssignmentsPage = lazy(() => import("@/routes/student-assignments-page"));
const StudentDiagnosticPage = lazy(() => import("@/routes/student-diagnostic-page"));
const StudentRemediationPage = lazy(() => import("@/routes/student-remediation-page"));
const StudentTransferPage = lazy(() => import("@/routes/student-transfer-page"));
const StudentResultPage = lazy(() => import("@/routes/student-result-page"));
const TeacherDashboardPage = lazy(() => import("@/routes/teacher-dashboard-page"));
const TeacherClassPage = lazy(() => import("@/routes/teacher-class-page"));
const TeacherStudentPage = lazy(() => import("@/routes/teacher-student-page"));
const TeacherGroupsPage = lazy(() => import("@/routes/teacher-groups-page"));
const TeacherInterventionsPage = lazy(() => import("@/routes/teacher-interventions-page"));
const ForbiddenPage = lazy(() => import("@/routes/forbidden-page"));
const NotFoundPage = lazy(() => import("@/routes/not-found-page"));

function withSuspense(element: JSX.Element): JSX.Element {
  return <Suspense fallback={<AppLoading />}>{element}</Suspense>;
}

export type BuildRoutesOptions = {
  includeDevRoutes: boolean;
};

function getDevRoutes(includeDevRoutes: boolean): RouteObject[] {
  if (!includeDevRoutes) {
    return [];
  }

  const DevDesignSystemPage = lazy(() => import("@/routes/dev-design-system-page"));
  return [{ path: "dev/design-system", element: withSuspense(<DevDesignSystemPage />) }];
}

export function buildAppRoutes({
  includeDevRoutes,
}: BuildRoutesOptions): RouteObject[] {
  return [
    {
      path: "/",
      children: [
        { index: true, element: <Navigate to="/login" replace /> },
        {
          element: <PublicOnlyRoute />,
          children: [{ path: "login", element: withSuspense(<LoginPage />) }],
        },
        {
          element: <AuthenticatedRoute />,
          children: [
            {
              path: "student",
              element: <RoleRoute role="student" />,
              children: [
                {
                  element: <StudentShell />,
                  children: [
                    { index: true, element: withSuspense(<StudentHomePage />) },
                    { path: "assignments", element: withSuspense(<StudentAssignmentsPage />) },
                    {
                      path: "diagnostic/:sessionId",
                      element: withSuspense(<StudentDiagnosticPage />),
                    },
                    {
                      path: "remediation/:sessionId",
                      element: withSuspense(<StudentRemediationPage />),
                    },
                    {
                      path: "transfer/:sessionId",
                      element: withSuspense(<StudentTransferPage />),
                    },
                    {
                      path: "result/:sessionId",
                      element: withSuspense(<StudentResultPage />),
                    },
                  ],
                },
              ],
            },
            {
              path: "teacher",
              element: <RoleRoute role="teacher" />,
              children: [
                {
                  element: <TeacherShell />,
                  children: [
                    { index: true, element: withSuspense(<TeacherDashboardPage />) },
                    {
                      path: "classes/:classId",
                      element: withSuspense(<TeacherClassPage />),
                    },
                    {
                      path: "students/:studentId",
                      element: withSuspense(<TeacherStudentPage />),
                    },
                    { path: "groups", element: withSuspense(<TeacherGroupsPage />) },
                    {
                      path: "interventions",
                      element: withSuspense(<TeacherInterventionsPage />),
                    },
                  ],
                },
              ],
            },
          ],
        },
        ...getDevRoutes(includeDevRoutes),
        { path: "403", element: withSuspense(<ForbiddenPage />) },
        { path: "404", element: withSuspense(<NotFoundPage />) },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
  ];
}

export function createAppRouter() {
  return createBrowserRouter(buildAppRoutes({ includeDevRoutes: import.meta.env.DEV }));
}

export function createTestRouter(
  initialEntries: string[] = ["/login"],
  options: BuildRoutesOptions = { includeDevRoutes: true },
) {
  return createMemoryRouter(buildAppRoutes(options), { initialEntries });
}
