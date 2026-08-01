import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResearchItemView } from "@/components/research-item-view";
import { WorkbenchShell } from "@/components/workbench-shell";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "研究条目" };
export const dynamic = "force-dynamic";

export default async function ResearchItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;
  return (
    <WorkbenchShell user={user}>
      <ResearchItemView itemId={id} user={user} />
    </WorkbenchShell>
  );
}
