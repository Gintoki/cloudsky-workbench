import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "登录",
};
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark">CS</div>
          <div>
            <div className="brand-title">CloudSky Workbench</div>
            <div className="brand-subtitle">Capital & Strategy</div>
          </div>
        </div>
        <h1>登录内部工作台</h1>
        <p>使用独立账号访问获授权的事实、指标和研究内容。</p>
        <LoginForm />
      </section>
      <aside className="login-context">
        <div className="context-eyebrow">Decision-grade knowledge</div>
        <h2>让每个数字、观点和回复，都有来源与版本。</h2>
        <p>
          面向投融资、资本市场和战略决策的长期工作台。统一事实口径，复用财务与估值模型，并保留完整审核链路。
        </p>
        <div className="context-points">
          <div className="context-point">
            <strong>可信事实</strong>
            <span>来源、口径、期间与责任人完整关联</span>
          </div>
          <div className="context-point">
            <strong>严格审核</strong>
            <span>区分草稿、审核中与正式外部口径</span>
          </div>
          <div className="context-point">
            <strong>全程追溯</strong>
            <span>业务版本和敏感操作均可还原</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
