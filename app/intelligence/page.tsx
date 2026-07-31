import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IntelligenceView } from "@/components/intelligence-view";
import { AccessDenied } from "@/components/page-states";
import { WorkbenchShell } from "@/components/workbench-shell";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "行业动态" };
export const dynamic = "force-dynamic";

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    company?: string;
    sort?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const query = await searchParams;
  return (
    <WorkbenchShell user={user}>
      {hasPermission(user, "intelligence.read") ? (
        <IntelligenceView
          initialCategory={query.category}
          initialCompany={query.company}
          initialSort={query.sort === "oldest" ? "oldest" : "newest"}
        />
      ) : (
        <AccessDenied />
      )}
    </WorkbenchShell>
  );
}
