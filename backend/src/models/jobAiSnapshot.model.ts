import { Timestamp } from "firebase-admin/firestore";

export type SnapshotProvider = "openai" | "claude" | "local" | "hybrid";
export type SnapshotTrigger = "ai_ranking" | "shortage_advice" | "manual";

export interface CandidateRankingSnapshotItem {
  applicationId: string;
  userId?: string;
  name?: string;
  skillMatchPercent?: number;
  availabilityMatch?: number;
  locationMatch?: number;
  compliancePass?: boolean;
  overallRankScore?: number;
  readyNow?: boolean;
  note?: string;
}

export interface JobShortageSnapshot {
  detected: boolean;
  alerts?: string[];
  relaxNonEssentialRequirements?: string[];
  consultingServiceActions?: string[];
}

export interface JobAISnapshotInput {
  provider: SnapshotProvider;
  trigger?: SnapshotTrigger;
  ranking: CandidateRankingSnapshotItem[];
  shortage: JobShortageSnapshot;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface JobAISnapshotSummary {
  candidateCount: number;
  readyNowCount: number;
  averageRankScore: number;
  shortageDetected: boolean;
}

export interface JobAISnapshot extends JobAISnapshotInput {
  id: string;
  jobId: string;
  createdBy: string;
  summary: JobAISnapshotSummary;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
