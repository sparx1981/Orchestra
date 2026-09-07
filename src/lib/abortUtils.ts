// Small, dependency-free abort-signal utilities shared by every model-call site (fetch and
// axios alike). Split out from App.tsx so it can be unit tested directly and reused from
// src/lib/gemini.ts, which is a separate module with no access to App.tsx's internals.

/**
 * Combines an optional existing AbortSignal (e.g. the user clicking Stop) with a timeout,
 * so a call is cancelled by whichever happens first. Deliberately NOT implemented via
 * `AbortSignal.any()` — that's a recent addition (Chrome 116+ / Firefox 124+ / Safari
 * 17.4+) and this app has no other hard floor on browser support, so a manual combiner
 * avoids silently no-op'ing the timeout on anything older.
 *
 * Returns the combined signal to pass to fetch/axios, plus a `cleanup` function the caller
 * MUST invoke in a `finally` block once the call settles — otherwise the timeout's
 * `setTimeout` keeps a handle alive for the full duration even after the request already
 * finished successfully.
 */
export function withTimeoutSignal(
  signal: AbortSignal | undefined,
  timeoutMs: number
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason));
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, "TimeoutError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  };
}

/** Default ceiling for a single model call — generous enough for a slow Deep/Extended
 *  synthesis call with a large knowledge base attached, while still eventually giving the
 *  existing retry/backoff logic in callAgent something to react to instead of hanging
 *  forever with only a manual Stop click as recourse. */
export const DEFAULT_MODEL_CALL_TIMEOUT_MS = 120_000;
