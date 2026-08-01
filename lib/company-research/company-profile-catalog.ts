export type CompanyProfileSeed = {
  companyName: string;
  overview: string;
  businessModel: string;
  sourceTitle: string;
  publisher: string;
  url: string;
};

export const companyProfileSeeds: CompanyProfileSeed[] = [
  {
    companyName: "Cloudflare",
    overview: "Cloudflare 运营全球云网络，向企业和开发者提供连接、安全与开发平台服务。",
    businessModel: "公司做什么：提供网络连接、安全、性能和开发者云服务。\n\n客户与用户：面向需要保护和交付互联网应用、网络与数据的企业及开发者。\n\n收入方式：以订阅和按使用量计费的云服务为主，具体合同和产品组合需结合公司披露持续跟踪。",
    sourceTitle: "Cloudflare Developer Platform Overview",
    publisher: "Cloudflare",
    url: "https://developers.cloudflare.com/",
  },
  {
    companyName: "DigitalOcean",
    overview: "DigitalOcean 是面向开发者、初创企业和中小企业的云计算平台。",
    businessModel: "公司做什么：提供虚拟机、托管 Kubernetes、数据库、应用平台和 AI/算力等云产品。\n\n客户与用户：主要服务开发者、初创企业和中小企业。\n\n收入方式：客户按云资源、托管服务和平台用量付费；产品组合及客户留存需要以定期披露为准。",
    sourceTitle: "DigitalOcean About",
    publisher: "DigitalOcean",
    url: "https://www.digitalocean.com/about",
  },
  {
    companyName: "PPIO",
    overview: "PPIO 提供面向 AI 与互联网场景的分布式云计算基础设施服务。",
    businessModel: "公司做什么：提供云算力、存储、网络及相关基础设施能力。\n\n客户与用户：面向需要弹性算力和云基础设施的开发者及企业用户。\n\n收入方式：以云资源和相关服务的使用量或合同计费；具体产品结构和客户情况待以公司正式披露核验。",
    sourceTitle: "PPIO Official Website",
    publisher: "PPIO",
    url: "https://ppio.com/",
  },
  {
    companyName: "SK 海力士",
    overview: "SK 海力士是一家存储半导体公司，业务覆盖 DRAM、NAND Flash 和 SSD 等产品。",
    businessModel: "公司做什么：研发、制造并销售存储芯片及存储解决方案。\n\n客户与用户：下游覆盖服务器、移动终端、企业级存储和消费电子产业链。\n\n收入方式：主要通过存储芯片和存储产品销售实现收入，价格、产品组合和产能利用率是核心跟踪变量。",
    sourceTitle: "SK hynix Company Overview",
    publisher: "SK hynix",
    url: "https://news.skhynix.com/sk-hynix-story/company-overview/",
  },
  {
    companyName: "华为",
    overview: "华为是 ICT 基础设施和智能终端提供商，覆盖运营商、企业与消费者业务。",
    businessModel: "公司做什么：提供通信网络、IT 产品与解决方案、云服务、数字能源、智能汽车解决方案和智能终端。\n\n客户与用户：服务运营商、企业、政府及消费者。\n\n收入方式：以设备、解决方案、云服务和终端产品销售及服务收入构成；业务分部口径以公司年度报告为准。",
    sourceTitle: "华为公司简介",
    publisher: "华为",
    url: "https://www.huawei.com/cn/corporate-information",
  },
  {
    companyName: "小米",
    overview: "小米是一家消费电子与智能制造公司，产品覆盖智能手机、智能硬件和互联网服务。",
    businessModel: "公司做什么：销售智能手机、IoT 与生活消费产品，并提供互联网服务。\n\n客户与用户：主要面向全球消费者及其生态产品用户。\n\n收入方式：硬件产品销售与互联网服务共同构成收入，具体分部表现和区域结构以年度披露为准。",
    sourceTitle: "Xiaomi Global Official Website",
    publisher: "Xiaomi",
    url: "https://www.mi.com/global/",
  },
  {
    companyName: "无问芯穹",
    overview: "无问芯穹是一家面向大模型应用的 AI 基础设施公司。",
    businessModel: "公司做什么：提供面向大模型训练、推理和部署的算力与软件基础设施能力。\n\n客户与用户：面向需要使用或部署大模型能力的企业、开发者和生态伙伴。\n\n收入方式：以算力、平台及企业服务相关的合同或用量计费为主要研究方向；收入结构尚需以正式披露核验。",
    sourceTitle: "无问芯穹官方网站",
    publisher: "无问芯穹",
    url: "https://www.infini-ai.com/",
  },
  {
    companyName: "海光信息",
    overview: "海光信息从事高端通用处理器和协处理器等芯片产品的研发与销售。",
    businessModel: "公司做什么：研发并销售服务器 CPU、DCU 等计算芯片及配套方案。\n\n客户与用户：面向服务器、数据中心和高性能计算产业链客户。\n\n收入方式：以芯片及相关产品销售实现收入，产品迭代、生态适配、客户验证和供应链是关键跟踪变量。",
    sourceTitle: "海光信息官方网站",
    publisher: "海光信息",
    url: "https://www.hygon.cn/",
  },
  {
    companyName: "海马云",
    overview: "海马云提供云游戏和实时互动云服务相关能力。",
    businessModel: "公司做什么：提供云端渲染、实时互动和云游戏等基础设施与服务能力。\n\n客户与用户：面向游戏发行、内容平台及需要实时互动体验的企业客户。\n\n收入方式：以云资源、平台服务和项目合同为主要研究方向；具体产品和客户结构需要持续核验。",
    sourceTitle: "海马云官方网站",
    publisher: "海马云",
    url: "https://www.haimacloud.com/",
  },
  {
    companyName: "硅基流动",
    overview: "硅基流动提供面向生成式 AI 的模型推理与云服务能力。",
    businessModel: "公司做什么：为模型开发与应用提供推理平台、模型服务及相关基础设施能力。\n\n客户与用户：面向开发者、模型团队和企业 AI 应用客户。\n\n收入方式：主要研究模型调用、算力和企业服务的收费方式；商业化规模和单位经济模型需持续核验。",
    sourceTitle: "硅基流动官方网站",
    publisher: "硅基流动",
    url: "https://siliconflow.cn/",
  },
  {
    companyName: "英伟达",
    overview: "英伟达是一家加速计算公司，提供 GPU、网络、系统和软件平台。",
    businessModel: "公司做什么：提供面向数据中心、专业可视化、游戏和汽车等场景的加速计算产品与软件。\n\n客户与用户：客户包括云服务商、企业、系统厂商、开发者和消费者。\n\n收入方式：主要来自计算与网络产品、图形产品及相关软件和服务，具体分部以年度报告口径为准。",
    sourceTitle: "NVIDIA About",
    publisher: "NVIDIA",
    url: "https://www.nvidia.com/en-us/about-nvidia/",
  },
  {
    companyName: "苹果",
    overview: "苹果设计、制造并销售消费电子产品，同时提供软件和服务。",
    businessModel: "公司做什么：销售 iPhone、Mac、iPad、可穿戴设备及配件，并提供数字内容、云服务和支付等服务。\n\n客户与用户：主要面向全球消费者、企业及开发者生态。\n\n收入方式：硬件销售和服务收入共同构成业务，产品组合、区域结构和服务渗透率应以年度披露持续跟踪。",
    sourceTitle: "Apple Official Website",
    publisher: "Apple",
    url: "https://www.apple.com/",
  },
  {
    companyName: "长鑫存储",
    overview: "长鑫存储是一家从事 DRAM 存储芯片研发与制造的公司。",
    businessModel: "公司做什么：研发、制造和销售 DRAM 存储芯片及相关产品。\n\n客户与用户：下游覆盖消费电子、移动终端、服务器和其他存储应用产业链。\n\n收入方式：以存储芯片产品销售为主要研究方向，技术节点、良率、产能、客户验证和产品价格是核心跟踪变量。",
    sourceTitle: "长鑫存储官方网站",
    publisher: "长鑫存储",
    url: "https://www.cxmt.com/",
  },
];
