export type CoverageMarket = "US" | "CN" | "HK";

export interface ComparableSecurity {
  ticker: string;
  name: string;
  market: CoverageMarket;
  currency: "USD" | "CNY" | "HKD";
  researchNames: string[];
}

export const comparableUniverse: ComparableSecurity[] = [
  { ticker: "NET", name: "Cloudflare", market: "US", currency: "USD", researchNames: ["Cloudflare"] },
  { ticker: "AKAM", name: "Akamai", market: "US", currency: "USD", researchNames: ["Akamai"] },
  { ticker: "FSLY", name: "Fastly", market: "US", currency: "USD", researchNames: ["Fastly"] },
  { ticker: "U", name: "Unity Software", market: "US", currency: "USD", researchNames: ["Unity"] },
  { ticker: "CRWV", name: "CoreWeave", market: "US", currency: "USD", researchNames: ["CoreWeave"] },
  { ticker: "DOCN", name: "DigitalOcean", market: "US", currency: "USD", researchNames: ["DigitalOcean"] },
  { ticker: "NBIS", name: "Nebius", market: "US", currency: "USD", researchNames: ["Nebius"] },
  { ticker: "SNOW", name: "Snowflake", market: "US", currency: "USD", researchNames: ["Snowflake"] },
  { ticker: "PLTR", name: "Palantir Technologies", market: "US", currency: "USD", researchNames: ["Palantir"] },
  { ticker: "CRWD", name: "CrowdStrike", market: "US", currency: "USD", researchNames: ["CrowdStrike"] },
  { ticker: "DDOG", name: "Datadog", market: "US", currency: "USD", researchNames: ["Datadog"] },
  { ticker: "MDB", name: "MongoDB", market: "US", currency: "USD", researchNames: ["MongoDB"] },
  { ticker: "DT", name: "Dynatrace", market: "US", currency: "USD", researchNames: ["Dynatrace"] },
  { ticker: "CFLT", name: "Confluent", market: "US", currency: "USD", researchNames: ["Confluent"] },
  { ticker: "600845", name: "\u5b9d\u4fe1\u8f6f\u4ef6", market: "CN", currency: "CNY", researchNames: ["\u5b9d\u4fe1\u8f6f\u4ef6"] },
  { ticker: "300113", name: "\u987a\u7f51\u79d1\u6280", market: "CN", currency: "CNY", researchNames: ["\u987a\u7f51\u79d1\u6280"] },
  { ticker: "688316", name: "\u9752\u4e91\u79d1\u6280-U", market: "CN", currency: "CNY", researchNames: ["\u9752\u4e91\u79d1\u6280-U", "\u9752\u4e91"] },
  { ticker: "688158", name: "\u4f18\u523b\u5f97-W", market: "CN", currency: "CNY", researchNames: ["\u4f18\u523b\u5f97-W", "\u4f18\u523b\u5f97"] },
  { ticker: "600410", name: "\u534e\u80dc\u5929\u6210", market: "CN", currency: "CNY", researchNames: ["\u534e\u80dc\u5929\u6210"] },
  { ticker: "300017", name: "\u7f51\u5bbf\u79d1\u6280", market: "CN", currency: "CNY", researchNames: ["\u7f51\u5bbf\u79d1\u6280"] },
  { ticker: "301316", name: "\u6167\u535a\u4e91\u901a", market: "CN", currency: "CNY", researchNames: ["\u6167\u535a\u4e91\u901a"] },
  { ticker: "920493", name: "\u5e76\u884c\u79d1\u6280", market: "CN", currency: "CNY", researchNames: ["\u5e76\u884c\u79d1\u6280"] },
  { ticker: "0268", name: "\u91d1\u8776\u56fd\u9645", market: "HK", currency: "HKD", researchNames: ["\u91d1\u8776\u56fd\u9645"] },
  { ticker: "KC", name: "\u91d1\u5c71\u4e91", market: "US", currency: "USD", researchNames: ["Kingsoft Cloud", "\u91d1\u5c71\u4e91"] },
  { ticker: "TUYA", name: "\u6d82\u9e26\u667a\u80fd", market: "US", currency: "USD", researchNames: ["Tuya", "\u6d82\u9e26\u667a\u80fd"] },
];
