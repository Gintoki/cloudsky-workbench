import { createHash } from "node:crypto";
import postgres from "postgres";

const notionRootUrl = "https://app.notion.com/p/3ac46ba20d9a8144ba0ae53e401dd80a";
const fetchedAt = new Date();

const categories = [
  { slug: "embodied-intelligence", name: "具身智能", description: "机器人本体、模型、真实数据与部署。" },
  { slug: "foundation-models", name: "基础模型", description: "模型能力、推理成本、开源生态与商业化。" },
  { slug: "cross-industry-insights", name: "横向洞察", description: "访谈、政策、融资及其他可追溯产业信号。" },
];

const events = [
  {
    key: "unitree-us-connected-robot-restrictions-2026-07-28",
    categorySlug: "embodied-intelligence",
    company: "宇树科技",
    companyType: "COMPANY",
    companyPageUrl: "https://app.notion.com/p/3ae46ba20d9a81d3bd1eeb8d2e4c8580",
    title: "美国限制联网先进机器人准入，宇树海外拓展面临新增合规要求",
    summary: "美国将外国制造的联网人形和四足机器人纳入更严格准入限制；政策首先影响新产品认证、渠道扩张和关键行业客户采购，现有收入影响仍待公司披露。",
    details: "监管焦点覆盖感知数据、联网通信、云端控制和软件更新，而不只是机械本体。海外产品需要强化本地推理、数据不出域、网络隔离、可审计更新和客户自主管理能力。",
    publishedAt: "2026-07-28",
    eventType: "政策与合规 / 具身智能",
    importance: 3,
    sourceNote: "AP 对美国联邦通信委员会相关措施的报道；政策事件可信度高，但对宇树实际收入的影响尚待公司披露。",
    relationshipToCloudsky: "具身智能基础设施除训练算力外，需要覆盖区域化模型部署、边缘推理、设备身份管理、数据隔离和安全更新。",
    tags: ["具身智能", "宇树科技", "政策", "数据主权", "边缘推理"],
    sourceLinks: [
      { label: "AP：美国限制外国制造的联网先进机器人", url: "https://apnews.com/article/c9f5e3c94d91d00eff3b61b141fab366" },
    ],
  },
  {
    key: "ant-lingbo-robot-data-scale-up-2026-07-22",
    categorySlug: "cross-industry-insights",
    company: "蚂蚁灵波",
    companyType: "COMPANY",
    companyPageUrl: "https://app.notion.com/p/3ac46ba20d9a81a19a2adf66996add80",
    title: "蚂蚁灵波：具身智能的瓶颈在真实物理数据规模化",
    summary: "蚂蚁灵波首席科学家沈宇军在公开访谈中认为，机器人领域尚未迎来 GPT-1 时刻，关键约束是可用于预训练的真实物理数据尚未规模化。",
    details: "访谈提出机器人原生基础模型需要从真实传感器、空间关系和物理任务出发构建预训练体系；短期商业化取决于可复用数据闭环、跨本体部署与客户场景中的任务成功率。",
    publishedAt: "2026-07-22",
    eventType: "行业访谈 / 技术路线",
    importance: 2,
    sourceNote: "张小珺《商业访谈录》第 147 期官方节目页与 Apple Podcasts 说明；属于嘉宾原始访谈，尚无完整官方文字稿。",
    relationshipToCloudsky: "具身训练工厂应覆盖多模态数据接入、视频和传感器数据治理、仿真生成、分布式训练及边缘真机回传闭环。",
    tags: ["具身智能", "真实数据", "世界模型", "训练基础设施", "访谈"],
    sourceLinks: [
      { label: "Apple Podcasts：商业访谈录第 147 期", url: "https://podcasts.apple.com/us/podcast/147-%E5%92%8C%E8%9A%82%E8%9A%81%E7%81%B5%E6%B3%A2%E6%B2%88%E5%AE%87%E5%86%9B%E8%81%8A-%E6%9C%BA%E5%99%A8%E4%BA%BA%E5%8E%9F%E7%94%9F%E5%9F%BA%E7%A1%80%E6%A8%A1%E5%9E%8B-%E5%A4%A7%E8%84%91%E5%92%8C%E6%9C%AC%E4%BD%93%E7%9A%84%E5%85%B3%E7%B3%BB-%E9%A2%84%E8%AE%AD%E7%BB%83%E4%B8%8E%E6%95%B0%E6%8D%AEscale-up-%E8%80%81%E5%B8%88%E6%B1%A4%E6%99%93%E9%B8%A5/id1634356920?i=1000777802753" },
      { label: "小宇宙：商业访谈录第 147 期", url: "https://www.xiaoyuzhoufm.com/episode/6a5f79b3a3fec224d5a128cd" },
    ],
  },
  {
    key: "kimi-k3-release-2026-07-27",
    categorySlug: "foundation-models",
    company: "Kimi（月之暗面）",
    companyType: "COMPANY",
    companyPageUrl: "https://app.notion.com/p/3ae46ba20d9a81f09f22e25491caf3c6",
    title: "Kimi K3 发布：开放权重的 3T 级长周期 Agent 模型",
    summary: "Kimi K3 以超稀疏 MoE、原生视觉、百万上下文和长周期 Agent 任务为核心定位，并开放模型权重；模型规格和能力描述来自官方模型卡、论文及 API 文档。",
    details: "官方资料显示 K3 具备 2.8T 总参数、约 104B 激活参数和最高 1M 上下文。对产业链而言，长期任务的状态、KV Cache、工具执行和运行时管理的重要性上升；评测表现仍需结合真实任务成本判断。",
    publishedAt: "2026-07-27",
    eventType: "产品发布 / 基础模型",
    importance: 3,
    sourceNote: "月之暗面官方模型卡、技术论文与 API 文档，可信度高；模型效果和成本仍需结合生产环境验证。",
    relationshipToCloudsky: "可将边缘节点定位为长周期 Agent 的区域状态层，承载工具执行、本地检索、会话缓存和中心模型间的低时延协同。",
    tags: ["基础模型", "Kimi", "Agent", "开放权重", "KV Cache"],
    sourceLinks: [
      { label: "Kimi K3 官方模型卡", url: "https://huggingface.co/moonshotai/Kimi-K3" },
      { label: "K3 技术论文", url: "https://arxiv.org/abs/2607.24653" },
      { label: "Kimi API 模型说明", url: "https://www.kimi.com/zh-cn/help/kimi-api/api-model-selection" },
    ],
  },
  {
    key: "moonshot-alibaba-hopper-report-2026-07-31",
    categorySlug: "foundation-models",
    company: "Kimi（月之暗面）",
    companyType: "COMPANY",
    companyPageUrl: "https://app.notion.com/p/3ae46ba20d9a81f09f22e25491caf3c6",
    title: "据报月之暗面通过阿里云合作获得约 2 万颗 Hopper 级 GPU（未正式确认）",
    summary: "Reuters 转述 Bloomberg 知情人士称月之暗面通过与阿里巴巴的算力合作获得约 2 万颗 Hopper 级 GPU；合同和芯片清单未获完整官方披露。",
    details: "该信息应作为未正式确认的资本开支与云厂商绑定信号，而非既成事实。若后续证实，反映前沿开源模型训练与推理仍高度依赖稳定的集群工程、算力供给、缓存和运行时服务。",
    publishedAt: "2026-07-31",
    eventType: "市场消息 / 算力合作（未确认）",
    importance: 2,
    sourceNote: "Reuters 转述 Bloomberg 知情人士报道；月之暗面与阿里云未完整披露合同和芯片清单，保留未正式确认标记。",
    relationshipToCloudsky: "客户需要的不只是 GPU 租赁，也需要可验证的集群效率、训练与推理连续性、缓存和运行时服务。",
    tags: ["基础模型", "Kimi", "GPU", "阿里云", "未确认"],
    sourceLinks: [
      { label: "Reuters：Moonshot 与阿里计算合作报道", url: "https://www.reuters.com/business/retail-consumer/moonshot-has-nvidia-chip-cluster-alibaba-computing-deal-bloomberg-news-reports-2026-07-31/" },
    ],
  },
  {
    key: "minimax-h3-video-model-2026-07-31",
    categorySlug: "foundation-models",
    company: "MiniMax",
    companyType: "COMPANY",
    companyPageUrl: "https://app.notion.com/p/3ae46ba20d9a817989e6c6fa3eb8adb6",
    title: "MiniMax 发布 H3 视频模型，面向可编辑的生产工作流",
    summary: "MiniMax H3 支持文本、图片、视频和音频输入，可生成原生音画视频并支持编辑和动作迁移；公司称将开放模型权重，成本优势仍需第三方实测。",
    details: "视频生成竞争正在从单次样片转向可编辑、可复用、可规模生产的工作流。视频任务的排队调度、大文件存储、带宽分发、版权与内容安全将成为基础设施的重要组成部分。",
    publishedAt: "2026-07-31",
    eventType: "产品发布 / 多模态模型",
    importance: 2,
    sourceNote: "MiniMax 官方发布信息与 Reuters 报道；公司关于成本优势的表述仍需第三方实测。",
    relationshipToCloudsky: "视频生成适合区域化推理与弹性资源池，可形成 GPU、对象存储与内容分发的一体化服务。",
    tags: ["基础模型", "MiniMax", "视频生成", "多模态", "推理"],
    sourceLinks: [
      { label: "Reuters：MiniMax 发布 H3 视频模型", url: "https://www.reuters.com/world/china/chinas-minimax-releases-h3-video-model-2026-07-31/" },
      { label: "MiniMax 官网", url: "https://www.minimax.io/" },
    ],
  },
];

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const sql = postgres(databaseUrl, { max: 1, prepare: false, idle_timeout: 20 });

