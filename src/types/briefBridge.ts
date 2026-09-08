// src/types/briefBridge.ts
//
// BriefBridge: a client-intake and prompt-synthesis module bolted onto Orchestra.
// A developer publishes a public intake form (`/intake/:token`), a client fills it
// in with no account of their own, the submission lands in the developer's private
// "Enquiry Hub", and from there it can be compiled into a ready-made prompt and
// piped straight into the Product tab ("Pipe-to-Prompt").
//
// Kept deliberately small and string-keyed (no enums) so it serializes cleanly to
// and from Firestore without any custom converter.

export type EnquiryStatus = "new" | "triaged" | "converted" | "archived";

export type BudgetTier = "sub_5k" | "5k_15k" | "15k_50k" | "50k_plus" | "undisclosed";

export type TargetLaunchTimeframe = "immediate" | "within_month" | "one_to_three_months" | "flexible";

export type CustomQuestionType = "text" | "textarea" | "select" | "multi_select" | "boolean";

export interface CustomQuestion {
  id: string;
  label: string;
  description?: string;
  type: CustomQuestionType;
  required: boolean;
  /** Only used when type is "select" or "multi_select". */
  options?: string[];
  placeholder?: string;
}

export type CustomFieldResponse = string | string[] | boolean;

/**
 * Owner-facing configuration for one intake form. `token` doubles as the
 * Firestore document id of its public mirror at /intakeTokens/{token}, and as
 * the /intake/:token URL segment shown to clients.
 */
export interface IntakeFormConfig {
  id: string;
  userId: string;
  token: string;
  title: string;
  description: string;
  companyName?: string;
  accentColor?: string;
  customQuestions: CustomQuestion[];
  /** Recipients for the "new lead" transactional email. Never exposed publicly. */
  notificationEmails: string[];
  isPublished: boolean;
  updatedAt: string;
}

/** The subset of IntakeFormConfig that's safe to read without authentication. */
export type PublicIntakeFormConfig = Omit<IntakeFormConfig, "notificationEmails" | "userId">;

export interface Enquiry {
  id: string;
  userId: string;
  token: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  targetLaunch: TargetLaunchTimeframe;
  budgetTier: BudgetTier;
  projectTitle: string;
  projectDescription: string;
  techPreferences: string[];
  assetLinks: string[];
  customAnswers: Record<string, CustomFieldResponse>;
  status: EnquiryStatus;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape submitted by the public form — narrower than Enquiry (no id/userId/status/etc). */
export interface PublicIntakeSubmission {
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  targetLaunch: TargetLaunchTimeframe;
  budgetTier: BudgetTier;
  projectTitle: string;
  projectDescription: string;
  techPreferences: string[];
  assetLinks: string[];
  customAnswers: Record<string, CustomFieldResponse>;
  /** Honeypot field. Real clients never see or fill this; bots often do. */
  _gotcha?: string;
}

export type PipeToPromptTool = "cursor" | "lovable" | "claude_code" | "v0" | "generic";

export interface PipeToPromptOptions {
  tool: PipeToPromptTool;
  includeTechStack: boolean;
  includeBudgetTimeline: boolean;
  includeDesignAssets: boolean;
  customPreamble?: string;
}

export interface EnquiryFilters {
  status: EnquiryStatus | "all";
  search: string;
}

export const EMPTY_ENQUIRY_FILTERS: EnquiryFilters = { status: "all", search: "" };

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  sub_5k: "Under $5,000",
  "5k_15k": "$5,000 – $15,000",
  "15k_50k": "$15,000 – $50,000",
  "50k_plus": "$50,000+",
  undisclosed: "Not disclosed",
};

export const TARGET_LAUNCH_LABELS: Record<TargetLaunchTimeframe, string> = {
  immediate: "Immediate (ASAP)",
  within_month: "Within 1 month",
  one_to_three_months: "1–3 months",
  flexible: "Flexible",
};

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: "New",
  triaged: "Triaged",
  converted: "Converted",
  archived: "Archived",
};

export function defaultIntakeFormConfig(userId: string, token: string): IntakeFormConfig {
  return {
    id: token,
    userId,
    token,
    title: "Tell us about your project",
    description: "A few questions so we can scope your build accurately — this takes about two minutes.",
    companyName: "",
    accentColor: "#3b82f6",
    customQuestions: [],
    notificationEmails: [],
    isPublished: false,
    updatedAt: new Date().toISOString(),
  };
}
