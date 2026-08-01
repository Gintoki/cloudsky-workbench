export const methodologySource = {
  title: "投资方法框架（用户提供）",
  publisher: "内部研究方法论资料",
  sourceType: "INTERNAL_DOCUMENT",
  locator: "方法论提炼自该文件的跨页结构与章节，不包含其中的公司案例数据。",
};

export const methodologyFacts = [
  {
    title: "结论应与证据类型分开记录",
    content:
      "公司研究应将已核实事实、预测、推断、主观观点和未知项分开标注；结论需要能追溯到来源或明确说明为研究判断。",
    secondaryCategory: "证据与结论",
  },
  {
    title: "核心假设需要可验证和可证伪",
    content:
      "每家公司保留少量关键假设，并同步记录支持证据、反对证据、验证指标、失效条件、负责人、置信度与下次复查日期。",
    secondaryCategory: "假设管理",
  },
  {
    title: "护城河需要区分性质与趋势",
    content:
      "护城河分析应区分暂时性技术领先、需持续投入维持的优势和结构性优势，并记录强度、趋势、反证与失效条件。",
    secondaryCategory: "竞争优势",
  },
  {
    title: "财务质量不能由单一增长指标替代",
    content:
      "收入增长、利润率、现金转换、资本回报、杠杆和资本开支需要共同分析，并区分报表值、正常化值和异常年份。",
    secondaryCategory: "财务质量",
  },
  {
    title: "估值方法应与公司特征匹配",
    content:
      "估值需按公司经济特征选择方法并以情景表达不确定性；当输入不足或价格过期时，应明确暂时无法形成当前估值。",
    secondaryCategory: "估值纪律",
  },
  {
    title: "风险与反方观点是研究的组成部分",
    content:
      "催化剂、核心风险、反方观点和监控触发条件应与正面论据并列记录，避免将高质量公司直接等同于可投资价格。",
    secondaryCategory: "风险管理",
  },
] as const;
