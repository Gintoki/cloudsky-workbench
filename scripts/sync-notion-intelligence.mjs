import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import postgres from "postgres";

const NOTION_VERSION = "2022-06-28";
const DEFAULT_ROOT_PAGE_ID = "3ac46ba20d9a8144ba0ae53e401dd80a";
const DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const SYNC_ACTOR_USER_ID = "00000000-0000-4000-8000-000000000102";

const CATEGORY_SLUGS = new Map([
  ["端侧设备", "edge-devices"],
  ["基础设施", "ai-infrastructure"],
  ["边缘云", "edge-cloud"],
  ["其他信息", "other-intelligence"],
]);

loadDotEnv();

const notionToken = process.env.NOTION_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
const rootPageId = process.env.NOTION_INDUSTRY_RADAR_ROOT_PAGE_ID ?? DEFAULT_ROOT_PAGE_ID;
const snapshotPath = process.env.NOTION_SYNC_SNAPSHOT_PATH;
const dryRun = process.env.NOTION_SYNC_DRY_RUN === "true";

if (!notionToken) {
  throw new Error("NOTION_TOKEN is required. Share the 行业雷达 page with the integration before running sync:notion.");
}
if (!databaseUrl && !dryRun) {
  throw new Error("DATABASE_URL is required unless NOTION_SYNC_DRY_RUN=true.");
}

const fetchedAt = new Date();
const categories = await discoverCategories(rootPageId);
const companies = [];
const items = [];

for (const category of categories) {
  const companyPages = await discoverCompanyPages(category.pageId, category.slug);
  companies.push(...companyPages);
  for (const company of companyPages) {
    const pageItems = await extractIntelligenceItems(company, category, fetchedAt);
    items.push(...pageItems);
  }
}

if (!items.length) {
  throw new Error("No intelligence items were parsed from Notion. Check the page headings and 最新动态 section format.");
}

const snapshot = {
  fetchedAt: fetchedAt.toISOString(),
  rootPageId,
  categories,
  companies,
  items,
};

if (snapshotPath) {
  writeJson(snapshotPath, snapshot);
}

if (!dryRun) {
  await upsertSnapshot(snapshot, databaseUrl);
}

console.log(
  `Notion intelligence sync completed: ${categories.length} categories, ${companies.length} pages, ${items.length} items${dryRun ? " (dry run)" : ""}.`,
);

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

async function notionFetch(path) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  if (!response.ok) {
    throw new Error(`Notion API ${response.status} for ${path}: ${await response.text()}`);
  }
  return response.json();
}

async function getPage(pageId) {
  return notionFetch(`/pages/${pageId}`);
}

async function getChildren(blockId) {
  const blocks = [];
  let cursor;
  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);
    const data = await notionFetch(`/blocks/${blockId}/children?${query.toString()}`);
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

async function discoverCategories(pageId) {
  const blocks = await getChildren(pageId);
  const childPages = blocks.filter((block) => block.type === "child_page");
  return childPages
    .map((block) => {
      const name = cleanTitle(block.child_page.title);
      const slug = CATEGORY_SLUGS.get(name);
      if (!slug) return null;
      return {
        id: deterministicUuid(`industry:${block.id}`),
        pageId: block.id,
        name,
        slug,
        description: categoryDescription(name),
        notionPageUrl: notionPageUrl(block.id),
      };
    })
    .filter(Boolean);
}

async function discoverCompanyPages(categoryPageId, categorySlug) {
  const blocks = await getChildren(categoryPageId);
  const childPages = blocks.filter((block) => block.type === "child_page");
  return childPages.map((block) => {
    const name = cleanTitle(block.child_page.title);
    return {
      id: deterministicUuid(`company:${block.id}`),
      pageId: block.id,
      name,
      entityType: categorySlug === "other-intelligence" ? "TOPIC" : "COMPANY",
      categorySlug,
      observationScope: `${name} 的 Notion 行业雷达持续跟踪页面。`,
      notionPageUrl: notionPageUrl(block.id),
    };
  });
}

