// ============================================================
// Types partagés — Tendance LK Marché
// ============================================================

export type ContractType = "CDI" | "CDD" | "alternance" | "stage" | "freelance" | string;
export type ActivityLevel = "high" | "medium" | "low";
export type ChatPhase =
  | "idle"
  | "parsing"
  | "confirming"
  | "collecting"
  | "analyzing"
  | "done"
  | "error";

// ── Requête utilisateur parsée par Claude ──────────────────
export interface ParsedQuery {
  secteur: string;
  typeContrat: ContractType;
  localisation: string;
  keywords: string[];
  raw: string;
}

// ── Données brutes collectées ──────────────────────────────
export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  postedAt: string;
  contractType?: string;
  url?: string;
}

export interface NewsArticle {
  title: string;
  link: string;
  publishedAt: string;
  source?: string;
  snippet?: string;
}

export interface CollectedData {
  jobs: JobOffer[];
  news: NewsArticle[];
  totalJobsFound: number;
  sources: string[];
}

// ── Rapport généré par Claude ──────────────────────────────
export interface CompanySignal {
  name: string;
  activeJobCount: number;
  recentActivity: string;
  activityLevel: ActivityLevel;
}

export interface SkillFrequency {
  skill: string;
  count: number;
  percentage: number;
}

export interface MarketReport {
  query: ParsedQuery;
  generatedAt: string;
  executiveSummary: string;
  trends: string[];
  topCompanies: CompanySignal[];
  topSkills: SkillFrequency[];
  totalJobsAnalyzed: number;
  isDemo: boolean;
}

// ── Chat UI ────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";
export type MessageType = "text" | "confirmation" | "progress" | "report" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  data?: ParsedQuery | MarketReport;
  timestamp: Date;
}
