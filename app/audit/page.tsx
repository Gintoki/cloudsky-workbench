import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/page-states";
import { AuditView } from "@/components/audit-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "审计日志" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "audit.read") ? <AuditView /> : <AccessDenied />}
    </WorkbenchShell>
  );
}