async function extractIntelligenceItems(company, category, syncFetchedAt) {
  const page = await getPage(company.pageId);
  const title = cleanTitle(pageTitle(page) || company.name);
  const blocks = await getChildren(company.pageId);
  const parsed = [];
  let inLatestSection = false;
  let current = null;

  for (const block of blocks) {
    if (isHeading(block, 2)) {
      const heading = plainText(block);
      inLatestSection = /最新(动态|访谈)/.test(heading);
      if (!inLatestSection && current) {
        parsed.push(current);
        current = null;
      }
      continue;
    }

    if (!inLatestSection) continue;

    if (isHeading(block, 3)) {
      if (current) parsed.push(current);
      const parsedHeading = parseEventHeading(plainText(block));
      if (!parsedHeading) {
        current = null;
        continue;
      }
      current = {
        id: deterministicUuid(`intelligence:${block.id}`),
        sourceId: deterministicUuid(`source:${block.id}`),
        categorySlug: category.slug,
        categoryName: category.name,
        companyNames: [title],
        companyIds: [company.id],
        title: parsedHeading.title,
        publishedAt: parsedHeading.date,
        eventType: inferEventType(parsedHeading.title, category.name),
        fields: new Map(),
        sourceLinks: [],
        notionPageUrl: company.notionPageUrl,
        fetchedAt: syncFetchedAt.toISOString(),
      };
      continue;
    }

    if (!current || block.type !== "bulleted_list_item") continue;
    const bullet = parseBullet(block);
    if (!bullet.text) continue;
    const field = splitLabelValue(bullet.text);
    if (field) {
      current.fields.set(field.label, field.value);
      if (isSourceLabel(field.label)) {
        current.sourceLinks.push(...bullet.links);
      }
    } else {
      const existing = current.fields.get("补充") ?? "";
      current.fields.set("补充", [existing, bullet.text].filter(Boolean).join("\n"));
    }
  }
  if (current) parsed.push(current);

  return parsed.map((event) => normalizeEvent(event, company, category));
}

function normalizeEvent(event, company, category) {
  const sourceNote = firstField(event.fields, ["来源及可信度", "来源", "可信度"]);
  const coreFact = firstField(event.fields, ["核心事实"]);
  const techPath = firstField(event.fields, ["技术路径与算力方案", "基础设施", "资本结构"]);
  const commercial = firstField(event.fields, ["商业落地", "产业信号"]);
  const judgment = firstField(event.fields, ["判断与启示", "对云天启示", "判断"]);
  const supplement = firstField(event.fields, ["补充"]);
  const details = [coreFact, techPath, commercial, supplement].filter(Boolean).join("\n\n");
  const summarySource = coreFact || details || judgment || event.title;
  const sourceLinks = dedupeLinks(event.sourceLinks);
  return {
    id: event.id,
    sourceId: event.sourceId,
    categorySlug: event.categorySlug,
    categoryName: event.categoryName,
    companyNames: event.companyNames,
    companyIds: event.companyIds,
    title: event.title,
    summary: trimSummary(summarySource),
    details: details || null,
    publishedAt: event.publishedAt,
    eventType: event.eventType,
    relationshipToCloudsky: judgment || null,
    sourceNote: sourceNote || null,
    notionPageUrl: event.notionPageUrl,
    originalUrl: sourceLinks[0]?.url ?? event.notionPageUrl,
    sourceLinks,
    tags: inferTags(event.title, category.name, company.name),
    fetchedAt: event.fetchedAt,
  };
}

function parseBullet(block) {
  const richText = block.bulleted_list_item.rich_text ?? [];
  return {
    text: richText.map((part) => part.plain_text ?? "").join("").trim(),
    links: richText
      .map((part) => ({ label: part.plain_text, url: part.href ?? part.text?.link?.url }))
      .filter((link) => link.label && link.url),
  };
}

function splitLabelValue(text) {
  const normalized = text.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim();
  const match = normalized.match(/^([^：:]{2,24})[：:]\s*(.+)$/s);
  if (!match) return null;
  return { label: match[1].trim(), value: match[2].trim() };
}

function isSourceLabel(label) {
  return ["原文/资料", "资料", "来源", "来源及可信度"].some((prefix) => label.startsWith(prefix));
}

function firstField(fields, labels) {
  for (const label of labels) {
    const exact = fields.get(label);
    if (exact) return exact;
    for (const [key, value] of fields.entries()) {
      if (key.startsWith(label)) return value;
    }
  }
  return null;
}

function parseEventHeading(text) {
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[｜|]\s*(.+)$/);
  if (!match) return null;
  return { date: match[1], title: match[2].trim() };
}

function isHeading(block, level) {
  return block.type === `heading_${level}`;
}

