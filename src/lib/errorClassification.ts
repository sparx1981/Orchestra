// Classifies whether an agent-call failure is worth retrying. The retry loop previously
// treated every non-abort error identically — a brief provider hiccup and a fully-depleted
// billing account both got the same two retries with exponential backoff. For a quota/
// billing exhaustion specifically, that's pure waste: the error will not resolve itself in
// the 1-2 seconds between retries, and a 6-agent round burns 3x its normal call volume in
// attempts that were never going to succeed — exactly what a real usage log showed, at
// exactly the moment a user's account had the least room to absorb it.

export type ErrorClassification =
  | { isUnrecoverable: true; reason: "quota_exhausted" | "auth_failure" }
  | { isUnrecoverable: false; reason?: "transient_overload" };

/** Looks at an error's message/status for signals that retrying immediately cannot help:
 *  quota/billing exhaustion (RESOURCE_EXHAUSTED, "credits are depleted", 429 paired with a
 *  billing-shaped message) or an authentication failure (401/403, invalid API key). A plain
 *  429 without a billing-shaped message is treated as a normal, retryable rate limit —
 *  those genuinely do recover within the backoff window.
 *
 *  A 503/UNAVAILABLE "high demand" response is a THIRD case, distinct from both: it's
 *  retryable (the provider is explicitly saying "try again later," not "you're not allowed
 *  to"), but a real capacity spike on the provider's side routinely takes tens of seconds to
 *  clear, not the ~1-2 total seconds a generic transient-error backoff allows. Flagging it
 *  separately lets the retry loop give it a genuinely longer runway instead of either giving
 *  up too early (generic schedule) or overpaying the same longer schedule on every ordinary
 *  blip (quota/auth style unconditional fail-fast would be wrong here too — this DOES
 *  usually resolve, just not within two seconds). */
export function classifyAgentError(err: any): ErrorClassification {
  const message: string = String(err?.message || err?.response?.data?.error?.message || err || "").toLowerCase();
  const status: string = String(err?.response?.data?.error?.status || err?.status || "").toUpperCase();
  const httpCode: number | undefined = err?.response?.status || err?.code;

  const quotaSignals = ["resource_exhausted", "quota", "credits are depleted", "insufficient_quota", "billing"];
  if (status === "RESOURCE_EXHAUSTED" || quotaSignals.some(s => message.includes(s))) {
    return { isUnrecoverable: true, reason: "quota_exhausted" };
  }

  if (httpCode === 401 || httpCode === 403 || message.includes("invalid api key") || message.includes("unauthorized") || message.includes("permission_denied")) {
    return { isUnrecoverable: true, reason: "auth_failure" };
  }

  const overloadSignals = ["high demand", "overloaded", "temporarily unavailable", "try again later"];
  if (status === "UNAVAILABLE" || httpCode === 503 || overloadSignals.some(s => message.includes(s))) {
    return { isUnrecoverable: false, reason: "transient_overload" };
  }

  return { isUnrecoverable: false };
}

/** A short, actionable message for the specific unrecoverable reason — replacing a generic
 *  "check your API keys" message that doesn't tell a quota-exhausted user what actually
 *  went wrong or where to fix it. */
export function unrecoverableErrorGuidance(reason: "quota_exhausted" | "auth_failure"): string {
  if (reason === "quota_exhausted") {
    return "Your provider account is out of credits or over its quota. Retrying won't help until you add credits or the quota resets — check your provider's billing page.";
  }
  return "One of your API keys was rejected (invalid or expired). Check your keys in Settings before retrying.";
}
