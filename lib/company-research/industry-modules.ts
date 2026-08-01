export type IndustryModuleDefinition = {
  code: string;
  name: string;
  description: string;
  metrics: Array<{ code: string; label: string; unit?: string }>;
};

export const industryModuleDefinitions: IndustryModuleDefinition[] = [
  { code: "ai-infra", name: "AI 大模型 / AI Infra", description: "模型能力、调用、成本、客户与单位经济模型。", metrics: [{ code: "TOKEN_VOLUME", label: "Token 调用量" }, { code: "INFERENCE_COST", label: "推理成本" }, { code: "API_REVENUE", label: "API 收入" }, { code: "GPU_CAPEX", label: "GPU / 算力资本开支" }, { code: "NET_RETENTION", label: "续费率", unit: "%" }] },
  { code: "semiconductor", name: "半导体", description: "技术节点、良率、产能、客户认证和资本开支。", metrics: [{ code: "YIELD", label: "良率", unit: "%" }, { code: "CAPACITY_UTILIZATION", label: "产能利用率", unit: "%" }, { code: "ASP", label: "ASP" }, { code: "INVENTORY_DAYS", label: "库存天数", unit: "天" }] },
  { code: "consumer-ip", name: "消费品 / IP", description: "品牌、IP 生命周期、渠道、库存与复购。", metrics: [{ code: "SAME_STORE_GROWTH", label: "同店增速", unit: "%" }, { code: "REPEAT_PURCHASE", label: "复购率", unit: "%" }, { code: "INVENTORY_TURNOVER", label: "库存周转" }, { code: "OVERSEAS_REVENUE", label: "海外收入" }] },
  { code: "gaming", name: "游戏", description: "产品储备、用户、流水、变现和研发周期。", metrics: [{ code: "DAU", label: "DAU" }, { code: "MAU", label: "MAU" }, { code: "ARPU", label: "ARPU" }, { code: "DEFERRED_REVENUE", label: "递延收入" }] },
  { code: "saas", name: "SaaS / 企业软件", description: "ARR、留存、客户结构、获客与回收效率。", metrics: [{ code: "ARR", label: "ARR" }, { code: "NRR", label: "NRR", unit: "%" }, { code: "GROSS_RETENTION", label: "毛收入留存", unit: "%" }, { code: "CAC_PAYBACK", label: "CAC 回收期", unit: "月" }] },
  { code: "manufacturing", name: "制造业", description: "产能、成本、订单、客户、营运资本和海外收入。", metrics: [{ code: "CAPACITY", label: "产能" }, { code: "CAPACITY_UTILIZATION", label: "产能利用率", unit: "%" }, { code: "ORDER_BACKLOG", label: "在手订单" }, { code: "RECEIVABLE_DAYS", label: "应收账款天数", unit: "天" }] },
  { code: "baijiu-channel", name: "白酒及渠道消费", description: "批价、渠道库存、动销、合同负债与产品结构。", metrics: [{ code: "WHOLESALE_PRICE", label: "批价" }, { code: "CHANNEL_INVENTORY", label: "渠道库存" }, { code: "CONTRACT_LIABILITIES", label: "合同负债" }, { code: "DEALER_COUNT", label: "经销商数量" }] }
];
