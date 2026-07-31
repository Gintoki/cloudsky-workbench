export interface IndustrySeed {
  id: string;
  name: string;
  slug: string;
  description: string;
  notionPageUrl: string;
}

export interface IntelligenceCompanySeed {
  id: string;
  name: string;
  entityType: "COMPANY" | "TOPIC";
  categorySlug: string;
  observationScope: string;
  notionPageUrl: string;
}

export interface IntelligenceSourceLink {
  label: string;
  url: string;
}

export interface IntelligenceItemSeed {
  id: string;
  categorySlug: string;
  companyNames: string[];
  title: string;
  summary: string;
  details: string;
  publishedAt: string;
  eventType: string;
  relationshipToCloudsky: string;
  sourceNote: string;
  notionPageUrl: string;
  sourceLinks: IntelligenceSourceLink[];
  tags: string[];
}

export const notionIndustryRadarUrl =
  "https://app.notion.com/p/3ac46ba20d9a8144ba0ae53e401dd80a";

export const notionIndustryFetchedAt = "2026-07-30T02:23:34.514Z";

export const industrySeeds: IndustrySeed[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    name: "端侧设备",
    slug: "edge-devices",
    description: "端侧 AI 产品、操作系统、芯片、模型部署与端云协同。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a8116929aeee0bd5928fe",
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    name: "基础设施",
    slug: "ai-infrastructure",
    description: "GPU、CPU、存储、光互联、AI 工厂及国产算力生态。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81b79cced33e6ddeaf72",
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    name: "边缘云",
    slug: "edge-cloud",
    description: "分布式云、边缘推理、GPU 云、实时渲染与算力调度。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a816289aacaa4e13ffb76",
  },
  {
    id: "40000000-0000-4000-8000-000000000004",
    name: "其他",
    slug: "other-intelligence",
    description: "重要访谈、创投、融资与改变行业竞争格局的专题信息。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a815eae2cf79aa5cc5161",
  },
];

export const intelligenceCompanySeeds: IntelligenceCompanySeed[] = [
  {
    id: "41000000-0000-4000-8000-000000000001",
    name: "华为",
    entityType: "COMPANY",
    categorySlug: "edge-devices",
    observationScope:
      "端侧 AI 产品形态、鸿蒙生态、手机、PC、穿戴、汽车与机器人，以及昇腾、端侧 NPU、模型部署和端云协同。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a8143951cca7b326a3d1f",
  },
  {
    id: "41000000-0000-4000-8000-000000000002",
    name: "小米",
    entityType: "COMPANY",
    categorySlug: "edge-devices",
    observationScope:
      "手机、汽车、家庭设备、穿戴与机器人，自研芯片、NPU、澎湃 OS、模型部署和端云协同。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a811b954bd35517f8ec91",
  },
  {
    id: "41000000-0000-4000-8000-000000000003",
    name: "三星",
    entityType: "COMPANY",
    categorySlug: "edge-devices",
    observationScope:
      "Galaxy AI、手机、PC、穿戴、家电与智能眼镜，以及 Exynos、NPU、存储、封装和端云协同。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a814dad05e9d14e569e53",
  },
  {
    id: "41000000-0000-4000-8000-000000000004",
    name: "苹果",
    entityType: "COMPANY",
    categorySlug: "edge-devices",
    observationScope:
      "Apple Intelligence、Apple Silicon、Neural Engine、Private Cloud Compute 与各类终端的端云分层。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81668ee9e8f39340921c",
  },
  {
    id: "41000000-0000-4000-8000-000000000005",
    name: "英伟达",
    entityType: "COMPANY",
    categorySlug: "ai-infrastructure",
    observationScope:
      "GPU、CPU、网络、光互联、机架级系统、推理软件栈、边缘 AI、机器人平台及生态投资。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a817dab98c2eed2331e71",
  },
  {
    id: "41000000-0000-4000-8000-000000000006",
    name: "海光信息",
    entityType: "COMPANY",
    categorySlug: "ai-infrastructure",
    observationScope:
      "国产 CPU 与 DCU、DTK 软件栈、异构互联、主流模型适配及行业落地。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a8130bb14e5b2013f2657",
  },
  {
    id: "41000000-0000-4000-8000-000000000007",
    name: "SK 海力士",
    entityType: "COMPANY",
    categorySlug: "ai-infrastructure",
    observationScope:
      "HBM、DRAM、NAND、先进封装、产能扩张以及 AI 服务器和端侧存储需求。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a813ba520eb4f35ec4d05",
  },
  {
    id: "41000000-0000-4000-8000-000000000008",
    name: "中际旭创",
    entityType: "COMPANY",
    categorySlug: "ai-infrastructure",
    observationScope:
      "800G、1.6T 及下一代高速光模块，硅光、EML、NPO、XPO、CPO 的技术与量产进展。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a811bb27af6e5a9154c48",
  },
  {
    id: "41000000-0000-4000-8000-000000000009",
    name: "长鑫存储",
    entityType: "COMPANY",
    categorySlug: "ai-infrastructure",
    observationScope:
      "DRAM 产品、制程、产能、中高端存储、国产供应链及服务器市场拓展。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a815294afe34ccc5f636b",
  },
  {
    id: "41000000-0000-4000-8000-000000000010",
    name: "Akamai",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "全球边缘节点、分布式云、GPU 集群、推理调度、大客户合同及与超大规模云的差异化。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81ff9c06fb5f1d115ee3",
  },
  {
    id: "41000000-0000-4000-8000-000000000011",
    name: "Cloudflare",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "Workers、AI Gateway、Workers AI、全球网络、边缘推理和开发者平台。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a8101a136d3d324ae203a",
  },
  {
    id: "41000000-0000-4000-8000-000000000012",
    name: "DigitalOcean",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "开发者云、GPU 云、AI/ML 平台、推理服务、客户承诺与基础设施扩容。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81c3a34fff07da6f6582",
  },
  {
    id: "41000000-0000-4000-8000-000000000013",
    name: "PPIO",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "分布式云、边缘网络、GPU 云、模型网关、Agent Runtime 与商业落地。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a816886e5d93b9b4e89b3",
  },
  {
    id: "41000000-0000-4000-8000-000000000014",
    name: "无问芯穹",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "异构算力、模型服务、训推一体、国产芯片适配、推理流水线与 Agentic Infra。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81939692d88294773e27",
  },
  {
    id: "41000000-0000-4000-8000-000000000015",
    name: "海马云",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "ARM 云手机、云游戏、边缘 GPU、实时渲染、AI 内容平台与 Agent 工作流。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81ca9d52fa620a8207be",
  },
  {
    id: "41000000-0000-4000-8000-000000000016",
    name: "硅基流动",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "模型 API、推理平台、国产芯片适配、推理优化、私有化交付与生态合作。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81cfb200d9ed363df26a",
  },
  {
    id: "41000000-0000-4000-8000-000000000017",
    name: "顺网科技",
    entityType: "COMPANY",
    categorySlug: "edge-cloud",
    observationScope:
      "网吧与电竞场景、分布式边缘算力、云电脑、云游戏和轻量 AI 推理。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81ae8250d23f4be63e65",
  },
  {
    id: "41000000-0000-4000-8000-000000000018",
    name: "张小珺访谈",
    entityType: "TOPIC",
    categorySlug: "other-intelligence",
    observationScope: "公开访谈、播客、文章与视频中的 AI Infra 和产业观点。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81a19a2adf66996add80",
  },
  {
    id: "41000000-0000-4000-8000-000000000019",
    name: "创投与其他重要信息",
    entityType: "TOPIC",
    categorySlug: "other-intelligence",
    observationScope:
      "改变 AI 基础设施竞争格局、融资结构、资本开支或商业模式的重要事件。",
    notionPageUrl:
      "https://app.notion.com/p/3ac46ba20d9a81b7ab34fb38e6b257ae",
  },
];

