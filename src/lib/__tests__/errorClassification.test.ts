import { describe, it, expect } from "vitest";
import { classifyAgentError, unrecoverableErrorGuidance } from "../errorClassification";

describe("classifyAgentError", () => {
  it("classifies the exact Gemini quota-exhaustion shape from a real usage log as unrecoverable", () => {
    const err = {
      response: {
        data: {
          error: {
            code: 429,
            message: "Your prepayment credits are depleted. Please go to AI Studio at https://ai.studio/projects to manage your project and billing.",
            status: "RESOURCE_EXHAUSTED"
          }
        }
      }
    };
    const result = classifyAgentError(err);
    expect(result.isUnrecoverable).toBe(true);
    expect(result.reason).toBe("quota_exhausted");
  });

  it("classifies a plain rate-limit message as retryable (not unrecoverable)", () => {
    const err = { message: "Request failed with status code 429" };
    expect(classifyAgentError(err).isUnrecoverable).toBe(false);
  });

  it("classifies a transient network error as retryable", () => {
    const err = { message: "Network Error", code: "ECONNABORTED" };
    expect(classifyAgentError(err).isUnrecoverable).toBe(false);
  });

  it("classifies an invalid API key / auth failure as unrecoverable", () => {
    expect(classifyAgentError({ response: { status: 401 } }).isUnrecoverable).toBe(true);
    expect(classifyAgentError({ message: "Invalid API Key provided" }).reason).toBe("auth_failure");
  });

  it("classifies a generic billing-worded message as unrecoverable even without a status field", () => {
    const err = { message: "insufficient_quota: please check your billing details" };
    expect(classifyAgentError(err).isUnrecoverable).toBe(true);
  });

  it("provides distinct, actionable guidance per reason", () => {
    expect(unrecoverableErrorGuidance("quota_exhausted")).toMatch(/credits|quota/i);
    expect(unrecoverableErrorGuidance("auth_failure")).toMatch(/key/i);
  });

  it("classifies the exact Gemini 503 high-demand shape from a real usage log as retryable, tagged transient_overload", () => {
    const err = {
      response: {
        data: {
          error: {
            code: 503,
            message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
            status: "UNAVAILABLE"
          }
        }
      }
    };
    const result = classifyAgentError(err);
    expect(result.isUnrecoverable).toBe(false);
    expect(result.reason).toBe("transient_overload");
  });

  it("classifies a bare 503 with no status field as transient_overload via the HTTP code alone", () => {
    const err = { response: { status: 503 }, message: "Service Unavailable" };
    expect(classifyAgentError(err).reason).toBe("transient_overload");
  });

  it("classifies an 'overloaded'-worded message as transient_overload even without a 503 status", () => {
    const err = { message: "The model is overloaded, please try again later" };
    expect(classifyAgentError(err).reason).toBe("transient_overload");
  });

  it("does not misclassify overload as unrecoverable — it must still go through the retry loop", () => {
    const err = { response: { status: 503 }, message: "high demand" };
    const result = classifyAgentError(err);
    expect(result.isUnrecoverable).toBe(false);
  });

  it("quota/auth signals still take priority over an overload-shaped status, since they're checked first", () => {
    // A defensive check: a 503 that ALSO contains a billing signal should still be treated
    // as unrecoverable, not downgraded to "just wait longer" because of its status code.
    const err = { response: { status: 503 }, message: "quota exceeded — billing required" };
    expect(classifyAgentError(err).isUnrecoverable).toBe(true);
  });
});
