# 研究知识库重构计划

## 当前状态

- `/facts` 是以 `company_facts` 为核心的通用事实录入页；Command Center 的待办与既有指标仍依赖其 API。
- `/intelligence` 是行业动态流，包含行业、公司与外部来源，适合继续承担动态订阅，不应被本次重构替换。
- `organizations` 已是工作台租户表，关联用户、权限和审计日志，不能承担外部机构实体的含义。
- 已有公司研究模块使用 `research_reports` 及其附属表，服务于单家公司深度研究，应保持独立。

## 信息架构

前台研究知识库入口改为 `/research`，仅展示三个一级维度：

1. 市场情况（`MARKET`）
2. 技术路线（`TECHNOLOGY`）
3. 盈利模式（`BUSINESS_MODEL`）

内容卡片围绕事件、判断、CloudSky 影响和下一步行动组织。事实、来源和结构化指标保留在研究条目后台，不再作为独立前台产品。

## 数据模型

- `research_items`：研究内容、判断、行动、状态、负责人和可扩展 `details`。
- `research_sources`：每条研究的原始来源与原文摘录。
- `research_organizations`：公司、大学、实验室、投资机构、客户和政府机构等外部实体；使用该名称避免与租户表 `organizations` 冲突。
- `research_item_organizations`：研究与外部机构的多对多关联。
- `research_item_versions`：不可变快照，用于统一详情页的历史版本。

所有表按现有 PostgreSQL 租户边界增加 `organization_id`，保留作者、审核人、时间戳和审计日志。向量字段保持可空，尚未接入嵌入服务时不写入。

## 迁移与兼容

- 不删除或修改 `company_facts`、`fact_sources`、`fact_versions`、`intelligence_items` 和公司研究表。
- 现有 `/api/facts` 与 `/facts` 路由保持可用，供已有仪表盘和内部兼容入口使用。
- 左侧导航的“研究知识库”切换至 `/research`。
- 新迁移只新增表、枚举和索引；种子数据使用幂等写入，不覆盖人工录入记录。

## 验收标准

- 可创建、编辑、筛选并查看三类研究条目。
- 每条条目保存研究判断、CloudSky 影响、行动、日期、负责人、状态、置信度与至少一个来源。
- 技术路线可在“技术趋势 / 高校及科研合作”间筛选；盈利模式可查看案例与机会分类。
- 统一详情页展示证据、组织、来源、行动和版本历史。
- 原有事实、行业动态、公司研究、指标和权限不回归。
