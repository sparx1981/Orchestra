import { describe, it, expect } from "vitest";
import { runCalculation } from "../calculations";

describe("runCalculation", () => {
  it("evaluates plain arithmetic", () => {
    const r = runCalculation("(1250 - 900) / 900 * 100");
    expect(r.ok).toBe(true);
    expect(r.raw).toBeCloseTo(38.8889, 3);
  });

  it("formats integers without decimal noise", () => {
    const r = runCalculation("50 * 2");
    expect(r.ok).toBe(true);
    expect(r.formatted).toBe("100");
  });

  it("rounds decimals to a clean, readable precision", () => {
    const r = runCalculation("10 / 3");
    expect(r.ok).toBe(true);
    expect(r.formatted).toBe("3.3333");
  });

  it("rejects an empty expression", () => {
    expect(runCalculation("").ok).toBe(false);
  });

  it("rejects expressions that don't resolve to a single number", () => {
    const r = runCalculation("[1, 2, 3]");
    expect(r.ok).toBe(false);
  });

  it("rejects keyword-based escape attempts", () => {
    expect(runCalculation("import('fs')").ok).toBe(false);
    expect(runCalculation("function(){}").ok).toBe(false);
  });

  it("returns a clear error for malformed expressions", () => {
    const r = runCalculation("2 + * 3");
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });
});
