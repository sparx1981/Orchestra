import { describe, it, expect, vi } from "vitest";
import { withTimeoutSignal } from "../abortUtils";

describe("withTimeoutSignal", () => {
  it("does not abort before the timeout elapses", () => {
    const { signal, cleanup } = withTimeoutSignal(undefined, 10_000);
    expect(signal.aborted).toBe(false);
    cleanup();
  });

  it("aborts once the timeout elapses", () => {
    vi.useFakeTimers();
    const { signal, cleanup } = withTimeoutSignal(undefined, 5000);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(signal.aborted).toBe(true);
    cleanup();
    vi.useRealTimers();
  });

  it("aborts immediately if the passed-in signal is already aborted", () => {
    const controller = new AbortController();
    controller.abort(new DOMException("Stopped by user", "AbortError"));
    const { signal, cleanup } = withTimeoutSignal(controller.signal, 10_000);
    expect(signal.aborted).toBe(true);
    cleanup();
  });

  it("aborts when the passed-in signal fires, even before the timeout", () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const { signal, cleanup } = withTimeoutSignal(controller.signal, 10_000);
    expect(signal.aborted).toBe(false);
    controller.abort(new DOMException("Stopped by user", "AbortError"));
    expect(signal.aborted).toBe(true);
    cleanup();
    vi.useRealTimers();
  });

  it("cleanup prevents the timeout from firing afterward", () => {
    vi.useFakeTimers();
    const { signal, cleanup } = withTimeoutSignal(undefined, 5000);
    cleanup();
    vi.advanceTimersByTime(10_000);
    expect(signal.aborted).toBe(false);
    vi.useRealTimers();
  });
});
