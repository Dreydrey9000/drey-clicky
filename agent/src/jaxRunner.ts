import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { taskPrompt, validateImage, spokenSummary } from "./taskContext.js";
import { workflowGuidance } from "./workflowSkills.js";

export interface JaxTask {
  task: string;
  workspace: string;
  imagePath?: string;
  selectedText?: string;
  threadId?: string;
}
export interface JaxResult {
  threadId: string;
  turnId: string;
  finalMessage: string;
  spokenSummary: string;
  artifacts: string[];
  status: "completed";
  engine: "jax";
}

export async function runJaxTask(input: JaxTask, options: { bin?: string; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<JaxResult> {
  const prompt = taskPrompt(input.task, input.selectedText, await workflowGuidance(input.task));
  const image = await validateImage(input.imagePath);
  const workspace = path.resolve(input.workspace);
  if (!(await fs.stat(workspace)).isDirectory()) throw new Error("The working directory does not exist.");
  const threadId = input.threadId ?? `jax:${randomUUID()}`;
  if (!/^jax:[a-zA-Z0-9-]{1,80}$/.test(threadId)) throw new Error("This is not a Jax conversation. Start a new conversation when changing engines.");
  const timeoutMs = options.timeoutMs ?? 180_000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 100 || timeoutMs > 600_000) throw new Error("Jax timeout must be between 100 and 600,000 ms.");
  options.signal?.throwIfAborted();
  const args = ["chat", "--query-file", "-", "--oneshot", "--quiet", "--continue", `drey-clicky-${threadId.slice(4)}`, "--create-if-missing", "--in", workspace, "--no-restore-cwd", "--source", "tool", "--max-turns", "20", "--run-budget", String(Math.max(1, Math.floor(timeoutMs / 1000)))];
  if (image) args.push("--image", image);
  const output = await new Promise<string>((resolve, reject) => {
    const child = spawn(options.bin ?? process.env.DREY_CLICKY_JAX_BIN ?? "jax", args, {
      cwd: workspace, stdio: ["pipe", "pipe", "pipe"], detached: process.platform !== "win32",
      env: { ...process.env, HERMES_QUIET: "1", HERMES_REDACT_SECRETS: "true" },
    });
    let stdout = "";
    let stopped: Error | undefined;
    let killTimer: NodeJS.Timeout | undefined;
    const stop = (error: Error) => {
      if (stopped) return;
      stopped = error;
      const kill = (signal: NodeJS.Signals) => {
        try {
          if (process.platform !== "win32" && child.pid) process.kill(-child.pid, signal);
          else child.kill(signal);
        } catch { /* Already exited. */ }
      };
      kill("SIGTERM");
      killTimer = setTimeout(() => kill("SIGKILL"), 1000);
      killTimer.unref();
    };
    const timer = setTimeout(() => stop(new Error("Jax timed out. Work may have started; check the app before retrying.")), timeoutMs);
    const abort = () => stop(new Error("Jax cancelled. Work already performed may remain; check before retrying."));
    options.signal?.addEventListener("abort", abort, { once: true });
    const cleanup = () => { clearTimeout(timer); if (killTimer) clearTimeout(killTimer); options.signal?.removeEventListener("abort", abort); };
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout) > 2 * 1024 * 1024) stop(new Error("Jax output exceeded 2 MiB. Check the conversation before retrying."));
    });
    // Drain diagnostics so the child cannot deadlock. They can contain private context and are never logged.
    child.stderr.resume();
    child.stdin.on("error", () => { /* The process error/close event reports the failure. */ });
    child.once("error", (error) => { cleanup(); reject(new Error(`Could not start Jax (${(error as NodeJS.ErrnoException).code ?? "process error"}). Install Jax or set DREY_CLICKY_JAX_BIN.`)); });
    child.once("close", (code) => {
      cleanup();
      // The direct child can exit before a descendant that ignored SIGTERM. Do not let clearing
      // the grace timer strand that descendant after the CLI itself exits.
      if (stopped && process.platform !== "win32" && child.pid) {
        try { process.kill(-child.pid, "SIGKILL"); } catch { /* The process group is already gone. */ }
      }
      if (stopped) reject(stopped);
      else if (code !== 0) reject(new Error(`Jax exited with status ${code}. Check Jax's configured provider and permissions. No automatic retry was made.`));
      else if (!stdout.trim()) reject(new Error("Jax returned no answer. Check the conversation before retrying."));
      else resolve(stdout.trim());
    });
    child.stdin.end(prompt);
  });
  // Quiet mode can include the CLI's session footer; it does not belong in spoken answers.
  const setupWarnings = output.match(/^Warning: Unknown toolsets: [^\n]+/gm) ?? [];
  const answer = output.replace(/^Warning: Unknown toolsets: [^\n]+\n?/gm, "").replace(/\n(?:Session(?: ID)?|Resume(?: with)?):[^\n]*$/gi, "").trim();
  if (!answer) throw new Error("Jax returned only session metadata or setup warnings, with no answer.");
  const finalMessage = answer + (setupWarnings.length ? `\n\nJax setup note: ${setupWarnings.join("; ")}` : "");
  return { threadId, turnId: randomUUID(), finalMessage, spokenSummary: spokenSummary(answer), artifacts: [], status: "completed", engine: "jax" };
}
