import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResearchAgentView } from "@/components/research-agent-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Research Agent" };
export const dynamic = "force-dynamic";

export default async function ResearchAgentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <WorkbenchShell user={user}>{hasPermission(user, "agent.read") ? <ResearchAgentView user={user} /> : <AccessDenied />}</WorkbenchShell>;
}
