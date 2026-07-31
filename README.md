# CloudSky Capital & Strategy Workbench

云天畅想投融资与战略团队的内部数据、研究、估值与知识工作台。

当前仓库已完成 **Phase 1（基础工作台）**，并完成 **Phase 2 的行业动态切片**：登录与服务端权限、首页框架、公司事实库、指标库、审计日志，以及从 Notion 行业雷达整理入库的行业分类、公司/主题关联和事件时间线。

## 设计原则

- **可信与可追溯**：重要事实和数值必须关联来源、期间、口径、负责人和版本。
- **审核优先**：Viewer 只读取 Approved 内容；AI 未来也只能把 Approved 内容作为正式口径。
- **服务端授权**：页面隐藏不是权限控制，所有读取和写入接口均需在服务端校验。
- **可替换适配器**：认证、行情数据、Wind、RAG 和文件存储均通过接口隔离。
- **不虚构内部数据**：示例数据明确标识为 Demo，不代表云天畅想真实经营情况。
- **模块化单体优先**：4—5 人初期团队不引入不必要的微服务；Python 服务仅承担金融计算、采集和 AI。

## 文档入口

- [产品规格](./PRODUCT_SPEC.md)
- [系统架构](./ARCHITECTURE.md)
- [数据模型与 ER 图](./DATA_MODEL.md)
- [实施计划与验收标准](./IMPLEMENTATION_PLAN.md)
- [部署与运行说明](./DEPLOYMENT.md)
- [协作开发约束](./AGENTS.md)

## 技术栈

- Web：Next.js 16、React 19、TypeScript、Tailwind CSS
- 数据：PostgreSQL 16、Drizzle ORM；后续启用 pgvector
- 认证：首期内置 Credentials Provider（可替换为 Supabase Auth）
- 数据/AI 服务：Python FastAPI 接口骨架
- 测试：Vitest、Playwright
- 本地环境：Docker Compose

## 本地启动

1. 复制环境变量：

   ```bash
   cp .env.example .env
   ```

2. 启动 PostgreSQL：

   ```bash
   docker compose up -d db
   ```

3. 安装依赖并执行迁移、示例数据：

   ```bash
   npm ci
   npm run db:migrate
   npm run db:seed
   ```

4. 启动 Web：

   ```bash
   npm run dev
   ```

开发预览默认使用 `http://localhost:3000`。完整 Docker 方式见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## Demo 账号

仅在 `ALLOW_DEMO_AUTH=true` 时启用：

| 角色 | 邮箱 | 密码 |
|---|---|---|
| Administrator | `admin@cloudsky.demo` | `DemoOnly!2026` |
| Director | `director@cloudsky.demo` | `DemoOnly!2026` |
| Analyst | `analyst@cloudsky.demo` | `DemoOnly!2026` |
| Viewer | `viewer@cloudsky.demo` | `DemoOnly!2026` |

这些账号只能用于本地示例环境，生产环境必须关闭 Demo 登录并替换初始密码。

## 质量检查

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
npm run test:e2e
```

## 当前进度

- [x] 产品、架构、数据模型和实施计划
- [x] Phase 1 基础工程、登录/RBAC 与页面
- [x] PostgreSQL schema、迁移与 Demo seed
- [x] 单元测试和关键路径 E2E
- [x] Docker 与 FastAPI 配置
- [x] 行业动态：4 个分类、19 个公司/主题、30 条时间线事件
- [x] 行业动态分类筛选、公司筛选、时间排序和详情查看
- [x] Notion 来源、外部原文链接和不确定性说明可追溯
- [ ] Phase 2 的 Watchlist、RSS/公开接口和定时采集
- [ ] 在安装 Docker/PostgreSQL 的机器上实际应用迁移并验证 Compose

## 行业动态

页面入口：`/intelligence`。

当前数据来自 Notion `01 Projects → 行业雷达` 的一次性、可审计快照。数据库 seed 会写入 4 个行业分类、19 个公司/主题和 30 条事件，并保留 Notion 页面、外部原文链接、发布时间、摘要、CloudSky 相关性和“传闻/未确认”等来源限定。该实现不声称具备实时抓取能力，也没有引入 Dashboard、AI Agent 或高级分析。

服务端接口：

- `GET /api/intelligence`：授权后的列表、筛选、排序和筛选项统计；
- `GET /api/intelligence/:id`：授权后的详情和公司关联；
- Viewer 只读取 `Approved`、未软删除的内容；
- Director 和 Analyst 预留行业动态写权限，当前导入仍由受控 seed 完成。

数据库迁移为 `db/migrations/0002_tan_gorilla_man.sql`。启动 PostgreSQL 后运行：

```bash
npm run db:migrate
npm run db:seed
```

## 已验证结果

- TypeScript 类型检查：通过
- ESLint：通过
- 单元测试：5 个文件、12 项测试通过
- 生产构建：通过
- Playwright：4 条关键路径通过
- Drizzle 迁移生成：通过（35 张表、3 个迁移）
- 生产依赖安全审计：0 个已知漏洞
- FastAPI 源码语法：通过

当前工作机未安装 Docker 或 PostgreSQL，因此迁移文件已生成并审查，但无法在本机实际应用。请在具备 Docker 的环境执行 `docker compose up -d db`、`npm run db:migrate` 和 `npm run db:seed`。

完成情况会在每轮实施后更新，不以未运行的检查冒充通过。
