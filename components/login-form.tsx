"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const accounts = [
  ["Director", "director@cloudsky.demo"],
  ["Analyst", "analyst@cloudsky.demo"],
  ["Viewer", "viewer@cloudsky.demo"],
  ["Administrator", "admin@cloudsky.demo"],
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("director@cloudsky.demo");
  const [password, setPassword] = useState("DemoOnly!2026");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message ?? "登录失败。");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("服务暂时不可用，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <div className="form-group">
        <label htmlFor="email">邮箱</label>
        <input
          autoComplete="email"
          className="form-input"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">密码</label>
        <input
          autoComplete="current-password"
          className="form-input"
          id="password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}
      <button className="button primary" disabled={submitting} type="submit">
        {submitting ? "正在验证…" : "登录工作台"}
        {!submitting && <ArrowRight size={14} />}
      </button>

      <div className="demo-accounts">
        <div className="demo-accounts-title">快速切换 Demo 角色</div>
        <div className="demo-account-list">
          {accounts.map(([role, account]) => (
            <button
              className="demo-account"
              key={account}
              onClick={() => {
                setEmail(account);
                setPassword("DemoOnly!2026");
              }}
              type="button"
            >
              <strong>{role}</strong>
              {account}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          color: "#778295",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
        }}
      >
        <ShieldCheck size={13} />
        所有业务权限均在服务端校验
      </div>
    </form>
  );
}
