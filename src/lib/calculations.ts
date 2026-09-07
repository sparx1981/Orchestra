// Deterministic calculation (Phase 3 roadmap item #3, calculation-tool fork). The
// quantitative-finance QA persona's complaint was structural: agents can reason fluently
// about a Sharpe ratio in prose but can't actually compute one — pure-LLM arithmetic on
// anything beyond trivial numbers is a real, hard ceiling for finance/quant/manufacturing
// use cases. This doesn't attempt to make agents autonomously reliable calculators (that
// would just move the trust problem, not solve it); it gives the MANAGER a way to compute
// an exact figure with a real math engine and inject it into the discussion as a distinctly
// marked "verified calculation" — a fact the panel can then reason from, rather than another
// unverifiable claim in the transcript.

import { evaluate } from "mathjs";

export interface CalculationResult {
  ok: boolean;
  formatted?: string;
  raw?: number;
  error?: string;
}

/** Evaluates a user-supplied arithmetic expression with mathjs's default (non-import,
 *  non-function-definition) evaluator — safe for a sandboxed manager-facing calculator
 *  since mathjs's `evaluate` does not expose filesystem/network/import capabilities. */
export function runCalculation(expression: string): CalculationResult {
  const trimmed = expression.trim();
  if (!trimmed) return { ok: false, error: "Enter an expression to calculate." };
  // Reject anything that looks like it's trying to reach outside plain arithmetic
  // (mathjs has no import()/require() itself, but keyword-level rejection is a free,
  // zero-cost extra guard against a confused or adversarial input).
  if (/\b(import|require|function|eval)\b/i.test(trimmed)) {
    return { ok: false, error: "Only arithmetic expressions are supported." };
  }
  try {
    const result = evaluate(trimmed);
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return { ok: false, error: "That expression didn't produce a single number." };
    }
    // Format: integers stay bare, decimals round to 4 significant places without
    // trailing zeros, so $1,250.5 doesn't render as 1250.500000000001.
    const rounded = Math.round(result * 10000) / 10000;
    const formatted = Number.isInteger(rounded) ? rounded.toLocaleString() : rounded.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return { ok: true, raw: rounded, formatted };
  } catch (err: any) {
    return { ok: false, error: err?.message ? `Couldn't evaluate that: ${err.message}` : "Couldn't evaluate that expression." };
  }
}
