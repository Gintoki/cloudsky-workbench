import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EacDataView } from "@/components/eac-data-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "EAC动态数据" };
export const dynamic = "force-dynamic";

export default async function EacDataPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <WorkbenchShell user={user}>{hasPermission(user, "metrics.read") ? <EacDataView /> : <AccessDenied />}</WorkbenchShell>;
}
