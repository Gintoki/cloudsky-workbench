import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IntelligenceDetailView } from "@/components/intelligence-detail-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "行业动态详情" };
export const dynamic = "force-dynamic";

export default async function IntelligenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "intelligence.read") ? (
        <IntelligenceDetailView itemId={id} />
      ) : (
        <AccessDenied />
      )}
    </WorkbenchShell>
  );
}
