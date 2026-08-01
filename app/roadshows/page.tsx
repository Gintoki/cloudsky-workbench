import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/page-states";
import { RoadshowView } from "@/components/roadshow-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "投资人路演记录" };
export const dynamic = "force-dynamic";

export default async function RoadshowsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "investor.read") ? <RoadshowView canCreate={hasPermission(user, "investor.create")} /> : <AccessDenied />}
    </WorkbenchShell>
  );
}
