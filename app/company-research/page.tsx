import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanyResearchListView } from "@/components/company-research-list-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "公司研究" };
export const dynamic = "force-dynamic";

export default async function CompanyResearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "research.read") ? (
        <CompanyResearchListView canCreate={hasPermission(user, "research.create")} />
      ) : (
        <AccessDenied />
      )}
    </WorkbenchShell>
  );
}
