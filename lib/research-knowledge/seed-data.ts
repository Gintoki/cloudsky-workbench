import type { ResearchItemInput } from "./types";

type SeedResearchItem = ResearchItemInput & { id: string; sourceId: string; versionId: string; organizationId: string };

const businessCase = (
  idSuffix: string,
  company: string,
  sourceUrl: string,
  product: string,
  pricingUnit: string,
  cloudskyFit: string,
): SeedResearchItem => ({
  id: `52000000-0000-4000-8000-${idSuffix}`,
  sourceId: `53000000-0000-4000-8000-${idSuffix}`,
  versionId: `54000000-0000-4000-8000-${idSuffix}`,
  organizationId: `51000000-0000-4000-8000-${idSuffix}`,
  dimension: "BUSINESS_MODEL",
  subtype: "BUSINESS_MODEL_CASE",
  title: `${company}：AI 基础设施商业模式案例`,
  summary: "基于公开产品与开发者资料建立的商业模式研究卡片，需结合目标客户、成本结构与定价验证持续更新。",
  whatHappened: `${company} 被纳入 CloudSky 的公开商业模式案例库。本条目只记录公开产品资料可支持的研究切入点，不使用未经核验的实时经营数据。`,
  whyItMatters: "AI 基础设施的产品形态、计费单位和交付方式决定了收入可复制性与成本控制边界，适合作为 CloudSky 设计商业化路径时的比较样本。",
  cloudskyImplication: cloudskyFit,
  recommendedAction: "补充目标客户访谈和单位经济模型，验证客户付费意愿、交付成本及可复制环节。",
  eventDate: "2026-08-01",
  importance: "MEDIUM",
  confidence: "MEDIUM",
  status: "REVIEWED",
  nextAction: "确认可复制的客户分层、收费单位和成本归集口径。",
  nextFollowUpDate: "2026-08-15",
  details: {
    benchmarkCompany: company,
    customerType: "待按目标客户访谈验证",
    product,
    payer: "待按具体产品与合同验证",
    pricingUnit,
    revenueType: "待验证",
    costDriver: "算力、带宽、模型服务与交付成本需单独拆解",
    marginPotential: "待验证",
    scalability: "待验证",
    repeatability: "待验证",
    moat: "待验证",
    cloudskyFit,
    implementationDifficulty: "待评估",
    validationStage: "公开资料初步研究",
    counterEvidence: "公开资料不能替代客户留存、单位经济模型和实际合同验证。",
  },
  organizations: [{ name: company, organizationType: "COMPANY", relationship: "商业模式案例" }],
  sources: [{ sourceType: "官方公开资料", title: `${company} 官方产品资料`, url: sourceUrl, publisher: company }],
  changeSummary: "初始化公开商业模式案例",
});

export const researchKnowledgeSeeds: SeedResearchItem[] = [
  businessCase("000000000001", "Hugging Face", "https://huggingface.co/docs/hub/index", "模型、数据集与部署工具平台", "产品与服务的具体计费单位待按官方合同和产品页验证", "研究平台型生态、开发者入口与企业服务之间的协同，并明确哪些能力适合 CloudSky 自建、合作或集成。"),
  businessCase("000000000002", "Together AI", "https://docs.together.ai/docs/introduction", "模型推理与开发者服务", "按模型服务用量等方式计费的具体规则待验证", "研究模型服务、推理资源和开发者体验如何组合为可执行的 CloudSky 产品包。"),
  businessCase("000000000003", "CoreWeave", "https://docs.coreweave.com/", "云计算与加速计算服务", "按资源和服务层级计费的具体规则待验证", "研究算力供给、资源调度与企业交付之间的价值链位置，避免把规模叙事直接当成盈利能力。"),
  businessCase("000000000004", "Replicate", "https://replicate.com/docs", "模型运行与 API 服务", "按 API 或计算使用量的具体规则待验证", "研究低门槛模型调用的产品化路径，以及可观察的成本、定价和交付边界。"),
  businessCase("000000000005", "Fireworks AI", "https://docs.fireworks.ai/", "模型推理与开发者平台", "按使用量和产品方案的具体规则待验证", "研究面向开发者与企业的推理服务如何形成可复制交付，并以真实客户验证替代静态对标。"),
];
