import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import type { JaxTask, JaxResult } from "./jaxRunner.js";

export function jaxMcpCommand(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.DREY_CLICKY_MCP_COMMAND) {
    const parsed: unknown = JSON.parse(env.DREY_CLICKY_MCP_COMMAND);
    if (!Array.isArray(parsed) || !parsed.length || !parsed.every(item => typeof item === "string" && item.length > 0)) throw new Error("DREY_CLICKY_MCP_COMMAND must be a JSON array of executable and arguments.");
    return parsed as string[];
  }
  return [process.execPath, fileURLToPath(new URL("./jaxServer.js", import.meta.url))];
}

export async function withJaxClient<T>(operation: (client: Client) => Promise<T>, signal?: AbortSignal): Promise<T> {
  const [command, ...args] = jaxMcpCommand();
  const env: Record<string, string> = {};
  for (const key of ["DREY_CLICKY_JAX_BIN", "DREY_CLICKY_HERMES_ROOT", "DREY_CLICKY_JAX_PROFILE", "DREY_CLICKY_APPROVAL_UI"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  const transport = new StdioClientTransport({ command, args, env, stderr: "pipe" });
  // stderr is drained without echoing private diagnostics into UI event streams.
  transport.stderr?.on("data", () => undefined);
  const client = new Client({ name: "drey-clicky", version: "0.1.0" });
  const abort = () => { void client.close(); };
  signal?.throwIfAborted();
  signal?.addEventListener("abort", abort, { once: true });
  try {
    await client.connect(transport, { timeout: 15_000, signal });
    return await operation(client);
  } finally {
    signal?.removeEventListener("abort", abort);
    await client.close().catch(() => undefined);
    await transport.close().catch(() => undefined);
  }
}

export async function runJaxMcp(input: JaxTask, options: { signal?: AbortSignal; timeoutMs?: number; onEvent?: (text: string) => void } = {}): Promise<JaxResult> {
  options.onEvent?.("connecting to Jax…");
  return withJaxClient(async client => {
    const { tools } = await client.listTools({}, { timeout: 10_000, signal: options.signal });
    if (!tools.some(tool => tool.name === "jax_run")) throw new Error("This MCP server has no jax_run task tool. The Hermes messaging bridge cannot execute tasks; use Drey Clicky's task bridge.");
    options.onEvent?.("Jax is working…");
    const reply = await client.callTool({ name: "jax_run", arguments: { ...input } }, undefined, { timeout: options.timeoutMs ?? 190_000, signal: options.signal });
    const text = Array.isArray(reply.content) ? reply.content.filter(item => item.type === "text").map(item => item.text).join("\n") : "";
    if (reply.isError) throw new Error(text || "Jax failed. Check the conversation before retrying.");
    const result = reply.structuredContent as Record<string, unknown> | undefined;
    if (!result || result.engine !== "jax" || !["completed", "blocked"].includes(String(result.status)) || typeof result.turnId !== "string" || typeof result.finalMessage !== "string" || !result.finalMessage.trim() || typeof result.spokenSummary !== "string" || typeof result.threadId !== "string" || !/^jax:[a-zA-Z0-9-]{1,80}$/.test(result.threadId) || !Array.isArray(result.artifacts) || !result.artifacts.every(item => typeof item === "string")) throw new Error("Jax returned an invalid completion receipt. No automatic retry was made.");
    return result as unknown as JaxResult;
  }, options.signal);
}

// Keep the public task interface visible to consumers without exposing process plumbing.
export type { JaxTask, JaxResult };