function plainText(block) {
  const richText = block[block.type]?.rich_text ?? [];
  return richText.map((part) => part.plain_text ?? "").join("").trim();
}

function pageTitle(page) {
  for (const value of Object.values(page.properties ?? {})) {
    if (value?.type === "title") {
      return value.title.map((part) => part.plain_text ?? "").join("");
    }
  }
  return null;
}

function cleanTitle(title) {
  return title
    .replace(/^[^\p{Letter}\p{Number}]+/u, "")
    .replace(/^\d+\s*/, "")
    .replace(/｜更新至\d{2}-\d{2}$/u, "")
    .trim();
}

function categoryDescription(name) {
  const descriptions = {
    端侧设备: "端侧 AI 产品、操作系统、芯片、模型部署与端云协同。",
    基础设施: "GPU、CPU、存储、光互联、AI 工厂及国产算力生态。",
    边缘云: "分布式云、边缘推理、GPU 云、实时渲染与算力调度。",
    其他信息: "重要访谈、创投、融资与改变行业竞争格局的专题信息。",
  };
  return descriptions[name] ?? `${name} 行业雷达分类。`;
}

function inferEventType(title, categoryName) {
  if (/融资|投资|入股|并购|基金|贷款/.test(title)) return "资本事件 / 项目融资";
  if (/发布|推出|上线|产品/.test(title)) return "产品发布 / 技术进展";
  if (/据报|传闻|未正式确认/.test(title)) return "市场消息 / 未确认";
  if (/合同|订单|承诺/.test(title)) return "商业进展 / 订单合同";
  return `${categoryName} / 行业动态`;
}

function inferTags(title, categoryName, companyName) {
  const tags = new Set([categoryName, companyName]);
  for (const keyword of ["未确认", "融资", "AI", "算力", "数据中心", "边缘", "GPU", "TPU", "主权算力", "项目融资"]) {
    if (title.includes(keyword)) tags.add(keyword);
  }
  return [...tags].slice(0, 8);
}

function trimSummary(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 220 ? `${compact.slice(0, 217)}...` : compact;
}

function dedupeLinks(links) {
  const seen = new Set();
  const result = [];
  for (const link of links) {
    if (!link.url || seen.has(link.url)) continue;
    seen.add(link.url);
    result.push({ label: link.label.trim(), url: link.url });
  }
  return result;
}

function notionPageUrl(id) {
  return `https://app.notion.com/p/${id.replaceAll("-", "")}`;
}

