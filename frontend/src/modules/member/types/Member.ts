export interface MemberAttribute {
  default: string;
  custom: string;
  github?: string;
  twitter?: string;
}

export interface MemberContribution {
  firstCommitDate: string;
  id: number;
  lastCommitDate: string;
  numberCommits: number;
  summary: string;
  topics: string[];
  url: string;
}

export interface MemberReach {
  total: number;
  github: number;
  twitter: number;
}

export interface MemberTag {
  id: string;
  name: string;
}

export interface Member {
  activeDaysCount: string;
  activeOn: string[] | null;
  activityCount: string;
  activityTypes:string[] | null;
  attributes: Record<string, MemberAttribute>
  averageSentiment: string | null;
  contributions: MemberContribution[]
  createdAt: string;
  displayName: string;
  emails: string[]
  id: string;
  identities: string[] | null;
  importHash: string | null;
  joinedAt: string;
  lastActive: string | null;
  lastEnriched: string | null;
  noMergeIds: string[] | null;
  numberOfOpenSourceContributions: number | null;
  organizations: any[];
  reach:MemberReach;
  score: number;
  tags: MemberTag[];
  tenantId: string;
  toMergeIds: string[] | null;
  updatedAt: string;
  username: Record<string, string[]>
}
