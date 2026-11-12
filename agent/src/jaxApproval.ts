import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Duplex } from "node:stream";

export interface JaxApproval { id: string; kind: "command" | "computer_use"; summary: string; details: string; action?: string }
export type ApprovalDecision = "allow_once" | "deny";

/** Custom launchers remain authoritative; only the known local Jax launcher is adapted. */
export function approvalCommand(bin: string, env: NodeJS.ProcessEnv = process.env, platform = process.platform): { command: string; prefix: string[] } | undefined {
  if (platform !== "darwin" || env.DREY_CLICKY_APPROVAL_UI === "off") return undefined;
  if (bin !== "jax" && path.resolve(bin) !== path.join(os.homedir(), ".local/bin/jax")) return undefined;
  const root = env.DREY_CLICKY_HERMES_ROOT ?? path.join(os.homedir(), ".hermes/hermes-agent");
  const command = path.join(root, "venv/bin/python");
  if (!fs.existsSync(command) || !fs.existsSync(path.join(root, "hermes_cli/main.py"))) return undefined;
  return { command, prefix: ["-I", "-B", fileURLToPath(new URL("../runtime/jax_approval.py", import.meta.url)), "--hermes-root", root, "--profile", env.DREY_CLICKY_JAX_PROFILE ?? "jax", "--"] };
}

export function parseApproval(value: unknown): JaxApproval | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || !/^[a-f0-9-]{36}$/.test(v.id) || !["command", "computer_use"].includes(String(v.kind))) return undefined;
  if (typeof v.summary !== "string" || typeof v.details !== "string" || v.summary.length > 400 || v.details.length > 2000) return undefined;
  if (v.action !== undefined && (typeof v.action !== "string" || v.action.length > 80)) return undefined;
  return v as unknown as JaxApproval;
}

/** Missing, cancelled, malformed or expired answers deny. No persistent approval mode. */
export async function askMacApproval(request: JaxApproval, signal: AbortSignal): Promise<ApprovalDecision> {
  if (signal.aborted || process.platform !== "darwin") return "deny";
  return new Promise(resolve => {
    const child = spawn("/usr/bin/osascript", ["-l", "JavaScript", fileURLToPath(new URL("../runtime/mac_approval.jxa", import.meta.url))], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let ended = false;
    const finish = (answer: ApprovalDecision) => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      resolve(answer);
    };
    const cancel = () => { child.kill("SIGKILL"); finish("deny"); };
    const timer = setTimeout(cancel, 65_000);
    signal.addEventListener("abort", cancel, { once: true });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (text: string) => { output += text; if (output.length > 100) cancel(); });
    child.stderr.resume();
    child.stdin.on("error", () => cancel());
    child.once("error", () => finish("deny"));
    child.once("close", code => finish(code === 0 && !signal.aborted && output.trim() === "allow_once" ? "allow_once" : "deny"));
    child.stdin.end(JSON.stringify({ message: `${request.kind === "computer_use" ? "Computer action" : "Command"}: ${request.summary}\n\n${request.details}\n\nAllow this action once? Denying, closing, or waiting does not authorize it.` }));
    if (signal.aborted) cancel();
  });
}

export function attachApprovalChannel(channel: Duplex, signal: AbortSignal, options: { handler?: typeof askMacApproval; onDenied?: () => void } = {}): () => void {
  const handler = options.handler ?? askMacApproval;
  const onDenied = options.onDenied ?? (() => {});
  let buffered = "";
  let pending = false;
  let closed = false;
  const controller = new AbortController();
  const close = () => { if (closed) return; closed = true; if (pending) onDenied(); controller.abort(); channel.destroy(); signal.removeEventListener("abort", close); };
  signal.addEventListener("abort", close, { once: true });
  channel.setEncoding("utf8");
  channel.on("error", close);
  channel.on("close", close);
  channel.on("data", (chunk: string) => {
    buffered += chunk;
    if (Buffer.byteLength(buffered) > 32768) { onDenied(); return close(); }
    let newline: number;
    while ((newline = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, newline); buffered = buffered.slice(newline + 1);
      let request: JaxApproval | undefined;
      try { request = parseApproval(JSON.parse(line)); } catch { /* Close on malformed frames. */ }
      if (!request || pending) { onDenied(); return close(); }
      pending = true;
      const current = request;
      void Promise.resolve().then(() => handler(current, controller.signal)).catch(() => "deny" as const).then(answer => {
        pending = false;
        if (answer !== "allow_once") onDenied();
        if (!closed && !signal.aborted && channel.writable) channel.write(JSON.stringify({ id: current.id, decision: answer === "allow_once" ? "allow_once" : "deny" }) + "\n");
      });
    }
  });
  if (signal.aborted) close();
  return close;
}
