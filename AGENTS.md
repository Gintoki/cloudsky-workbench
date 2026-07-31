# AGENTS.md

本文件适用于整个仓库。

## Product invariants

- 不得虚构云天畅想内部数据、Wind 接口、OpenAI Key 或实时行情。
- 示例数据必须标记为 Demo，不得像真实公司口径一样展示。
- Viewer 只能读取 Approved、有效且未删除的数据。
- 所有业务权限必须在服务端检查；前端隐藏按钮只是辅助体验。
- 重要事实和指标必须保留来源、口径、期间、版本和修改人。
- AI 不能把 Draft、Pending Review 或无权限内容当作正式公司口径。

## Architecture

- 保持模块化单体；除 `services/data-ai-api` 外不要新增微服务。
- PostgreSQL 是业务事实源；不要用 localStorage 代替持久化。
- 外部数据和 AI 使用适配器接口；业务模块不得依赖供应商私有字段。
- 金额使用 decimal/numeric；时间存 UTC；界面按 Asia/Shanghai 展示。
- 重要写入、版本快照和审计日志必须在同一事务中。

## Code quality

- TypeScript strict；外部输入使用 Zod。
- 优先使用服务端组件，交互才使用客户端组件。
- 可访问性：表单有 label，状态不仅依赖颜色，交互支持键盘。
- UI 保持专业、克制、高信息密度，不使用装饰性大图表或夸张动画。
- 不提交 `.env`、密钥、生产数据、上传文件或测试生成物。

## Required checks

完成一个可验收阶段前运行：

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test:unit`
4. `npm run db:generate` 或迁移验证
5. `npm run build`
6. `npm run test:e2e`

如果某项因外部环境无法运行，必须记录实际错误和未验证范围，不能声称通过。

## Change discipline

- 保留用户已有改动，不覆盖无关文件。
- schema 变更必须附迁移和 DATA_MODEL 更新。
- 权限变更必须附授权单元测试。
- 新增外部适配器必须包含 Mock 和失败路径测试。
- 新增环境变量同时更新 `.env.example` 与 README。
