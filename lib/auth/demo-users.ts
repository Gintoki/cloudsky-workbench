import type { AuthUser, RoleCode } from "./types";

export const DEMO_PASSWORD = "DemoOnly!2026";
export const DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";

const definitions: Array<{
  id: string;
  email: string;
  displayName: string;
  role: RoleCode;
}> = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    email: "admin@cloudsky.demo",
    displayName: "系统管理员（Demo）",
    role: "ADMINISTRATOR",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    email: "director@cloudsky.demo",
    displayName: "投融资总监（Demo）",
    role: "DIRECTOR",
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    email: "analyst@cloudsky.demo",
    displayName: "分析师（Demo）",
    role: "ANALYST",
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    email: "viewer@cloudsky.demo",
    displayName: "只读用户（Demo）",
    role: "VIEWER",
  },
];

export const demoUsers: AuthUser[] = definitions.map((definition) => ({
  ...definition,
  organizationId: DEMO_ORGANIZATION_ID,
}));

export function authenticateDemoUser(
  email: string,
  password: string,
): AuthUser | null {
  if (process.env.ALLOW_DEMO_AUTH !== "true" || password !== DEMO_PASSWORD) {
    return null;
  }
  return (
    demoUsers.find(
      (user) => user.email.toLocaleLowerCase() === email.toLocaleLowerCase(),
    ) ?? null
  );
}
