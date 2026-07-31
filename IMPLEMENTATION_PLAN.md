# Implementation Plan

## 总体策略

每个阶段均可独立验收；未通过类型检查、Lint、测试、迁移和权限检查的阶段不标记完成。

## Phase 0：设计与工程决策

交付：

- README、产品规格、架构、数据模型、实施计划、AGENTS；
- 技术风险与外部依赖清单；
- 项目目录结构；
- 角色、权限和审核状态机。

验收：

- ER 图覆盖用户要求的核心实体；
- 所有重要实体有来源、版本、审核或软删除策略；
- Wind、OpenAI、邮件和部署平台均未被虚构。

状态：**Completed**

## Phase 1：基础工作台

### 1A 基础工程

- 更新站点元数据与设计系统；
- PostgreSQL Drizzle schema 和首个迁移；
- FastAPI 服务骨架；
- `.env.example`、Dockerfile、Compose；
- 统一错误、加载、空和无权限状态。

### 1B 登录与 RBAC

- Credentials Provider；
- Session Cookie；
- 四个角色及权限种子；
- 服务端 `requireUser` / `requirePermission`；
- 登录日志和审计；
- 用户邀请、启停和修改密码的接口契约。

### 1C 首页

- 待审核、最新指标、事项、最近更新；
- 后续模块使用真实空状态，不伪造实时内容；
- 响应式侧栏、全局搜索和面包屑。

### 1D 公司事实库

- 列表/筛选/排序/分页；
- 新建、编辑、提交审核、批准；
- 来源和引用；
- 事实版本；
- Viewer 行级过滤。

### 1E 指标库

- 指标定义和结构化值；
- Actual/Budget/Forecast、场景和频率；
- 同比/环比；
- 趋势图；
- CSV 导入导出契约；
- 版本和审计。

### 1F 质量与交付

- 单元测试：RBAC、状态机、指标计算、输入验证；
- E2E：登录、Viewer 限制、Analyst 提交、Director 审核；
- 迁移和种子验证；
- Docker 启动和部署说明；
- README 进度更新。

Phase 1 验收标准：

1. 四种角色能登录且看到不同能力；
2. 直接调用 API 不能绕过权限；
3. Viewer 不可读取 Draft/Pending 内容；
4. 事实修改产生版本并写审计；
5. 指标同比/环比能处理缺失和零基数；
6. 无数据、接口失败和权限不足均有明确页面状态；
7. `typecheck`、`lint`、`test:unit`、迁移、`build`、关键 E2E 全部通过。

## Phase 2：Watchlist 与行业情报

- [ ] Companies / Securities / Watchlist；
- [ ] Mock、CSV/Excel、Manual Adapter；
- [ ] RSS 与公开 API；
- [ ] 去重、分类、实体识别、评分、重试和采集日志；
- [ ] 公告、财报与来源关联；
- [ ] Wind Adapter 接口和配置文档；
- [x] Notion `01 Projects → 行业雷达` 的受控快照导入；
- [x] 行业分类、公司/主题关联、事件时间线和摘要入库；
- [x] 行业动态列表、分类/公司筛选、时间排序和详情查看；
- [x] 服务端读取授权、Viewer Approved 过滤、来源追溯和软删除约束。

本切片刻意不包含复杂 Dashboard、AI Agent、高级分析和自动化 Notion 同步。后续自动采集需先确认合法 RSS/API 清单，并通过适配器、失败重试和采集日志接入。

外部输入：

- Watchlist 公司清单；
- 允许使用的公开信息源；
- Wind 接入方式与授权边界。

## Phase 3：估值与预测

- 可比公司；
- PS；
- DCF；
- Bear/Base/Bull；
- 版本、复制、公式展示、异常校验和 Excel；
- Python 确定性计算引擎；
- 勾稽与回归测试。

外部输入：

- 云天畅想现有 Excel 模型（可脱敏）；
- 标准估值口径、币种、税率和 WACC 约定；
- 可比公司筛选原则。

## Phase 4：叙事与 Investor Q&A

- Narrative Library；
- 版本 Diff；
- 事实、指标和来源证据图谱；
- 冲突、过期、无支撑和过度宣传提示；
- 相似问题搜索；
- 内部判断与正式口径工作流。

外部输入：

- 已审核公司介绍、融资材料和 FAQ；
- 保密等级定义；
- 各适用对象的审批规则。

## Phase 5：文档与 AI 问答

- 文件上传与 ACL；
- 文档解析和 chunk；
- pgvector；
- Mock RAG Provider；
- OpenAI Provider；
- 引用、冲突和“资料不足”策略；
- Prompt/检索/回答审计。

外部输入：

- OpenAI 项目和密钥托管方式；
- 数据驻留、安全和留存政策；
- 允许进入知识库的文件范围。

## Phase 6：生产加固

- SSO/Supabase Auth 选择；
- 生产部署、域名和 TLS；
- 备份恢复演练；
- 日志、告警和容量压测；
- 安全审查、依赖扫描和权限矩阵签字；
- 数据迁移和上线运行手册。

## 当前外部依赖与待确认

| 项目 | 何时需要 | 影响 |
|---|---|---|
| 生产部署平台与域名 | Phase 6 | 网络、Secret、备份和发布流程 |
| 公司邮件/SSO | Phase 6 | 邀请和身份生命周期 |
| Wind SDK/API 授权 | Phase 2 | 行情和财务自动同步 |
| 合法 RSS/API 清单 | Phase 2 | 行业动态覆盖与合规 |
| 脱敏估值模型 | Phase 3 | 公式和口径一致性 |
| 保密分级和审批制度 | Phase 4 | 行级权限和对外口径 |
| OpenAI 项目与安全政策 | Phase 5 | RAG Provider 与数据边界 |

## 进度记录

| 日期 | 阶段 | 状态 | 说明 |
|---|---|---|---|
| 2026-07-30 | Phase 0 | Completed | 初始设计冻结 |
| 2026-07-30 | Phase 1 | Implemented / Environment verification pending | Web、RBAC、事实、指标、审计、迁移、测试和容器配置完成；当前工作机无 Docker/PostgreSQL，待实际应用迁移 |
| 2026-07-31 | Phase 2 / 行业动态 | Implemented / Environment verification pending | 从 Notion 行业雷达整理 4 类、19 个公司/主题和 30 条事件；完成授权列表、筛选、排序、关联和详情；待有 PostgreSQL 的环境实际应用迁移与 seed |