try {
  await sql.begin(async (tx) => {
    const organizations = await tx`select id, name from organizations order by created_at`;
    const configuredOrganizationId = process.env.NOTION_INDUSTRY_IMPORT_ORGANIZATION_ID;
    const organization = configuredOrganizationId
      ? organizations.find((item) => item.id === configuredOrganizationId)
      : organizations.length === 1 ? organizations[0] : null;
    if (!organization) {
      throw new Error("Set NOTION_INDUSTRY_IMPORT_ORGANIZATION_ID when the database contains more than one organization.");
    }

    const owners = await tx`
      select id from users
      where organization_id = ${organization.id}::uuid and deleted_at is null
      order by created_at
      limit 1
    `;
    const owner = owners[0];
    if (!owner) throw new Error(`No user exists for organization ${organization.name}.`);

    const categoryIds = new Map();
    for (const category of categories) {
      const rows = await tx`
        insert into industries (name, slug, description, notion_page_url, updated_at)
        values (${category.name}, ${category.slug}, ${category.description}, ${notionRootUrl}, now())
        on conflict (slug) do update set
          name = excluded.name,
          description = excluded.description,
          notion_page_url = excluded.notion_page_url,
          updated_at = now(),
          deleted_at = null
        returning id
      `;
      categoryIds.set(category.slug, rows[0].id);
    }

    for (const event of events) {
      const companyRows = await tx`
        insert into companies (organization_id, name, industry, entity_type, observation_scope, notion_page_url, owner_user_id, updated_at)
        values (
          ${organization.id}::uuid, ${event.company}, ${categories.find((category) => category.slug === event.categorySlug)?.name ?? null},
          ${event.companyType}, ${"来自 Notion 行业雷达的持续跟踪对象。"}, ${event.companyPageUrl}, ${owner.id}::uuid, now()
        )
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
      const itemId = deterministicUuid(`notion-industry-radar:${event.key}`);
      const sourceId = deterministicUuid(`notion-industry-radar-source:${event.key}`);
      const sourceTitle = `Notion 行业雷达 / ${event.company}`;
      const categoryId = categoryIds.get(event.categorySlug);

      await tx`
        insert into sources (id, organization_id, source_type, title, publisher, url, published_at, accessed_at, updated_at)
        values (
          ${sourceId}::uuid, ${organization.id}::uuid, 'NOTION', ${sourceTitle}, ${"Ricky's Knowledge Base"},
          ${event.companyPageUrl}, ${`${event.publishedAt}T00:00:00.000Z`}, ${fetchedAt}, now()
        )
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
          reviewed_at, updated_at
        )
        values (
          ${itemId}::uuid, ${organization.id}::uuid, ${categoryId}::uuid, ${sourceId}::uuid,
          ${event.title}, ${event.summary}, ${event.details}, ${event.sourceLinks[0].url},
          ${event.companyPageUrl}, ${event.sourceNote}, ${tx.json(event.sourceLinks)},
          ${`${event.publishedAt}T00:00:00.000Z`}, ${fetchedAt}, ${event.eventType},
          ${event.importance}, ${event.relationshipToCloudsky}, ${event.tags}, 'APPROVED',
          ${owner.id}::uuid, ${owner.id}::uuid, ${fetchedAt}, now()
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
          importance = excluded.importance,
          relationship_to_cloudsky = excluded.relationship_to_cloudsky,
          tags = excluded.tags,
          status = excluded.status,
          reviewer_user_id = excluded.reviewer_user_id,
          reviewed_at = excluded.reviewed_at,
          updated_at = now(),
          deleted_at = null
      `;

      await tx`
        insert into intelligence_item_companies (intelligence_item_id, company_id)
        values (${itemId}::uuid, ${companyRows[0].id}::uuid)
        on conflict do nothing
      `;
    }

    await tx`
      insert into audit_logs (organization_id, actor_user_id, action, resource_type, request_id, after_json, metadata_json)
      values (
        ${organization.id}::uuid, ${owner.id}::uuid, 'IMPORT_NOTION_INDUSTRY_RADAR', 'INTELLIGENCE_ITEM',
        ${`notion_industry_import_${fetchedAt.toISOString()}`}, ${tx.json({ imported: events.length })},
        ${tx.json({ source: notionRootUrl, eventKeys: events.map((event) => event.key) })}
      )
    `;
  });
  const importedIds = events.map((event) => deterministicUuid(`notion-industry-radar:${event.key}`));
  const imported = await sql`
    select title, status, published_at
    from intelligence_items
    where id in ${sql(importedIds)} and deleted_at is null
    order by published_at desc
  `;
  console.log(`Imported or updated ${events.length} Notion industry-radar events; verified ${imported.length} active records.`);
} finally {
  await sql.end();
}

function deterministicUuid(input) {
  const bytes = createHash("sha256").update(input).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
