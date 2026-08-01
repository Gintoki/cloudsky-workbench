export const investorTypeLabels: Record<string, string> = {
  INSTITUTION: "机构投资者",
  FUND: "基金",
  STRATEGIC: "产业资本",
  FAMILY_OFFICE: "家族办公室",
  INDIVIDUAL: "个人投资者",
  OTHER: "其他",
};

export const investorStageLabels: Record<string, string> = {
  TARGET: "待接触",
  ENGAGED: "已接触",
  DILIGENCE: "跟进中",
  ACTIVE: "活跃",
  PAUSED: "暂缓",
  DECLINED: "不推进",
};

export const roadshowFormatLabels: Record<string, string> = {
  ONLINE: "线上会议",
  IN_PERSON: "线下面谈",
  PHONE: "电话会议",
  CONFERENCE: "会议活动",
  OTHER: "其他",
};

export {
  investorVisibilityLabels,
  investorVisibilityValues,
  type InvestorVisibility,
} from "./visibility";

export type InvestorContactRecord = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  wechat: string | null;
  isPrimary: boolean;
};

export type InvestorAccountRecord = {
  id: string;
  name: string;
  investorType: string;
  relationshipStage: string;
  focus: string | null;
  geography: string | null;
  website: string | null;
  notes: string | null;
  visibility: import("./visibility").InvestorVisibility;
  nextAction: string | null;
  nextActionAt: string | null;
  lastInteractionAt: string | null;
  contacts: InvestorContactRecord[];
  roadshowCount: number;
  latestRoadshowAt: string | null;
};

export type InvestorCrmData = {
  databaseAvailable: boolean;
  accounts: InvestorAccountRecord[];
};

export type RoadshowTranscriptSegmentRecord = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speaker: string | null;
  content: string;
};

export type RoadshowRecord = {
  id: string;
  investorAccountId: string;
  investorAccountName: string;
  investorContactId: string | null;
  title: string;
  format: string;
  occurredAt: string;
  durationSeconds: number | null;
  audioUrl: string | null;
  transcript: string | null;
  keyTakeaways: string | null;
  nextAction: string | null;
  followUpDueAt: string | null;
  visibility: import("./visibility").InvestorVisibility;
  segments: RoadshowTranscriptSegmentRecord[];
};

export type RoadshowListData = {
  databaseAvailable: boolean;
  records: RoadshowRecord[];
};
