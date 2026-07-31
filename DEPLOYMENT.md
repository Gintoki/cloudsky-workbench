# Deployment & Operations

## 1. 本地 Docker 启动

前置条件：Docker Desktop 或兼容的 Docker Engine / Compose。

```bash
cp .env.example .env
docker compose up -d db
docker compose run --rm migrate
npm run db:seed
docker compose up -d web data-ai-api
```

访问：

- Web：`http://localhost:3000`
- FastAPI 健康检查：`http://localhost:8000/health/ready`

停止应用：

```bash
docker compose down
```

该命令不会删除 PostgreSQL volume。只有明确需要清空 Demo 数据时才使用 `docker compose down -v`。

## 2. 迁移策略

- 每次 schema 变更先运行 `npm run db:generate`；
- 人工审查 `db/migrations` 中的 SQL；
- 备份生产数据库；
- 发布前运行 `npm run db:migrate`；
- 迁移失败不得自动跳过；
- `db:seed` 只用于全新 Demo/验收环境，不在生产执行。

首个迁移启用 `vector` 扩展，第二个迁移为 `document_chunks.embedding` 创建 1536 维 pgvector 列。

## 3. 生产部署

建议使用支持私网与容器的单区域平台：

1. 创建托管 PostgreSQL 16，并启用 PITR、静态加密和每日备份；
2. 部署 Web 容器；
3. 部署 FastAPI 容器；
4. 只通过 Secret Manager 注入环境变量；
5. 将 Web 与数据库、FastAPI 放在私网；
6. 通过公司 VPN、SSO 或访问策略限制入口；
7. 在健康检查通过后切换流量；
8. 执行登录、Viewer 越权拦截和事实审核的发布后冒烟测试。

## 4. 生产必填环境变量

```text
APP_URL
DATABASE_URL
SESSION_SECRET
SESSION_TTL_HOURS
ALLOW_DEMO_AUTH=false
DATA_AI_API_URL
DATA_AI_API_SHARED_SECRET
```

`SESSION_SECRET` 至少 32 个随机字符。生产部署必须设置 `ALLOW_DEMO_AUTH=false`。

以下变量仅在对应 Provider 获批并配置后填写：

```text
OPENAI_API_KEY
OPENAI_MODEL
WIND_ADAPTER_ENABLED
WIND_API_ENDPOINT
```

## 5. 发布门禁

```bash
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

还应完成：

- 迁移备份与回滚演练；
- 四种角色权限抽查；
- 文件与 AI ACL 测试（对应模块启用后）；
- 日志脱敏检查；
- Demo Provider 关闭检查；
- 数据库恢复演练。

## 6. 当前未执行事项

本次开发环境没有 Docker 或 PostgreSQL 可执行程序，因此无法在本机启动 Compose、实际应用迁移或执行 seed。配置和迁移已生成，Web 构建与 Demo 模式的自动化测试已通过。