const notion = {
  华为: intelligenceCompanySeeds[0].notionPageUrl,
  小米: intelligenceCompanySeeds[1].notionPageUrl,
  三星: intelligenceCompanySeeds[2].notionPageUrl,
  苹果: intelligenceCompanySeeds[3].notionPageUrl,
  英伟达: intelligenceCompanySeeds[4].notionPageUrl,
  海光信息: intelligenceCompanySeeds[5].notionPageUrl,
  "SK 海力士": intelligenceCompanySeeds[6].notionPageUrl,
  中际旭创: intelligenceCompanySeeds[7].notionPageUrl,
  长鑫存储: intelligenceCompanySeeds[8].notionPageUrl,
  Akamai: intelligenceCompanySeeds[9].notionPageUrl,
  Cloudflare: intelligenceCompanySeeds[10].notionPageUrl,
  DigitalOcean: intelligenceCompanySeeds[11].notionPageUrl,
  PPIO: intelligenceCompanySeeds[12].notionPageUrl,
  无问芯穹: intelligenceCompanySeeds[13].notionPageUrl,
  海马云: intelligenceCompanySeeds[14].notionPageUrl,
  硅基流动: intelligenceCompanySeeds[15].notionPageUrl,
  顺网科技: intelligenceCompanySeeds[16].notionPageUrl,
  张小珺访谈: intelligenceCompanySeeds[17].notionPageUrl,
  创投与其他重要信息: intelligenceCompanySeeds[18].notionPageUrl,
} as const;

