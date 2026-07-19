export type GuardDecision = {
  allowed: boolean;
  redirectTo?: "/403" | "/login";
};

export type RouteGuardContext = {
  routeId: string;
};

export interface RouteGuard {
  canActivate(context: RouteGuardContext): Promise<GuardDecision> | GuardDecision;
}

export const allowAllGuard: RouteGuard = {
  canActivate() {
    return { allowed: true };
  },
};
