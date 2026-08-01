-- Import generic methodology as approved, sourced facts for every organization
-- with an active owner. Company-specific examples from the source document are
-- deliberately excluded.
INSERT INTO "sources" (
  "organization_id", "source_type", "title", "publisher", "accessed_at"
)
SELECT
  o."id",
  'INTERNAL_DOCUMENT',
  '投资方法框架（用户提供）',
  '内部研究方法论资料',
  now()
FROM "organizations" o
WHERE o."deleted_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "users" u
    WHERE u."organization_id" = o."id"
      AND u."deleted_at" IS NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM "sources" s
    WHERE s."organization_id" = o."id"
      AND s."source_type" = 'INTERNAL_DOCUMENT'
      AND s."title" = '投资方法框架（用户提供）'
      AND s."deleted_at" IS NULL
  );
--> statement-breakpoint
WITH owners AS (
  SELECT
    o."id" AS "organization_id",
    (
      SELECT u."id"
      FROM "users" u
      WHERE u."organization_id" = o."id"
        AND u."deleted_at" IS NULL
      ORDER BY u."created_at" ASC
      LIMIT 1
    ) AS "user_id"
  FROM "organizations" o
  WHERE o."deleted_at" IS NULL
), methodology ("title", "secondary_category", "content") AS (
  VALUES
    ('结论应与证据类型分开记录', '证据与结论', '公司研究应将已核实事实、预测、推断、主观观点和未知项分开标注；结论需要能追溯到来源或明确说明为研究判断。'),
    ('核心假设需要可验证和可证伪', '假设管理', '每家公司保留少量关键假设，并同步记录支持证据、反对证据、验证指标、失效条件、负责人、置信度与下次复查日期。'),
    ('护城河需要区分性质与趋势', '竞争优势', '护城河分析应区分暂时性技术领先、需持续投入维持的优势和结构性优势，并记录强度、趋势、反证与失效条件。'),
    ('财务质量不能由单一增长指标替代', '财务质量', '收入增长、利润率、现金转换、资本回报、杠杆和资本开支需要共同分析，并区分报表值、正常化值和异常年份。'),
    ('估值方法应与公司特征匹配', '估值纪律', '估值需按公司经济特征选择方法并以情景表达不确定性；当输入不足或价格过期时，应明确暂时无法形成当前估值。'),
    ('风险与反方观点是研究的组成部分', '风险管理', '催化剂、核心风险、反方观点和监控触发条件应与正面论据并列记录，避免将高质量公司直接等同于可投资价格。')
)
INSERT INTO "company_facts" (
  "organization_id", "primary_category", "secondary_category", "title", "content",
  "measurement_basis", "owner_user_id", "status", "reviewer_user_id", "reviewed_at",
  "effective_date", "current_version_no", "created_by", "updated_by"
)
SELECT
  o."organization_id",
  '公司研究方法论',
  m."secondary_category",
  m."title",
  m."content",
  '根据用户提供的《投资方法框架》提炼的通用研究原则，不包含案例公司数据。',
  o."user_id",
  'APPROVED',
  o."user_id",
  now(),
  now(),
  1,
  o."user_id",
  o."user_id"
FROM owners o
CROSS JOIN methodology m
WHERE o."user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "company_facts" f
    WHERE f."organization_id" = o."organization_id"
      AND f."primary_category" = '公司研究方法论'
      AND f."title" = m."title"
      AND f."deleted_at" IS NULL
  );
--> statement-breakpoint
INSERT INTO "fact_sources" ("fact_id", "source_id", "source_quote", "is_primary")
SELECT
  f."id",
  s."id",
  '方法论提炼自该文件的跨页结构与章节，不包含其中的公司案例数据。',
  true
FROM "company_facts" f
INNER JOIN "sources" s
  ON s."organization_id" = f."organization_id"
  AND s."source_type" = 'INTERNAL_DOCUMENT'
  AND s."title" = '投资方法框架（用户提供）'
  AND s."deleted_at" IS NULL
WHERE f."primary_category" = '公司研究方法论'
  AND f."deleted_at" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "fact_sources" fs
    WHERE fs."fact_id" = f."id" AND fs."source_id" = s."id"
  );
--> statement-breakpoint
INSERT INTO "fact_versions" (
  "fact_id", "version_no", "snapshot_json", "change_summary", "status", "created_by"
)
SELECT
  f."id",
  1,
  jsonb_build_object('category', 'company-research-methodology', 'source', '投资方法框架（用户提供）'),
  '导入公司研究方法论',
  'APPROVED',
  f."created_by"
FROM "company_facts" f
INNER JOIN "fact_sources" fs ON fs."fact_id" = f."id"
INNER JOIN "sources" s ON s."id" = fs."source_id"
WHERE f."primary_category" = '公司研究方法论'
  AND s."title" = '投资方法框架（用户提供）'
  AND NOT EXISTS (
    SELECT 1 FROM "fact_versions" v
    WHERE v."fact_id" = f."id" AND v."version_no" = 1
  );
