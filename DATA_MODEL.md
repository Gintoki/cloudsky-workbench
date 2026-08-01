# Data Model

## 1. 建模原则

- 主键使用 UUID；
- 重要业务表包含 `organization_id`；
- 重要业务数据软删除；
- 当前记录与不可变版本表分离；
- 来源、文件和引用是一级实体；
- 多对多关系使用显式关联表；
- 金额和比率使用 `numeric`；
- 审计日志只追加；
- 敏感枚举在数据库和 TypeScript 中保持一致。

## 2. ER 图

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : contains
    USERS }o--o{ ROLES : user_roles
    ROLES }o--o{ PERMISSIONS : role_permissions
    USERS ||--o{ SESSIONS : owns
    USERS ||--o{ AUDIT_LOGS : acts

    ORGANIZATIONS ||--o{ COMPANY_FACTS : owns
    COMPANY_FACTS ||--o{ FACT_VERSIONS : versions
    COMPANY_FACTS }o--o{ SOURCES : fact_sources
    SOURCES }o--o| DOCUMENTS : backed_by

    ORGANIZATIONS ||--o{ METRICS : defines
    METRICS ||--o{ METRIC_VALUES : contains
    METRIC_VALUES }o--o{ SOURCES : metric_sources

    ORGANIZATIONS ||--o{ COMPANIES : tracks
    COMPANIES ||--o{ SECURITIES : issues
    SECURITIES ||--o{ STOCK_PRICES : prices
    COMPANIES ||--o{ FINANCIAL_STATEMENTS : reports

    ORGANIZATIONS ||--o{ VALUATION_MODELS : owns
    VALUATION_MODELS ||--o{ VALUATION_ASSUMPTIONS : inputs
    VALUATION_MODELS ||--o{ VALUATION_RESULTS : outputs

    INDUSTRIES ||--o{ INTELLIGENCE_ITEMS : classifies
    INTELLIGENCE_ITEMS }o--o{ COMPANIES : mentions
    INTELLIGENCE_ITEMS }o--|| SOURCES : originates

    ORGANIZATIONS ||--o{ NARRATIVES : owns
    NARRATIVES ||--o{ NARRATIVE_VERSIONS : versions
    NARRATIVE_VERSIONS }o--o{ COMPANY_FACTS : supports
    NARRATIVE_VERSIONS }o--o{ METRIC_VALUES : supports

    ORGANIZATIONS ||--o{ QUESTIONS : receives
    QUESTIONS ||--o{ ANSWERS : answers
    ANSWERS }o--o{ COMPANY_FACTS : cites
    ANSWERS }o--o{ METRIC_VALUES : cites

    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : chunks
    CITATIONS }o--|| DOCUMENT_CHUNKS : points_to

    ORGANIZATIONS ||--o{ TASKS : owns
    USERS ||--o{ TASKS : assigned
    TASKS ||--o{ COMMENTS : has
    USERS ||--o{ NOTIFICATIONS : receives
```

## 3. 身份与权限

### organizations

`id`, `name`, `slug`, `created_at`, `updated_at`, `deleted_at`

### users

`id`, `organization_id`, `email`, `display_name`, `password_hash`, `status`, `last_login_at`, `password_changed_at`, `invited_by`, `invited_at`, `created_at`, `updated_at`, `deleted_at`

`email` 在组织内唯一；状态为 `INVITED | ACTIVE | DISABLED`。

### roles / permissions

- `roles`: `id`, `organization_id`, `code`, `name`, `description`, timestamps
- `permissions`: `id`, `code`, `resource`, `action`, `description`
- `user_roles`: `user_id`, `role_id`, `created_at`, `created_by`
- `role_permissions`: `role_id`, `permission_id`, `created_at`

### sessions

`id`, `user_id`, `token_hash`, `expires_at`, `last_seen_at`, `ip_address`, `user_agent`, `revoked_at`, `created_at`

数据库只保存会话 Token 哈希。

### login_logs

`id`, `organization_id`, `user_id?`, `email_attempted`, `result`, `ip_address`, `user_agent`, `reason`, `created_at`

### audit_logs

`id`, `organization_id`, `actor_user_id?`, `action`, `resource_type`, `resource_id?`, `request_id`, `before_json`, `after_json`, `metadata_json`, `ip_address`, `user_agent`, `created_at`

## 4. 公司事实

### company_facts

`id`, `organization_id`, `primary_category`, `secondary_category`, `title`, `content`, `numeric_value`, `unit`, `measurement_basis`, `period_start`, `period_end`, `period_label`, `owner_user_id`, `status`, `reviewer_user_id`, `reviewed_at`, `effective_date`, `expiry_date`, `current_version_no`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at`

### fact_versions

`id`, `fact_id`, `version_no`, `snapshot_json`, `change_summary`, `status`, `created_by`, `created_at`

唯一约束：`(fact_id, version_no)`。

### fact_sources

`fact_id`, `source_id`, `source_quote`, `is_primary`, `created_at`

批准前，重要分类要求至少一个来源；这一规则由服务层根据分类配置执行。

## 5. 指标

### metrics

`id`, `organization_id`, `code`, `name`, `description`, `default_unit`, `data_type`, `measurement_basis`, `owner_user_id`, timestamps, `deleted_at`

唯一约束：`(organization_id, code)`。

### metric_values

`id`, `metric_id`, `value_type`, `scenario`, `frequency`, `period_start`, `period_end`, `period_label`, `value_numeric`, `unit`, `currency`, `measurement_basis`, `status`, `source_id`, `owner_user_id`, `reviewer_user_id`, `reviewed_at`, `version_no`, `created_by`, `updated_by`, timestamps, `deleted_at`

唯一活动记录约束由服务层维护：同一指标、类型、情景、频率、期间只有一个非删除当前版本。

## 6. 市场与财务

### companies / securities / stock_prices

- `companies`: 名称、简称、国家、行业、关注逻辑、风险、内部结论、负责人
- `securities`: 公司、代码、交易所、币种、证券类型、是否主要证券
- `stock_prices`: 证券、日期、开高低收、复权收盘、成交量、成交额、市值、来源

### financial_statements

`company_id`, `statement_type`, `period_start`, `period_end`, `frequency`, `currency`, `line_items_json`, `source_id`, `status`, timestamps

首期将供应商行项目标准化后保存，并保留原始字段映射。

### research_annual_reports

`research_annual_reports` 关联公司研究档案、财政年度、公开披露链接和来源。系统只保存链接及可追溯来源，不在主业务数据库复制大体积 PDF 文件；页面在财务质量表格下提供按年度访问入口。

## 7. 估值

### valuation_models

`id`, `organization_id`, `name`, `model_type`, `scenario`, `status`, `version_no`, `parent_model_id`, `created_by`, `updated_by`, timestamps, `deleted_at`

### valuation_assumptions

`id`, `model_id`, `key`, `label`, `year`, `value_numeric`, `unit`, `is_input`, `formula`, `source_id`, `sort_order`

### valuation_results

`id`, `model_id`, `key`, `label`, `value_numeric`, `unit`, `formula`, `calculation_snapshot_json`, `created_at`

## 8. 情报

### industries

`id`, `name`, `slug`, `parent_id?`, `description`, `notion_page_url`, timestamps

### intelligence_items

`id`, `organization_id`, `industry_id`, `title`, `summary`, `details`, `source_id`, `original_url`, `notion_page_url`, `source_note`, `source_links_json`, `published_at`, `fetched_at`, `event_type`, `importance`, `relationship_to_company`, `potential_impact`, `analyst_comment`, `is_read`, `is_adopted`, `tags`, `status`, `owner_user_id`, `reviewer_user_id`, `reviewed_at`, timestamps, `deleted_at`

`source_links_json` 只保存一条事件可变数量的外部原文引用；行业、来源、负责人、审核人和公司关联仍使用外键。Notion 导入内容保存为 `Approved`，并在来源说明中保留“公司表述”“媒体报道”“传闻/未确认”和“内部分析”等限定，不把推断升级为事实。

### intelligence_item_companies

`intelligence_item_id`, `company_id`, `mention_type`, `confidence`

复合主键为 `(intelligence_item_id, company_id)`。当前 Notion 快照以 `PRIMARY` 或 `MENTIONED` 标识关联类型。

### companies（行业雷达扩展）

在公司基础字段上增加 `entity_type`, `observation_scope`, `notion_page_url`。`entity_type` 允许将 Notion 中非公司的“关键观察”主题与公司实体明确区分。

### ingestion_runs

`id`, `adapter_id`, `started_at`, `finished_at`, `status`, `items_seen`, `items_created`, `items_deduplicated`, `retry_count`, `error_summary`

## 9. 叙事与问答

### narratives / narrative_versions

`narratives` 保存标题、类别、当前版本、保密等级、状态和负责人；`narrative_versions` 保存内容、使用场景、适用对象、修改说明、审核人、生效日期与不可变版本。

关联表：

- `narrative_fact_links`
- `narrative_metric_links`
- `narrative_source_links`

### questions / answers

`questions` 保存提问方、日期、分类、保密等级、负责人和状态；`answers` 保存原始回复、最终回复、回复类型（内部判断/外部口径）、正式使用标记、审核信息和版本。

关联表：

- `answer_fact_links`
- `answer_metric_links`
- `answer_document_links`

## 10. 文件、引用和向量

### sources

`id`, `organization_id`, `source_type`, `title`, `publisher`, `url`, `published_at`, `accessed_at`, `document_id?`, `checksum`, timestamps, `deleted_at`

### documents

`id`, `organization_id`, `title`, `file_name`, `mime_type`, `storage_key`, `size_bytes`, `checksum`, `confidentiality`, `status`, `uploaded_by`, timestamps, `deleted_at`

### document_chunks

`id`, `document_id`, `chunk_index`, `content`, `token_count`, `page_number?`, `embedding vector`, `metadata_json`

向量列在启用 pgvector 后创建；embedding 模型和维度必须写入 metadata，禁止静默更换。

### citations

`id`, `organization_id`, `source_type`, `source_record_id`, `document_chunk_id?`, `quote`, `locator_json`, `created_at`

## 11. 协作

- `tasks`: 标题、类型、状态、优先级、关联资源、负责人、截止时间
- `comments`: 关联资源、正文、作者、编辑和软删除字段
- `notifications`: 接收人、类型、标题、正文、关联资源、已读时间

## 12. 索引

首期必需索引：

- 用户：组织 + email、status；
- 事实：组织 + status + category、更新时间、期间、owner；
- 指标值：metric + scenario + period、status；
- 审计：组织 + created_at、resource_type + resource_id、actor；
- 来源：checksum、URL；
- 文档 chunk：document + chunk_index；
- 软删除高频查询使用部分索引 `WHERE deleted_at IS NULL`。

## 13. 公司研究

`research_reports` 以 `(organization_id, company_id)` 唯一约束保存当前公司研究档案，包含结论、核心矛盾、置信度、可预测性、估值状态、完整度、负责人、审核状态和当前版本。它不复制公司主数据、证券、报表、估值模型或行业动态。

结构化子表：

- `research_sections`：可编辑章节及 Fact / Estimate / Inference / Opinion / Unknown 分类；
- `research_assumptions`：支持/反对证据、验证指标、失效条件、负责人、置信度和下次检查日；
- `research_moats`：竞争优势强度、趋势、证据、反证和失效条件；
- `research_metrics`：公司研究指标、期间、Actual/Budget/Forecast、正常化与异常解释，可回链报表和来源；
- `research_annual_reports`：每个财政年度的公开年报或财务披露链接；
- `research_valuations`：估值方法、情景、价格日期、价值区间、敏感性和既有估值模型引用；
- `research_observations`：催化剂、风险、反方观点和监控项；
- `research_claims` / `research_claim_sources`：重要陈述的分类、数据期间、核验人与多来源引文；
- `research_versions` / `research_reviews`：不可变快照与提交、审核、退回记录；
- `research_industry_modules`：可配置行业模块和指标定义 JSON。

行业动态继续保留在 `intelligence_items`，通过 `intelligence_item_companies` 在公司研究页读取，不复制事件。迁移仅将旧 `companies.internal_conclusion`、`watch_rationale`、`risk_factors` 映射到草稿章节并标记 `needs_manual_cleanup`；冲突不覆盖人工研究。

## 14. 研究知识库

`research_items` 是面向研究判断和行动的主表，按 `MARKET`、`TECHNOLOGY`、`BUSINESS_MODEL` 三个维度保存标题、摘要、发生事项、重要性、CloudSky 影响、建议行动、事件日期、重要程度、置信度、状态、负责人和下次跟进日期。`details` 保存各模块的可扩展字段，不替代核心字段。

- `research_sources`：每条研究的原始来源、发布方、链接或文件路径、日期、页码与原文摘录；
- `research_organizations`：研究对象使用的外部机构目录，不复用租户 `organizations`；
- `research_item_organizations`：研究条目与外部机构的多对多关联；
- `research_item_versions`：每次新增、编辑后的不可变快照与变更说明。

研究条目与既有 `company_facts`、`research_reports`、`intelligence_items` 并存：前者仍服务事实口径，`research_reports` 服务单公司研究，`intelligence_items` 服务行业动态。新表不迁移或覆盖任何已有内容。

## 15. 投资人 CRM 与路演

- `investor_accounts`：投资机构主体、类型、关系阶段、投资偏好、地域、负责人、下一步行动、最近互动时间和可见范围；
- `investor_contacts`：机构联系人、职位和联系信息；
- `roadshow_records`：关联机构的会议时间、形式、音频链接、文字纪要、关键结论、跟进事项和可见范围；
- `roadshow_transcript_segments`：每次路演的时间轴文字片段。

可见范围为 `PRIVATE | TEAM | MANAGEMENT`：

- `PRIVATE`：仅记录负责人可见，管理员和总监不自动获得访问权；
- `TEAM`：组织内具备 `investor.read` 权限的成员可见；
- `MANAGEMENT`：记录负责人以及管理员、总监可见。

联系人继承所属投资人机构的范围。路演记录可以选择更严格的范围，但不能比所属机构更宽，以防通过路演标题、音频或纪要绕过机构本身的访问限制。路演记录保存时会更新对应机构的最近互动时间；所有新增记录均写入 `audit_logs`。
