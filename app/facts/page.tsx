import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FactsView } from "@/components/facts-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "公司事实库" };
export const dynamic = "force-dynamic";

export default async function FactsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      <FactsView user={user} />
    </WorkbenchShell>
  );
}
