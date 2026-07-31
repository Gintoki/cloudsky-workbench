import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MetricsView } from "@/components/metrics-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "指标库" };
export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      <MetricsView user={user} />
    </WorkbenchShell>
  );
}
