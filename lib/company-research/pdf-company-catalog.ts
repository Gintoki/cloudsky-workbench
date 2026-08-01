import type { ResearchConclusion } from "./types";

export type PdfResearchCompany = {
  name: string;
  industry: string;
  country: string;
  ticker: string | null;
  exchange: string | null;
  currency: "CNY" | "HKD" | "USD" | null;
  moduleCode: string | null;
  conclusion: ResearchConclusion;
  tags: string[];
  notionPageUrl: string;
};

// The taxonomy and investment labels below come from the existing Notion
// 公司研究库. The PDF itself remains the source for the imported excerpts.
export const pdfResearchCompanies: PdfResearchCompany[] = [
  { name: "智谱", industry: "AI与大模型", country: "中国", ticker: null, exchange: null, currency: null, moduleCode: "ai-infra", conclusion: "AVOID", tags: ["价投版", "技术成长", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81a0a164fa8517ce2ddd" },
  { name: "泡泡玛特", industry: "潮玩与IP消费", country: "中国", ticker: "9992", exchange: "HK", currency: "HKD", moduleCode: "consumer-ip", conclusion: "WATCH", tags: ["价投版", "特许经营", "品牌消费", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a819b8903c95f25680cfe" },
  { name: "山西汾酒", industry: "食品饮料与白酒", country: "中国", ticker: "600809", exchange: "SH", currency: "CNY", moduleCode: "baijiu-channel", conclusion: "POSITIVE_RESEARCH", tags: ["价投版", "特许经营", "品牌消费", "高股息"], notionPageUrl: "https://app.notion.com/3af46ba20d9a8198964afc57ccc6bb64" },
  { name: "拼多多", industry: "电商与交易平台", country: "中国", ticker: "PDD", exchange: "NASDAQ", currency: "USD", moduleCode: null, conclusion: "CAUTIOUS", tags: ["价投版", "平台网络效应", "出海", "治理风险"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81b5a267f00bb45e07f8" },
  { name: "中际旭创", industry: "通信、光模块与电子", country: "中国", ticker: "300308", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "WATCH", tags: ["价投版", "技术成长", "高估值", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81d7ab4fe6abc0b31e80" },
  { name: "东鹏饮料", industry: "食品饮料与白酒", country: "中国", ticker: "605499", exchange: "SH", currency: "CNY", moduleCode: "baijiu-channel", conclusion: "POSITIVE_RESEARCH", tags: ["价投版", "特许经营", "品牌消费"], notionPageUrl: "https://app.notion.com/3af46ba20d9a816695aac7b8a916772f" },
  { name: "药明康德", industry: "医药研发服务", country: "中国", ticker: "603259", exchange: "SH", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "特许经营", "监管风险", "治理风险", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81b19f42e0bd6c82964b" },
  { name: "快手", industry: "社交与内容平台", country: "中国", ticker: "1024", exchange: "HK", currency: "HKD", moduleCode: null, conclusion: "WATCH", tags: ["价投版", "平台网络效应", "技术成长", "治理风险"], notionPageUrl: "https://app.notion.com/3af46ba20d9a8101b17ec917180f6ee9" },
  { name: "腾讯控股", industry: "社交与内容平台", country: "中国", ticker: "0700", exchange: "HK", currency: "HKD", moduleCode: null, conclusion: "POSITIVE_RESEARCH", tags: ["价投版", "特许经营", "平台网络效应"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81f9a13dc4eacf1d546b" },
  { name: "涛涛车业", industry: "智能出行与装备", country: "中国", ticker: "301345", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "品牌消费", "出海", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a811082b1d27f72dd4cd6" },
  { name: "顺网科技", industry: "游戏与线上娱乐", country: "中国", ticker: "300113", exchange: "SZ", currency: "CNY", moduleCode: "gaming", conclusion: "AVOID", tags: ["价投版", "技术成长", "商品周期"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81d0a8fbf2f814da7639" },
  { name: "三花智控", industry: "汽车零部件与热管理", country: "中国", ticker: "002050", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "技术成长", "高估值", "治理风险", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a8142aeffe1a892ac9ccb" },
  { name: "宁德时代", industry: "锂电与新能源车", country: "中国", ticker: "300750", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "WATCH", tags: ["价投版", "技术成长", "商品周期", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81fe9bf8ec1c8d902829" },
  { name: "金山办公", industry: "企业软件与生产力", country: "中国", ticker: "688111", exchange: "SH", currency: "CNY", moduleCode: "saas", conclusion: "WATCH", tags: ["价投版", "特许经营", "技术成长", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81bfa3cbd4a008690dcd" },
  { name: "片仔癀", industry: "中药与品牌药", country: "中国", ticker: "600436", exchange: "SH", currency: "CNY", moduleCode: null, conclusion: "AVOID", tags: ["价投版", "特许经营", "品牌消费", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a812ea18fdb450585a692" },
  { name: "美的集团", industry: "家电与耐用消费", country: "中国", ticker: "000333", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "POSITIVE_RESEARCH", tags: ["价投版", "特许经营", "品牌消费", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a8195a112e29a69e5c9a7" },
  { name: "格力电器", industry: "家电与耐用消费", country: "中国", ticker: "000651", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "POSITIVE_RESEARCH", tags: ["价投版", "特许经营", "品牌消费", "高股息", "治理风险"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81e4a07df5b07074109b" },
  { name: "阿里巴巴", industry: "电商与交易平台", country: "中国", ticker: "9988", exchange: "HK", currency: "HKD", moduleCode: null, conclusion: "WATCH", tags: ["价投版", "平台网络效应", "技术成长", "治理风险", "出海"], notionPageUrl: "https://app.notion.com/3af46ba20d9a812aafb9efb6d1d3d77f" },
  { name: "绿的谐波", industry: "机器人与自动化", country: "中国", ticker: "688017", exchange: "SH", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "技术成长", "商品周期", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81cdaab4d75b84559a35" },
  { name: "隆基绿能", industry: "光伏与储能", country: "中国", ticker: "601012", exchange: "SH", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "商品周期", "技术成长"], notionPageUrl: "https://app.notion.com/3af46ba20d9a816bad64d9130a56166f" },
  { name: "信维通信", industry: "通信、光模块与电子", country: "中国", ticker: "300136", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "商品周期", "技术成长", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81809eade0f2247c396e" },
  { name: "完美世界", industry: "游戏与线上娱乐", country: "中国", ticker: "002624", exchange: "SZ", currency: "CNY", moduleCode: "gaming", conclusion: "AVOID", tags: ["价投版", "商品周期", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81ba8cbfd385385b2766" },
  { name: "京东方", industry: "显示与终端硬件", country: "中国", ticker: "000725", exchange: "SZ", currency: "CNY", moduleCode: "manufacturing", conclusion: "AVOID", tags: ["价投版", "商品周期", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a81b38aebebcd2e9dd459" },
  { name: "深信服", industry: "网络安全与云基础设施", country: "中国", ticker: "300454", exchange: "SZ", currency: "CNY", moduleCode: "saas", conclusion: "AVOID", tags: ["价投版", "技术成长", "高估值"], notionPageUrl: "https://app.notion.com/3af46ba20d9a8129a323e9b4cc9deeae" },
];
