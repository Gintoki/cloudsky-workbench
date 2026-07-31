import { CircleOff, LockKeyhole, ServerCrash } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <CircleOff size={14} />
      当前为产品验收环境；页面中的数值和业务描述均为虚构 Demo 数据，不代表云天畅想真实情况。
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="loading-state" aria-live="polite">
      <div>
        <div className="loading-line" />
        <div style={{ marginTop: 10, fontSize: 10 }}>正在读取授权数据…</div>
      </div>
    </div>
  );
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="error-state">
      <div className="error-card">
        <ServerCrash size={27} color="#a53b3b" />
        <h2>数据暂时无法加载</h2>
        <p>请求没有成功。系统没有使用缓存数字替代失败结果。</p>
        {retry && (
          <button
            className="button"
            onClick={retry}
            style={{ marginTop: 16 }}
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}

export function AccessDenied() {
  return (
    <div className="access-denied">
      <div className="error-card">
        <LockKeyhole size={27} color="#5d697b" />
        <h2>权限不足</h2>
        <p>
          当前角色不能查看此模块。权限判断已在服务端执行，不会通过直接访问地址绕过。
        </p>
      </div>
    </div>
  );
}
