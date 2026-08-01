import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompanyResearchView } from "@/components/company-research-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "公司研究" };
export const dynamic = "force-dynamic";

export default async function CompanyResearchDetailPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { companyId } = await params;
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "research.read") ? (
        <CompanyResearchView
          canApprove={hasPermission(user, "research.approve")}
          canCreate={hasPermission(user, "research.create")}
          canEdit={hasPermission(user, "research.update")}
          canSubmit={hasPermission(user, "research.submit")}
          companyId={companyId}
        />
      ) : (
        <AccessDenied />
      )}
    </WorkbenchShell>
  );
}