function deterministicUuid(input) {
  const bytes = createHash("sha256").update(input).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function writeJson(path, value) {
  const absolutePath = resolve(process.cwd(), path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function upsertSnapshot(snapshotValue, url) {
  const sql = postgres(url, { max: 1, prepare: false, idle_timeout: 20 });
  try {
    await sql.begin(async (tx) => {
      const categoryIdBySlug = new Map();
      const companyIdBySyncId = new Map();

      for (const category of snapshotValue.categories) {
        const rows = await tx`
          insert into industries (id, name, slug, description, notion_page_url, updated_at, deleted_at)
          values (${category.id}::uuid, ${category.name}, ${category.slug}, ${category.description}, ${category.notionPageUrl}, now(), null)
          on conflict (slug) do update set
            name = excluded.name,
            description = excluded.description,
            notion_page_url = excluded.notion_page_url,
            updated_at = now(),
            deleted_at = null
          returning id
        `;
        categoryIdBySlug.set(category.slug, rows[0].id);
      }

      for (const company of snapshotValue.companies) {
        const category = snapshotValue.categories.find((item) => item.slug === company.categorySlug);
        const rows = await tx`
          insert into companies (id, organization_id, name, industry, entity_type, observation_scope, notion_page_url, owner_user_id, updated_at, deleted_at)
          values (${company.id}::uuid, ${DEMO_ORGANIZATION_ID}::uuid, ${company.name}, ${category?.name ?? null}, ${company.entityType}, ${company.observationScope}, ${company.notionPageUrl}, ${SYNC_ACTOR_USER_ID}::uuid, now(), null)
          on conflict (organization_id, name) do update set
            industry = excluded.industry,
            entity_type = excluded.entity_type,
            observation_scope = excluded.observation_scope,
            notion_page_url = excluded.notion_page_url,
            owner_user_id = excluded.owner_user_id,
            updated_at = now(),
            deleted_at = null
          returning id
        `;
        companyIdBySyncId.set(company.id, rows[0].id);
      }

      await tx`
        update intelligence_items
        set deleted_at = now(), updated_at = now()
        where organization_id = ${DEMO_ORGANIZATION_ID}::uuid
          and source_id in (
            select id from sources
            where organization_id = ${DEMO_ORGANIZATION_ID}::uuid
              and source_type = 'NOTION'
          )
      `;

      for (const item of snapshotValue.items) {
        const industryId = categoryIdBySlug.get(item.categorySlug);
        if (!industryId) throw new Error(`Missing category for ${item.title}`);
        await tx`
          insert into sources (id, organization_id, source_type, title, publisher, url, published_at, accessed_at, updated_at, deleted_at)
          values (${item.sourceId}::uuid, ${DEMO_ORGANIZATION_ID}::uuid, 'NOTION', ${`Notion 行业雷达 · ${item.companyNames[0]}`}, ${"Ricky's Knowledge Base"}, ${item.notionPageUrl}, ${`${item.publishedAt}T00:00:00.000Z`}, ${snapshotValue.fetchedAt}, now(), null)
          on conflict (id) do update set
            title = excluded.title,
            publisher = excluded.publisher,
            url = excluded.url,
            published_at = excluded.published_at,
            accessed_at = excluded.accessed_at,
            updated_at = now(),
            deleted_at = null
        `;
        await tx`
          insert into intelligence_items (
            id, organization_id, industry_id, source_id, title, summary, details, original_url,
            notion_page_url, source_note, source_links, published_at, fetched_at, event_type,
            importance, relationship_to_cloudsky, tags, status, owner_user_id, reviewer_user_id,
            reviewed_at, updated_at, deleted_at
          )
          values (
            ${item.id}::uuid, ${DEMO_ORGANIZATION_ID}::uuid, ${industryId}::uuid, ${item.sourceId}::uuid,
            ${item.title}, ${item.summary}, ${item.details}, ${item.originalUrl}, ${item.notionPageUrl},
            ${item.sourceNote}, ${tx.json(item.sourceLinks)}, ${`${item.publishedAt}T00:00:00.000Z`}, ${item.fetchedAt},
            ${item.eventType}, 0, ${item.relationshipToCloudsky}, ${item.tags}, 'APPROVED',
            ${SYNC_ACTOR_USER_ID}::uuid, ${SYNC_ACTOR_USER_ID}::uuid, ${item.fetchedAt}, now(), null
          )
          on conflict (id) do update set
            industry_id = excluded.industry_id,
            source_id = excluded.source_id,
            title = excluded.title,
            summary = excluded.summary,
            details = excluded.details,
            original_url = excluded.original_url,
            notion_page_url = excluded.notion_page_url,
            source_note = excluded.source_note,
            source_links = excluded.source_links,
            published_at = excluded.published_at,
            fetched_at = excluded.fetched_at,
            event_type = excluded.event_type,
            relationship_to_cloudsky = excluded.relationship_to_cloudsky,
            tags = excluded.tags,
            status = excluded.status,
            owner_user_id = excluded.owner_user_id,
            reviewer_user_id = excluded.reviewer_user_id,
            reviewed_at = excluded.reviewed_at,
            updated_at = now(),
            deleted_at = null
        `;

        for (const syncCompanyId of item.companyIds) {
          const companyId = companyIdBySyncId.get(syncCompanyId);
          if (!companyId) throw new Error(`Missing company link for ${item.title}`);
          await tx`
            insert into intelligence_item_companies (intelligence_item_id, company_id)
            values (${item.id}::uuid, ${companyId}::uuid)
            on conflict do nothing
          `;
        }
      }

      await tx`
        insert into audit_logs (organization_id, actor_user_id, action, resource_type, request_id, after_json, metadata_json)
        values (
          ${DEMO_ORGANIZATION_ID}::uuid,
          ${SYNC_ACTOR_USER_ID}::uuid,
          'SYNC_NOTION',
          'INTELLIGENCE_ITEM',
          ${`req_notion_sync_${snapshotValue.fetchedAt}`},
          ${tx.json({ categories: snapshotValue.categories.length, companies: snapshotValue.companies.length, items: snapshotValue.items.length })},
          ${tx.json({ title: "同步 Notion 行业雷达", source: notionPageUrl(rootPageId) })}
        )
      `;
    });
  } finally {
    await sql.end();
  }
}