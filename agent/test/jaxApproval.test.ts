import { describe, it, expect, vi } from "vitest";
import { Duplex, PassThrough, Writable } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { approvalCommand, attachApprovalChannel, parseApproval } from "../src/jaxApproval.js";

const request = { id: "46c06450-6f98-47bc-bb0a-e75e30386488", kind: "computer_use" as const, action: "focus_app", summary: "Open Calculator", details: '{"app":"Calculator","raise_window":true}' };
function channelPair() {
  const input = new PassThrough();
  const responses: string[] = [];
  const output = new Writable({ write(chunk: Buffer, _encoding, done) { responses.push(chunk.toString()); done(); } });
  const channel = Duplex.from({ readable: input, writable: output });
  return { input, responses, channel };
}

describe("local Jax action approvals", () => {
  it("preserves custom launchers and non-Mac behavior", () => {
    expect(approvalCommand("/custom/jax", {}, "darwin")).toBeUndefined();
    expect(approvalCommand("jax", {}, "linux")).toBeUndefined();
    expect(approvalCommand("jax", { DREY_CLICKY_APPROVAL_UI: "off" }, "darwin")).toBeUndefined();
  });
  it("selects a child-only adapter without any bypass flag", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "dc-approval-install-"));
    try {
      fs.mkdirSync(path.join(root, "venv/bin"), { recursive: true });
      fs.mkdirSync(path.join(root, "hermes_cli"));
      fs.writeFileSync(path.join(root, "venv/bin/python"), "fixture");
      fs.writeFileSync(path.join(root, "hermes_cli/main.py"), "# fixture");
      const result = approvalCommand("jax", { DREY_CLICKY_HERMES_ROOT: root }, "darwin");
      expect(result?.prefix).toContain("--profile");
      expect(result?.prefix).toContain("jax");
      expect(result?.prefix).not.toContain("--yolo");
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
  });
  it("rejects malformed and oversized permission payloads before showing a dialog", () => {
    expect(parseApproval({ ...request, id: "forged" })).toBeUndefined();
    expect(parseApproval({ ...request, kind: "always_allow" })).toBeUndefined();
    expect(parseApproval({ ...request, details: "x".repeat(2001) })).toBeUndefined();
    expect(parseApproval(request)).toEqual(request);
  });
  it("returns only an explicit once decision, bound to the request id", async () => {
    const pair = channelPair();
    const close = attachApprovalChannel(pair.channel, new AbortController().signal, { handler: () => Promise.resolve("allow_once") });
    const line = JSON.stringify(request) + "\n";
    pair.input.write(line.slice(0, 20)); pair.input.write(line.slice(20));
    await vi.waitFor(() => expect(pair.responses).toHaveLength(1));
    expect(JSON.parse(pair.responses[0])).toEqual({ id: request.id, decision: "allow_once" });
    close();
  });
  it("denies a failed frontend instead of permitting the action", async () => {
    const pair = channelPair();
    const close = attachApprovalChannel(pair.channel, new AbortController().signal, { handler: () => Promise.reject(new Error("frontend missing")) });
    pair.input.write(JSON.stringify(request) + "\n");
    await vi.waitFor(() => expect(pair.responses).toHaveLength(1));
    expect(JSON.parse(pair.responses[0])).toEqual({ id: request.id, decision: "deny" });
    close();
  });
  it("cancels an outstanding prompt and refuses a late allow after task cancellation", async () => {
    const pair = channelPair(); const task = new AbortController();
    let answer: (value: "allow_once") => void = () => {};
    const handler = vi.fn((_request, signal: AbortSignal) => new Promise<"allow_once">(resolve => { answer = resolve; signal.addEventListener("abort", () => resolve("allow_once"), { once: true }); }));
    attachApprovalChannel(pair.channel, task.signal, { handler });
    pair.input.write(JSON.stringify(request) + "\n");
    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
    task.abort(); answer("allow_once");
    await new Promise(resolve => setImmediate(resolve));
    expect(pair.channel.destroyed).toBe(true); expect(pair.responses).toEqual([]);
  });
  it("closes malformed or overlapping frames without approving either action", async () => {
    for (const data of ["not JSON\n", "x".repeat(32769), JSON.stringify(request) + "\n" + JSON.stringify(request) + "\n"]) {
      const pair = channelPair(); const handler = vi.fn(() => Promise.resolve("deny" as const));
      attachApprovalChannel(pair.channel, new AbortController().signal, { handler });
      pair.input.write(data);
      await vi.waitFor(() => expect(pair.channel.destroyed).toBe(true));
      expect(pair.responses).toEqual([]);
    }
  });
});
