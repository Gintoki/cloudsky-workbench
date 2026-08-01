import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InvestorCrmView } from "@/components/investor-crm-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "投资人 CRM" };
export const dynamic = "force-dynamic";

export default async function InvestorCrmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "investor.read") ? <InvestorCrmView canCreate={hasPermission(user, "investor.create")} canUpdate={hasPermission(user, "investor.update")} /> : <AccessDenied />}
    </WorkbenchShell>
  );
}