function item(
  sequence: number,
  value: Omit<IntelligenceItemSeed, "id">,
): IntelligenceItemSeed {
  return {
    id: `42000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    ...value,
  };
}

export const intelligenceItemSeeds: IntelligenceItemSeed[] = [
  item(1, {
    categorySlug: "edge-devices",
    companyNames: ["华为"],
    title: "华为小艺以满分获得 IMO 2026 金牌",
    summary:
      "华为称小艺参加第 67 届国际数学奥林匹克竞赛并取得 42 分满分，显示其正从语音助手升级为具备复杂推理能力的个人智能体。",
    details:
      "官方未披露推理是否完全在端侧完成。Notion 研究判断其路线更可能是端侧感知与执行、云端复杂推理和系统级跨设备调用的组合。小艺能力正向手机、平板、鸿蒙 PC、穿戴与 AI 眼镜扩展。",
    publishedAt: "2026-07-24",
    eventType: "技术进展 / 端侧智能体",
    relationshipToCloudsky:
      "复杂推理、跨设备状态同步和低时延服务可能形成新的端边协同需求。",
    sourceNote: "华为官方信息；技术路径包含 Notion 研究判断。",
    notionPageUrl: notion.华为,
    sourceLinks: [
      { label: "华为终端最新资讯", url: "https://consumer.huawei.com/cn/press/news/" },
      {
        label: "HarmonyOS 7 开发者 Beta",
        url: "https://www.huawei.com/cn/news/2026/6/harmonyos7-hdc",
      },
    ],
    tags: ["端侧AI", "Agent", "鸿蒙"],
  }),
  item(2, {
    categorySlug: "edge-devices",
    companyNames: ["华为"],
    title: "华为提出面向 Agentverse 的无线网络五大演进方向",
    summary:
      "华为提出超大带宽、超大上行、超精波束、体验升级和全域智能五大方向，使移动网络适配智能体持续在线、感知与调用云端能力。",
    details:
      "网络由连接终端转向连接智能体，需要承载高上行、多模态数据、确定性时延和动态资源调度，并服务 AI 眼镜、家庭智能体、机器人和车载智能体等入口。",
    publishedAt: "2026-07-20",
    eventType: "技术路线 / 网络基础设施",
    relationshipToCloudsky:
      "边缘节点可能进一步参与网络体验保障与 Agent 任务调度，与实时智算织网叙事直接相关。",
    sourceNote: "华为官网官方发布。",
    notionPageUrl: notion.华为,
    sourceLinks: [
      {
        label: "华为发布五大无线技术创新方向与实践",
        url: "https://www.huawei.com/cn/news/2026/7/wireless-innovations-for-agentverse",
      },
    ],
    tags: ["Agentverse", "无线网络", "边缘节点"],
  }),
  item(3, {
    categorySlug: "edge-devices",
    companyNames: ["小米"],
    title: "小米澎湃 AI 获手机端侧生成式 AI 服务备案",
    summary:
      "小米澎湃 AI 出现在手机端侧生成式 AI 服务备案名单中，为端侧能力规模化预装和商业化提供合规基础。",
    details:
      "备案信息未披露模型规模、量化方式或端云分工。结合小米手机、汽车、眼镜及家庭生态，Notion 研究将其归纳为端侧模型承担常用感知与交互、云端模型补充复杂任务的混合路线。",
    publishedAt: "2026-07-15",
    eventType: "合规进展 / 端侧模型",
    relationshipToCloudsky:
      "人车家全生态入口可能放大端云协同需求，应跟踪其统一 Agent 运行环境。",
    sourceNote: "新华社及国家网信办公开信息；技术路线为研究判断。",
    notionPageUrl: notion.小米,
    sourceLinks: [
      {
        label: "新华网备案信息",
        url: "https://www.news.cn/tech/20260716/6488df0130c84f2baf2e493aa284942e/c.html",
      },
      {
        label: "小米 AI 眼镜",
        url: "https://www.mi.com/prod/xiaomi-ai-glasses/desc",
      },
    ],
    tags: ["端侧AI", "合规", "人车家"],
  }),
  item(4, {
    categorySlug: "edge-devices",
    companyNames: ["三星"],
    title: "三星发布新一代折叠屏、AI 手表及智能眼镜",
    summary:
      "三星在 Galaxy Unpacked 2026 发布折叠屏、手表并展示智能眼镜，强调以 Agentic AI 串联多类设备。",
    details:
      "三星结合 NPU、Personal Data Engine、Knox Vault、Android AICore、Gemini Nano 与 ExecuTorch，本地处理高频和个性化任务，云端补充复杂推理，形成眼镜感知、手机计算和云端推理的多级链路。",
    publishedAt: "2026-07-22",
    eventType: "新产品 / Agentic AI",
    relationshipToCloudsky:
      "跨设备智能层会产生持续连接、推理路由和低时延协同机会。",
    sourceNote: "Samsung Global Newsroom 官方信息。",
    notionPageUrl: notion.三星,
    sourceLinks: [
      {
        label: "Galaxy Unpacked 2026 Highlights",
        url: "https://news.samsung.com/global/infographic-galaxy-unpacked-july-2026-highlights-from-galaxy-unpacked",
      },
      {
        label: "Samsung On-device AI",
        url: "https://semiconductor.samsung.com/technologies/processor/on-device-ai/",
      },
    ],
    tags: ["Agentic AI", "智能眼镜", "跨设备"],
  }),
  item(5, {
    categorySlug: "edge-devices",
    companyNames: ["苹果"],
    title: "苹果据报筹备搭载新 Siri AI 的家庭智能中枢",
    summary:
      "媒体称苹果可能在 2026 年 10 月至 2027 年初推出约 7 英寸家庭智能中枢；产品与发布时间尚未获苹果确认。",
    details:
      "报道中的设备将承担家庭控制、视频通信、安全监控和 Siri AI 入口。苹果已公开的技术路线是设备端模型与 Private Cloud Compute 的混合架构，但本产品本身仍属于未官宣信息。",
    publishedAt: "2026-07-29",
    eventType: "新形态设备 / 市场传闻",
    relationshipToCloudsky:
      "若产品落地，家庭常驻入口可能产生视觉、语音和设备控制的低时延边缘需求。",
    sourceNote: "The Verge 转述 Bloomberg；产品和发布时间未获苹果确认。",
    notionPageUrl: notion.苹果,
    sourceLinks: [
      {
        label: "The Verge 报道",
        url: "https://www.theverge.com/tech/971790/apple-homepad-rumor-launch",
      },
      {
        label: "Apple Intelligence 设备要求",
        url: "https://support.apple.com/en-sg/121115",
      },
    ],
    tags: ["未确认", "家庭智能中枢", "Private Cloud Compute"],
  }),
  item(6, {
    categorySlug: "edge-devices",
    companyNames: ["苹果"],
    title: "Apple 智能完成中国手机端侧生成式 AI 服务备案",
    summary:
      "Apple 智能出现在新一批手机端侧生成式 AI 服务备案名单中，为其在中国市场进一步落地提供合规前提。",
    details:
      "备案不等同于具体功能全面上线，仍需跟踪模型合作方、Private Cloud Compute 本地化方式和实际开放时间。",
    publishedAt: "2026-07-15",
    eventType: "合规进展",
    relationshipToCloudsky:
      "中国市场的端云部署和合规架构可能带来本地算力及网络合作机会。",
    sourceNote: "新华社及国家网信办公开信息。",
    notionPageUrl: notion.苹果,
    sourceLinks: [
      {
        label: "新华网备案信息",
        url: "https://www.news.cn/tech/20260716/6488df0130c84f2baf2e493aa284942e/c.html",
      },
    ],
    tags: ["合规", "端侧AI", "中国市场"],
  }),
  item(7, {
    categorySlug: "ai-infrastructure",
    companyNames: ["英伟达"],
    title: "英伟达与 Safe Superintelligence 建立长期战略合作",
    summary:
      "英伟达投资 SSI 并提供下一代 Vera Rubin 系统，双方还将围绕未来计算平台开展联合设计。",
    details:
      "合作不只涉及 GPU 采购，SSI 的研究负载还会参与平台优化，体现模型、系统与芯片协同设计。英伟达继续向算力资本、AI 工厂平台和生态投资人演进。",
    publishedAt: "2026-07-27",
    eventType: "战略投资 / 算力合作",
    relationshipToCloudsky:
      "算力平台竞争已包含资本、客户绑定和联合设计能力，边缘平台需要形成不同层次的生态壁垒。",
    sourceNote: "NVIDIA Newsroom 官方公告。",
    notionPageUrl: notion.英伟达,
    sourceLinks: [
      {
        label: "NVIDIA 与 SSI 战略合作",
        url: "https://nvidianews.nvidia.com/news/ilya-sutskevers-safe-superintelligence-inc-and-nvidia-announce-long-term-strategic-partnership",
      },
    ],
    tags: ["战略投资", "Vera Rubin", "Co-design"],
  }),
  item(8, {
    categorySlug: "ai-infrastructure",
    companyNames: ["英伟达", "SK 海力士"],
    title: "英伟达与 SK 集团推进 AI 工厂与存储合作计划",
    summary:
      "双方合作范围包括最高 2GW 的 Vera Rubin DSX AI Factory，以及 HBM 等下一代 AI 内存长期供应和联合开发。",
    details:
      "方案把机架级系统、AI 工厂架构、HBM 与电力基础设施绑定在一起，竞争单位由单卡和服务器升级为 GW 级整厂交付。",
    publishedAt: "2026-07-25",
    eventType: "AI 工厂 / 存储合作",
    relationshipToCloudsky:
      "中心侧日益集中和资本密集，云天的边缘差异化应落在实时交付、区域覆盖和场景运营。",
    sourceNote: "NVIDIA Investor Relations 与官方公告。",
    notionPageUrl: notion.英伟达,
    sourceLinks: [
      {
        label: "NVIDIA 与 SK 集团合作公告",
        url: "https://investor.nvidia.com/news/press-release-details/2026/SK-Group-and-NVIDIA-Expand-Strategic-Partnership-Across-AI-Factories-and-Next-Generation-Memory/default.aspx",
      },
    ],
    tags: ["AI工厂", "HBM", "Vera Rubin"],
  }),
  item(9, {
    categorySlug: "ai-infrastructure",
    companyNames: ["海光信息"],
    title: "海光信息年报披露双芯战略与下一代产品投入",
    summary:
      "海光信息以 CPU 与 DCU 双芯路线、DTK 软件栈和 HSL 系统总线构建国产异构计算体系，并持续投入下一代产品。",
    details:
      "2025 年报披露营业收入约 143.77 亿元、研发投入约 45.69 亿元；相关数字来自监管披露。公司称生态伙伴超过 6,000 家，并已适配多类主流模型。",
    publishedAt: "2026-04-08",
    eventType: "年报 / 技术路线",
    relationshipToCloudsky:
      "需要跟踪 DCU 在边缘推理吞吐、软件迁移成本、服务器供应和行业一体机中的真实落地。",
    sourceNote: "海光信息 2025 年年度报告，监管披露。",
    notionPageUrl: notion.海光信息,
    sourceLinks: [
      {
        label: "海光信息 2025 年年度报告",
        url: "https://static.cninfo.com.cn/finalpage/2026-04-08/1225083088.PDF",
      },
    ],
    tags: ["国产算力", "DCU", "年报"],
  }),
  item(10, {
    categorySlug: "ai-infrastructure",
    companyNames: ["SK 海力士", "英伟达"],
    title: "SK 海力士扩大下一代 AI 内存长期合作",
    summary:
      "SK 海力士与英伟达、微软推进 HBM 和服务器内存长期供应、联合开发与实际服务器环境验证。",
    details:
      "存储厂商正由标准化供货转向围绕 GPU、机架和工作负载联合设计，长期协议提高需求可见度，也使 HBM 成为 AI 工厂架构的一部分。",
    publishedAt: "2026-07-25",
    eventType: "技术合作 / 长期供应",
    relationshipToCloudsky:
      "算力交付能力越来越受内存供应、系统验证和长期产能绑定约束。",
    sourceNote: "SK 海力士与 NVIDIA 官方公告。",
    notionPageUrl: notion["SK 海力士"],
    sourceLinks: [
      {
        label: "SK 海力士合作公告",
        url: "https://news.skhynix.co.kr/k-ai-summit-2026/",
      },
      {
        label: "NVIDIA 多年技术合作",
        url: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-and-SK-hynix-Announce-Multiyear-Technology-Partnership-to-Advance-Memory-for-AI-Factories/default.aspx",
      },
    ],
    tags: ["HBM", "长期供应", "AI工厂"],
  }),
  item(11, {
    categorySlug: "ai-infrastructure",
    companyNames: ["中际旭创"],
    title: "中际旭创高速产品中硅光方案占比已超过一半",
    summary:
      "公司公开回复称，800G 和 1.6T 产品中的硅光方案占比已超过一半，但 EML 与硅光仍将并行。",
    details:
      "高速率产品的空间、功耗和良率压力推动硅光渗透；不同客户的成本、可靠性与供应链要求仍使 EML 保留市场。",
    publishedAt: "2026-04-26",
    eventType: "技术进展 / 投资者互动",
    relationshipToCloudsky:
      "高速互联成本和功耗是 AI 集群扩张的重要约束，应跟踪其对节点和网络架构的影响。",
    sourceNote: "公司投资者互动平台公开回复，由证券时报报道。",
    notionPageUrl: notion.中际旭创,
    sourceLinks: [
      {
        label: "证券时报相关报道",
        url: "https://www.stcn.com/article/detail/3816179.html",
      },
    ],
    tags: ["硅光", "800G", "1.6T"],
  }),
  item(12, {
    categorySlug: "ai-infrastructure",
    companyNames: ["中际旭创"],
    title: "中际旭创 1.6T 产品量产出货并预计持续增长",
    summary:
      "公司称 1.6T 已量产出货，并预计未来三个季度出货量持续环比提升，同时准备更高速率产品送测。",
    details:
      "公司已获得部分客户 2026 年全年订单。竞争重点从拥有产品转向高端产品的大规模稳定交付，后续需跟踪 1.6T 占比、良率、硅光渗透率和海外产能。",
    publishedAt: "2026-04-24",
    eventType: "量产进展 / 订单",
    relationshipToCloudsky:
      "光模块迭代反映中心算力互联升级节奏，也影响 AI 基础设施投资周期。",
    sourceNote: "投资者关系活动记录及公开媒体转述。",
    notionPageUrl: notion.中际旭创,
    sourceLinks: [
      {
        label: "每日经济新闻相关报道",
        url: "https://www.nbd.com.cn/articles/2026-04-24/4358505.html",
      },
    ],
    tags: ["1.6T", "量产", "订单"],
  }),
  item(13, {
    categorySlug: "ai-infrastructure",
    companyNames: ["长鑫存储"],
    title: "长鑫科技登陆科创板并推进工艺升级",
    summary:
      "长鑫科技举行科创板上市仪式，并计划利用募集资金推进 DRAM 工艺升级、中高端产品和国产供应链协同。",
    details:
      "公司称已完成多代工艺平台量产并覆盖 DDR5、LPDDR5/5X。AI 服务器收入占比仍较低；HBM 进展没有新增正式披露，应以后续招股书和公告为准。",
    publishedAt: "2026-07-27",
    eventType: "IPO / 产能与技术路线",
    relationshipToCloudsky:
      "国产存储的良率、单位成本和服务器市场进展会影响国产算力交付成本。",
    sourceNote: "上交所与第一财经公开信息；HBM 相关未作新增确认。",
    notionPageUrl: notion.长鑫存储,
    sourceLinks: [
      {
        label: "上交所上市仪式",
        url: "https://www.sse.com.cn/aboutus/mediacenter/ceremony/",
      },
      {
        label: "第一财经投资者交流会报道",
        url: "https://www.yicai.com/news/103276647.html",
      },
    ],
    tags: ["IPO", "DRAM", "国产供应链"],
  }),
  item(14, {
    categorySlug: "edge-cloud",
    companyNames: ["Akamai"],
    title: "Akamai 获得 18 亿美元长期云基础设施承诺",
    summary:
      "Akamai 披露一家前沿模型提供商承诺七年内采购约 18 亿美元云基础设施服务；客户身份未由双方正式确认。",
    details:
      "这是 Akamai 体量最大的云基础设施合同之一，验证非 hyperscaler 分布式云承接头部模型公司需求的可能性。仍需跟踪收入确认、资本开支、集中度和最低采购约束。",
    publishedAt: "2026-05-08",
    eventType: "大额订单 / 云基础设施",
    relationshipToCloudsky:
      "长期容量合同可帮助边缘云降低融资成本，但会提高客户集中度和交付约束。",
    sourceNote: "Akamai 财报沟通及 Reuters/Bloomberg 报道；客户身份未确认。",
    notionPageUrl: notion.Akamai,
    sourceLinks: [
      {
        label: "Reuters 报道",
        url: "https://www.reuters.com/business/anthropic-signs-18-billion-ai-cloud-deal-with-akamai-bloomberg-news-reports-2026-05-08/",
      },
    ],
    tags: ["长期订单", "分布式云", "客户集中度"],
  }),
  item(15, {
    categorySlug: "edge-cloud",
    companyNames: ["Akamai", "英伟达"],
    title: "Akamai 构建覆盖 4,400 个边缘位置的推理调度体系",
    summary:
      "Akamai 宣布使用 NVIDIA AI Grid 参考架构，在核心、区域和边缘资源之间智能路由推理负载。",
    details:
      "其方案部署数千张 NVIDIA RTX PRO 6000 Blackwell Server Edition GPU，以分层算力池和统一编排平衡时延、成本与性能，并非将高密度 GPU 平均铺设到全部边缘位置。",
    publishedAt: "2026-03-16",
    eventType: "产品发布 / 分布式推理",
    relationshipToCloudsky:
      "Akamai 是实时智算织网的直接可比对象，重点应比较实际 GPU 节点比例与跨区域路由能力。",
    sourceNote: "Akamai 官方新闻稿。",
    notionPageUrl: notion.Akamai,
    sourceLinks: [
      {
        label: "Akamai AI Grid 官方发布",
        url: "https://www.akamai.com/newsroom/press-release/akamai-launches-ai-grid-intelligent-orchestration-for-distributed-inference-across-4400-edge-locations",
      },
    ],
    tags: ["AI Grid", "边缘推理", "Blackwell"],
  }),
  item(16, {
    categorySlug: "edge-cloud",
    companyNames: ["Akamai"],
    title: "Akamai 披露四年 2 亿美元 AI 集群服务合同",
    summary:
      "客户将使用由数千张 NVIDIA Blackwell GPU 组成的集群及 Akamai 分布式云服务。",
    details:
      "集群采用面向 AI 优化的以太网并部署在高密度供电数据中心。Akamai 同时推进集中式高密度集群和边缘推理网格，商业模式并非纯边缘。",
    publishedAt: "2026-03-05",
    eventType: "大额订单 / AI 集群",
    relationshipToCloudsky:
      "中心集群与边缘分发协同可能成为边缘云的主流资产组合。",
    sourceNote: "Akamai 投资者关系官方公告。",
    notionPageUrl: notion.Akamai,
    sourceLinks: [
      {
        label: "Akamai 投资者关系公告",
        url: "https://www.ir.akamai.com/news-releases/news-release-details/akamai-discloses-technical-details-ai-cluster-deal",
      },
    ],
    tags: ["AI集群", "Blackwell", "大额订单"],
  }),
  item(17, {
    categorySlug: "edge-cloud",
    companyNames: ["Cloudflare"],
    title: "Workers AI 强化多模态知识摄取与边缘视觉推理",
    summary:
      "Cloudflare 为文档转换和 AI Search 扩展图片处理，并上线适合分布式推理的视觉语言模型。",
    details:
      "图片可经过缩放、目标检测和视觉模型描述转为可检索文本，服务知识库、客服截图、内容审核、机器人视觉和交互式 Agent。",
    publishedAt: "2026-07-10",
    eventType: "产品更新 / 边缘推理",
    relationshipToCloudsky:
      "Cloudflare 的差异化在低时延、开发体验和流量入口，而非单卡价格，是边缘推理产品设计的重要参照。",
    sourceNote: "Cloudflare Workers AI 官方更新日志。",
    notionPageUrl: notion.Cloudflare,
    sourceLinks: [
      {
        label: "Workers AI 更新日志",
        url: "https://developers.cloudflare.com/changelog/product/workers-ai/",
      },
    ],
    tags: ["Workers AI", "视觉推理", "多模态"],
  }),
  item(18, {
    categorySlug: "edge-cloud",
    companyNames: ["DigitalOcean"],
    title: "DigitalOcean AI 云订单与容量承诺显著增长",
    summary:
      "DigitalOcean 表示新增多笔九位数美元客户承诺，剩余履约义务预计超过 8 亿美元，并扩充数据中心容量。",
    details:
      "公司将基础设施、核心云、推理、数据和 Agent 组合成 AI-Native Cloud，并以 Inference Router 在模型之间按价格和性能调度。",
    publishedAt: "2026-07-07",
    eventType: "商业进展 / 基础设施扩容",
    relationshipToCloudsky:
      "其可比价值更多来自软件调度、客户体验与模型服务，而非单纯 GPU 资产规模。",
    sourceNote: "DigitalOcean Investor Relations 官方公告。",
    notionPageUrl: notion.DigitalOcean,
    sourceLinks: [
      {
        label: "DigitalOcean 投资者公告",
        url: "https://investors.digitalocean.com/news/news-details/2026/DigitalOcean-Expects-to-Report-Record-Q2-2026-Results-with-RPO-to-Exceed-800M-Up-More-Than-10X-Year-Over-Year/default.aspx",
      },
    ],
    tags: ["AI云", "RPO", "Inference Router"],
  }),
  item(19, {
    categorySlug: "edge-cloud",
    companyNames: ["PPIO"],
    title: "PPIO 发布 Agentic Cloud 与智能模型网关",
    summary:
      "PPIO 发布 Agentic Cloud 定位及智能模型网关，以模型动态路由和 Agent Harness 支持智能体长时间运行。",
    details:
      "网关按任务难度、成本与质量动态选模，Harness 整合沙箱、任务编排、工具调用、记忆与失败恢复。公司披露日均 Token 调用量超过 1.2 万亿，该数字为公司口径。",
    publishedAt: "2026-07-17",
    eventType: "产品发布 / 战略升级",
    relationshipToCloudsky:
      "PPIO 是方向高度接近的直接竞品；云天需强化运营商网络、广域节点、实时交互和大客户交付差异。",
    sourceNote: "PPIO 官方博客及公开媒体报道；Token 数据为公司口径。",
    notionPageUrl: notion.PPIO,
    sourceLinks: [
      { label: "PPIO 官方博客", url: "https://blog.ppio.com/" },
      {
        label: "新华网报道",
        url: "https://www.news.cn/finance/20260720/dee55878530e449699ede64c4ab5d18a/c.html",
      },
    ],
    tags: ["Agentic Cloud", "模型网关", "竞品"],
  }),
  item(20, {
    categorySlug: "edge-cloud",
    companyNames: ["无问芯穹"],
    title: "无问芯穹发布跨集群异构 PDD 推理架构",
    summary:
      "无问芯穹发布 PDD 跨集群异构推理架构及 Agentic Infra 战略，将 Prefill 与 Decode 分配到不同芯片、配置或机房。",
    details:
      "公司披露已触达超过 37,000P 算力、覆盖 16 种芯片，并公开了延迟和成本改善数据；相关数字均为公司公开口径。其路线把异构调度推进到推理流水线层。",
    publishedAt: "2026-07-20",
    eventType: "技术发布 / 战略升级",
    relationshipToCloudsky:
      "这是直接竞品动态。云天需要说明广域节点、实时交付、网络协同和场景入口的差异。",
    sourceNote: "无问芯穹官网及公开媒体；性能和规模数据为公司口径。",
    notionPageUrl: notion.无问芯穹,
    sourceLinks: [
      {
        label: "无问芯穹新闻中心",
        url: "https://www.infinigence-ai.com/news-updates-p4.html",
      },
      {
        label: "技术专访",
        url: "https://finance.sina.com.cn/tech/roll/2026-07-20/doc-iniimuyc3053749.shtml",
      },
    ],
    tags: ["PDD", "异构推理", "竞品"],
  }),
  item(21, {
    categorySlug: "edge-cloud",
    companyNames: ["海马云"],
    title: "海马云披露 AI 内容平台与边缘 GPU 基础设施数据",
    summary:
      "海马云披露月 Token、用户、API 调用、节点与算力规模等数据，并将定位扩展到 AI 内容生产平台。",
    details:
      "公司称月 Token 消耗 9 万亿、全球 69 个计算节点、算力 6 EFLOPS；这些均为公司口径，尚需审计或正式披露验证。其技术栈覆盖边缘 GPU、模型平台、实时渲染、知识库和 Agent 工作流。",
    publishedAt: "2026-07-18",
    eventType: "经营披露 / 战略升级",
    relationshipToCloudsky:
      "海马云是边缘 GPU 和实时渲染的重要可比对象，应核验 Token 对应收入、利用率及应用收入质量。",
    sourceNote: "企业资讯经新京报转载；规模与降本数据均为公司口径。",
    notionPageUrl: notion.海马云,
    sourceLinks: [
      {
        label: "新京报相关报道",
        url: "https://www.bjnews.com.cn/detail/1784363652129881.html",
      },
    ],
    tags: ["公司口径", "边缘GPU", "AI内容"],
  }),
  item(22, {
    categorySlug: "edge-cloud",
    companyNames: ["硅基流动"],
    title: "硅基流动落地航空央企国产化 AI 算力基座",
    summary:
      "硅基流动披露其方案已在大型航空央企落地，以国产芯片、模型和推理引擎构建私有化算力基座。",
    details:
      "核心路线是在私有环境统一适配不同国产芯片和模型，提供模型服务与资源运营，而非只交付服务器硬件。",
    publishedAt: "2026-07-06",
    eventType: "商业落地 / 国产化推理",
    relationshipToCloudsky:
      "其客户形态与云天政企、运营商客户可能重叠，既有合作空间，也会竞争私有化 Token 供应平台。",
    sourceNote: "硅基流动官方客户案例。",
    notionPageUrl: notion.硅基流动,
    sourceLinks: [
      { label: "硅基流动企业动态", url: "https://siliconflow.cn/news" },
    ],
    tags: ["国产化", "私有化", "推理引擎"],
  }),
  item(23, {
    categorySlug: "edge-cloud",
    companyNames: ["顺网科技"],
    title: "顺网分布式算力网络达到 330+ 节点",
    summary:
      "顺网称拥有超过 330 个节点机房、覆盖近 200 个重点城市，并为约 82 万台终端提供服务。",
    details:
      "公司披露可运营算力规模达到 5.3 万路，并通过自研平台纳管分布式资源；以上数字来自投资者互动公开回复。",
    publishedAt: "2026-07-13",
    eventType: "经营披露 / 分布式算力",
    relationshipToCloudsky:
      "顺网的节点密度、终端入口和错峰复用模式是边缘算力商业化的重要对标。",
    sourceNote: "投资者互动平台公开回复，经第一财经报道；规模为公司口径。",
    notionPageUrl: notion.顺网科技,
    sourceLinks: [
      {
        label: "第一财经相关报道",
        url: "https://www.yicai.com/news/103271282.html",
      },
    ],
    tags: ["公司口径", "分布式算力", "节点"],
  }),
  item(24, {
    categorySlug: "edge-cloud",
    companyNames: ["顺网科技"],
    title: "顺网管理层详解三档时延架构",
    summary:
      "顺网将不同网络能力映射到约 1ms、3–5ms 和 15–30ms 的服务层级，分别承载专业电竞、城市场景和轻量 AI 推理。",
    details:
      "公司通过分布式部署、场景复用和错峰运营降低单位成本，并尝试让不同 SLA 对应不同网络、算力与价格。",
    publishedAt: "2026-05-26",
    eventType: "管理层访谈 / 网络架构",
    relationshipToCloudsky:
      "分层 SLA 和成本定价比统一追求极低时延更具商业参考价值。",
    sourceNote: "中国证券报对顺网管理层的公开采访。",
    notionPageUrl: notion.顺网科技,
    sourceLinks: [
      {
        label: "中国证券报采访",
        url: "https://www.cs.com.cn/ssgs/01/2026/05/26/detail_2026052610014119.html",
      },
    ],
    tags: ["SLA", "时延", "边缘网络"],
  }),
  item(25, {
    categorySlug: "edge-cloud",
    companyNames: ["顺网科技"],
    title: "顺网推出电竞云电脑 CITY 版",
    summary:
      "CITY 版覆盖约 5ms 场景并面向酒店、商场、小区、企业和学校，公司同时披露季度云业务收入。",
    details:
      "公司尝试由网吧和专业电竞扩展到城市数字消费、校园与机器人等场景。节点规模已经较大，但资源向稳定收入和毛利的转化仍处于早期。",
    publishedAt: "2026-04-29",
    eventType: "产品发布 / 经营披露",
    relationshipToCloudsky:
      "需要关注边缘资源在非网吧场景的利用率、付费率与单位经济性。",
    sourceNote: "公司投资者关系活动记录及公开媒体转述。",
    notionPageUrl: notion.顺网科技,
    sourceLinks: [
      {
        label: "投资者关系活动记录转述",
        url: "https://money.finance.sina.com.cn/corp/view/vCB_AllBulletinDetail.php?id=12291232&stockid=300113",
      },
    ],
    tags: ["云电脑", "CITY版", "商业化"],
  }),
  item(26, {
    categorySlug: "other-intelligence",
    companyNames: ["张小珺访谈"],
    title: "游凯超访谈：开源 Infra、vLLM 与模型 Co-design",
    summary:
      "访谈讨论 vLLM 从开源项目到公司、开源治理、模型与推理引擎联合设计，以及 Token 与电力约束。",
    details:
      "Notion 页面基于官方音频与节目提纲作结构化概括，尚未取得公开完整文字稿。核心判断是模型、引擎和 Harness 将进入联合设计，推理效率成为模型规模之外的竞争变量。",
    publishedAt: "2026-07-28",
    eventType: "访谈 / AI Infra",
    relationshipToCloudsky:
      "Token 工厂壁垒不仅是 GPU 数量，还包括推理软件栈、网络、应用运行时及开发者生态。",
    sourceNote: "官方音频与节目提纲；完整文字稿尚未公开获取。",
    notionPageUrl: notion.张小珺访谈,
    sourceLinks: [
      {
        label: "小宇宙官方节目页",
        url: "https://www.xiaoyuzhoufm.com/podcast/626b46ea9cbbf0451cf5a962",
      },
    ],
    tags: ["vLLM", "Co-design", "访谈"],
  }),
  item(27, {
    categorySlug: "other-intelligence",
    companyNames: ["创投与其他重要信息", "英伟达"],
    title: "英伟达入股 Naver，Brookfield 提供数据中心融资",
    summary:
      "英伟达计划认购 Naver 新股，Brookfield 为韩国 AI 数据中心扩建提供融资，项目结合芯片、平台、资本和能源。",
    details:
      "项目计划采用 NVIDIA Vera Rubin 与 Blackwell 平台并逐步扩大容量。GPU 厂商正由设备供应商扩展为股权投资人和项目融资组织者。",
    publishedAt: "2026-07-27",
    eventType: "战略投资 / 项目融资",
    relationshipToCloudsky:
      "大型算力项目需要长期客户承诺、低成本资本、能源和数据中心资产协同。",
    sourceNote: "Reuters 报道，交易由相关公司披露。",
    notionPageUrl: notion.创投与其他重要信息,
    sourceLinks: [
      {
        label: "Reuters 报道",
        url: "https://www.reuters.com/business/media-telecom/nvidia-acquire-1-billion-new-shares-south-koreas-naver-2026-07-26/",
      },
    ],
    tags: ["项目融资", "战略投资", "数据中心"],
  }),
  item(28, {
    categorySlug: "other-intelligence",
    companyNames: ["创投与其他重要信息"],
    title: "DeepSeek 据报暂停第二轮融资",
    summary:
      "媒体称 DeepSeek 暂停第二轮融资签约，拟议估值约 5,000 亿元；公司未正式确认，Reuters 亦无法独立核实。",
    details:
      "该信息仅作为模型公司融资环境与资本开支意愿的观察样本，不应作为已确认交易事实使用。",
    publishedAt: "2026-07-25",
    eventType: "融资传闻",
    relationshipToCloudsky:
      "头部模型公司的融资、IPO 与自建算力计划会影响上游算力需求与客户议价。",
    sourceNote: "Reuters 转述 Bloomberg；公司未确认，Reuters 无法独立核实。",
    notionPageUrl: notion.创投与其他重要信息,
    sourceLinks: [
      {
        label: "Reuters 报道",
        url: "https://www.reuters.com/world/china/deepseek-tells-prospective-investors-funding-pause-bloomberg-news-reports-2026-07-25/",
      },
    ],
    tags: ["未确认", "融资", "DeepSeek"],
  }),
  item(29, {
    categorySlug: "other-intelligence",
    companyNames: ["创投与其他重要信息", "Akamai"],
    title: "长期容量合同强化算力预售与资本开支锁定模式",
    summary:
      "Akamai 的长期 AI 云服务承诺显示，模型公司可通过容量合同帮助云厂商融资和扩建。",
    details:
      "长期订单能够降低融资成本和需求不确定性，同时提高客户集中度、资源独占和履约风险，合同需要最低采购、调价和退出保护。",
    publishedAt: "2026-05-08",
    eventType: "商业模式 / 长期合同",
    relationshipToCloudsky:
      "云天可研究以长期订单支持项目融资，但必须控制集中度和交付条款。",
    sourceNote: "Akamai 财报沟通及 Reuters/Bloomberg 报道；客户身份未确认。",
    notionPageUrl: notion.创投与其他重要信息,
    sourceLinks: [
      {
        label: "Reuters 报道",
        url: "https://www.reuters.com/business/anthropic-signs-18-billion-ai-cloud-deal-with-akamai-bloomberg-news-reports-2026-05-08/",
      },
    ],
    tags: ["长期合同", "项目融资", "资本开支"],
  }),
  item(30, {
    categorySlug: "other-intelligence",
    companyNames: ["创投与其他重要信息"],
    title: "Brookfield 将 Ori 并入 Radiant 组建 AI 基础设施平台",
    summary:
      "Brookfield 将云计算公司 Ori 并入 Radiant，并把能源、数据中心、GPU 与调度软件整合为基础设施投资平台。",
    details:
      "交易后的平台由基础设施基金、共同投资和融资支持，英伟达提供芯片协同，Bloom Energy 提供电力方案，显示 AI 云资本结构正在向传统基础设施靠拢。",
    publishedAt: "2026-02-27",
    eventType: "并购 / 基础设施基金",
    relationshipToCloudsky:
      "大规模算力网络需要组合稳定合同、设备残值、节点现金流和项目融资，而不只是股权融资。",
    sourceNote: "Reuters 报道。",
    notionPageUrl: notion.创投与其他重要信息,
    sourceLinks: [
      {
        label: "Reuters 报道",
        url: "https://www.reuters.com/business/brookfields-new-ai-unit-radiant-valued-13-billion-after-merger-with-uk-startup-2026-02-27/",
      },
    ],
    tags: ["并购", "基础设施基金", "项目融资"],
  }),
];
