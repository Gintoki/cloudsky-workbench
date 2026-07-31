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

## 4. Render + Supabase 部署补充

当前公开 Demo 采用 Render Web Service + Supabase Session pooler。Web 服务使用根目录 `Dockerfile`，数据库必须使用 Supabase IPv4 Session pooler 连接串，不使用 Direct connection 或 Transaction pooler。

FastAPI 可作为第二个 Render Web Service 独立部署：

- Root directory: `services/data-ai-api`
- Runtime: Docker
- Health check path: `/health/ready`
- 环境变量：`APP_ENV=production`、`PROVIDER_MODE=mock`

`services/data-ai-api/Dockerfile` 会读取平台注入的 `PORT`，本地和 Compose 未注入时默认 `8000`。FastAPI 部署完成后，把 Web 服务的 `DATA_AI_API_URL` 设置为该服务的公网或私网地址。

生产对外使用前必须确认：`ALLOW_DEMO_AUTH=false`，GitHub 临时 PAT 已删除，公开仓库与原私有仓库的归属策略已确定。

## 5. Notion 行业雷达每日同步

仓库包含 GitHub Actions 工作流 `.github/workflows/sync-notion-intelligence.yml`，默认每天北京时间 13:10 运行，也可手动触发。同步链路为：Notion 行业雷达 → Supabase/PostgreSQL → 网站 `/intelligence`。

GitHub 需要配置以下 Secrets：

- `NOTION_TOKEN`：Notion Internal Integration token。需要把 `行业雷达` 根页面分享给该 integration。
- `DATABASE_URL`：Supabase IPv4 Session pooler 连接串，必须与 Web 服务使用同一个数据库。

可选 Repository Variables：

- `NOTION_INDUSTRY_RADAR_ROOT_PAGE_ID`：默认 `3ac46ba20d9a8144ba0ae53e401dd80a`。
- `SYNC_COMMIT_SNAPSHOT=true`：额外把 `data/notion-intelligence-snapshot.json` 提交回 GitHub。公开仓库慎用，因为这会把 Notion 研究快照公开留档。

本地仅验证解析、不写数据库：

```powershell
$env:NOTION_TOKEN="secret_xxx"
$env:NOTION_SYNC_DRY_RUN="true"
$env:NOTION_SYNC_SNAPSHOT_PATH="data/notion-intelligence-snapshot.json"
npm.cmd run sync:notion
```

同步脚本会解析各专题页中 `最新动态（倒序）` 或 `最新访谈（倒序）` 下面的 `YYYY-MM-DD｜标题` 三级标题，并将条目 upsert 到 `intelligence_items`。页面格式变化时，应先 dry-run 生成快照检查字段映射。

## 6. 生产必填环境变量

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
PUBLIC_MARKET_DATA_CACHE_HOURS=24
```

Comparable-company market data uses public end-of-day sources without an API key:
Tencent Finance supplies the prior close and market-cap basis; Eastmoney Data
Center supplies reported revenue and margins for US, China, and Hong Kong
companies. The web server caches each snapshot for
`PUBLIC_MARKET_DATA_CACHE_HOURS` (24 by default). The dashboard leaves any
unavailable field blank and labels the source, rather than displaying estimates.

## 7. 发布门禁

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

## 8. 当前未执行事项

本次开发环境没有 Docker 或 PostgreSQL 可执行程序，因此无法在本机启动 Compose、实际应用迁移或执行 seed。配置和迁移已生成，Web 构建与 Demo 模式的自动化测试已通过。
