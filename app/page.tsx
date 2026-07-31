import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      <DashboardView user={user} />
    </WorkbenchShell>
  );
}
