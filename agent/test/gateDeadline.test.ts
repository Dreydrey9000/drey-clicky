import { describe, it, expect, vi } from "vitest";
import { gate, DEFAULT_GATE_TIMEOUT_MS } from "../src/gate.js";
import { resolveConfig } from "../src/config.js";

const config = () => resolveConfig({ backendUrl: "http://127.0.0.1:1", token: "synthetic-test-token" }, {});

describe("gate deadline", () => {
  it("aborts a stalled fetch and returns the existing heuristic lane", async () => {
    let observedSignal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      observedSignal = init?.signal as AbortSignal;
      observedSignal.addEventListener("abort", () => reject(observedSignal?.reason as Error), { once: true });
    })) as unknown as typeof fetch;
    const result = await gate(config(), "create a file", { fetchImpl, timeoutMs: 20 });
    expect(observedSignal?.aborted).toBe(true);
    expect(result).toMatchObject({ lane: "agent", gated: false });
    expect(result.reason).toContain("20 ms");
  });

  it("keeps the deadline active while reading the reply body", async () => {
    const fetchImpl = vi.fn((_input, init) => Promise.resolve({
      ok: true,
      json: () => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal?.reason as Error), { once: true });
      }),
    } as Response)) as unknown as typeof fetch;
    expect(await gate(config(), "what is a monad", { fetchImpl, timeoutMs: 20 }))
      .toMatchObject({ lane: "ask", gated: false });
  });

  it("preserves a fast valid model response and clears its deadline", async () => {
    let observedSignal: AbortSignal | undefined;
    const fetchImpl = vi.fn((_input, init) => {
      observedSignal = init?.signal as AbortSignal;
      return Promise.resolve(Response.json({ content: [{ type: "text", text: '{"lane":"ask","reason":"question"}' }] }));
    }) as unknown as typeof fetch;
    expect(await gate(config(), "what is a monad", { fetchImpl, timeoutMs: 20 }))
      .toEqual({ lane: "ask", reason: "question", gated: true });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(observedSignal?.aborted).toBe(false);
  });

  it("propagates caller cancellation instead of starting downstream work", async () => {
    const controller = new AbortController();
    const cancelled = new Error("user cancelled");
    const fetchImpl = vi.fn((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason as Error), { once: true });
    })) as unknown as typeof fetch;
    const pending = gate(config(), "create a file", { fetchImpl, timeoutMs: 1000, signal: controller.signal });
    controller.abort(cancelled);
    await expect(pending).rejects.toBe(cancelled);
  });

  it("does not send an already cancelled request", async () => {
    const controller = new AbortController();
    controller.abort(new Error("already cancelled"));
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    await expect(gate(config(), "create a file", { fetchImpl, signal: controller.signal })).rejects.toThrow("already cancelled");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects invalid timeout values instead of silently disabling the deadline", async () => {
    expect(DEFAULT_GATE_TIMEOUT_MS).toBe(2500);
    for (const timeoutMs of [0, -1, NaN, Infinity, 1.5, 60001]) {
      await expect(gate(config(), "what is a monad", { timeoutMs })).rejects.toThrow("timeoutMs");
    }
  });
});
