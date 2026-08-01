import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResearchKnowledgeView } from "@/components/research-knowledge-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "研究知识库" };
export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <WorkbenchShell user={user}>
      <ResearchKnowledgeView user={user} />
    </WorkbenchShell>
  );
}
