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

export type CustomQuestionType = "text" | "textarea" | "select" | "multi_select" | "boolean" | "file";

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

// A "file"-type answer, uploaded from the public intake form. Stored as a base64 data URL
// directly on the Enquiry doc (same pattern the rest of Orchestra uses for small knowledge
// -base images — see MAX_IMAGE_BYTES in App.tsx) rather than in Firebase Storage, since this
// app has no Storage bucket/rules set up at all; simplest to stay consistent with what
// already exists. MAX_CUSTOM_FILE_BYTES (in PublicIntakePortal.tsx) keeps it small enough
// to leave headroom under Firestore's 1MB-per-document cap alongside everything else on
// the enquiry.
export interface CustomFileAnswer {
  fileName: string;
  dataUrl: string;
  /** Original file size in bytes, pre-base64 (which inflates by ~33%) — for display only. */
  size: number;
}

export function isCustomFileAnswer(val: unknown): val is CustomFileAnswer {
  return !!val && typeof val === "object" && !Array.isArray(val) && typeof (val as any).dataUrl === "string";
}

export type CustomFieldResponse = string | string[] | boolean | CustomFileAnswer;

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
  clientFirstName: string;
  clientSurname: string;
  /** @deprecated Enquiries submitted before the name field was split into first/surname
   *  only have this combined field. Read via enquiryClientFullName, never directly. */
  clientName?: string;
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
  clientFirstName: string;
  clientSurname: string;
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

/** The client's display name — prefers the split first/surname fields, falling back to the
 *  legacy combined `clientName` for enquiries submitted before the split. Use this instead
 *  of reading clientFirstName/clientSurname/clientName directly anywhere they're displayed. */
export function enquiryClientFullName(e: Pick<Enquiry, "clientFirstName" | "clientSurname" | "clientName">): string {
  const joined = [e.clientFirstName?.trim(), e.clientSurname?.trim()].filter(Boolean).join(" ");
  return joined || e.clientName?.trim() || "";
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

// Seeded onto every brand-new intake form (see EnquiryHub's ensureConfig — this never
// touches a form a developer has already configured, only a form that's never had a config
// doc at all). Covers only what the fixed fields above (name, email, company, project
// title/description) don't already ask — no duplicate questions for those.
export const DEFAULT_INTAKE_QUESTIONS: CustomQuestion[] = [
  { id: "feature_1", label: "Key feature requirement 1", type: "text", required: false },
  { id: "feature_2", label: "Key feature requirement 2", type: "text", required: false },
  { id: "feature_3", label: "Key feature requirement 3", type: "text", required: false },
  { id: "feature_4", label: "Key feature requirement 4", type: "text", required: false },
  { id: "feature_5", label: "Key feature requirement 5", type: "text", required: false },
  {
    id: "primary_user",
    label: "Who is the primary user?",
    description: "e.g., internal team, direct consumers, B2B clients.",
    type: "text",
    required: false,
  },
  {
    id: "core_problem",
    label: "What single problem does this solve right now?",
    type: "textarea",
    required: false,
  },
  {
    id: "roles_permissions",
    label: "What types of roles/permissions are needed?",
    description: "e.g., Simple single-user, multi-user with admin/member tiers, or public/no login needed.",
    type: "text",
    required: false,
  },
  {
    id: "day_one_mvp",
    label: "If the app could only do one thing well on day one, what is it?",
    type: "textarea",
    required: false,
  },
  {
    id: "aesthetic_adjectives",
    label: "Describe the desired aesthetic in 3–4 adjectives",
    description: `e.g., "Dark-mode, sleek, technical, minimal" vs. "Playful, pastel, rounded, friendly".`,
    type: "text",
    required: false,
  },
  {
    id: "brand_guidelines",
    label: "Are there specific brand guidelines to follow?",
    description: "e.g., specific color codes or an existing design system.",
    type: "textarea",
    required: false,
  },
  {
    id: "brand_logo",
    label: "Logo or brand assets",
    description: "Upload your logo or any brand asset file, if you have one.",
    type: "file",
    required: false,
  },
  {
    id: "competitors_inspiration",
    label: "Competitors or inspiration apps",
    description: "URLs of products where you like the layout, micro-interactions, or information hierarchy.",
    type: "textarea",
    required: false,
  },
  {
    id: "deployment_device",
    label: "Expected deployment & device preference",
    description: "e.g., Desktop-first web app, mobile-optimized responsive web.",
    type: "text",
    required: false,
  },
];

export function defaultIntakeFormConfig(userId: string, token: string): IntakeFormConfig {
  return {
    id: token,
    userId,
    token,
    title: "Tell us about your project",
    description: "A few questions so we can scope your build accurately — this takes about two minutes.",
    companyName: "",
    accentColor: "#3b82f6",
    customQuestions: DEFAULT_INTAKE_QUESTIONS.map(q => ({ ...q })),
    notificationEmails: [],
    isPublished: false,
    updatedAt: new Date().toISOString(),
  };
}
