export type MockEnvironment = {
  isDev: boolean;
  enableMsw?: string;
};

export function shouldEnableMsw(environment: MockEnvironment): boolean {
  return environment.isDev && environment.enableMsw === "true";
}
