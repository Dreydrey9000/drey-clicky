#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { runJaxTask, type JaxTask, type JaxResult } from "./jaxRunner.js";

const server = new Server({ name: "drey-clicky-jax", version: "0.1.0" }, { capabilities: { tools: {} } });
const activeRuns = new Map<AbortController, Promise<JaxResult>>();
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{
  name: "jax_run", description: "Ask the user's existing Jax assistant to perform one task, with optional screenshot and selected text. Actions may modify the user's computer. No retry after an uncertain result.",
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  inputSchema: { type: "object", properties: {
    task: { type: "string", minLength: 1, maxLength: 50_000 }, workspace: { type: "string" },
    imagePath: { type: "string" }, selectedText: { type: "string", maxLength: 20_000 }, threadId: { type: "string" },
  }, required: ["task", "workspace"], additionalProperties: false },
}] }));
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  if (request.params.name !== "jax_run") throw new Error("Unknown tool.");
  if (activeRuns.size) throw new Error("Jax is already working. Wait for that request to finish.");
  const args = request.params.arguments ?? {};
  const allowed = ["task", "workspace", "imagePath", "selectedText", "threadId"];
  if (Object.keys(args).some(key => !allowed.includes(key)) || typeof args.task !== "string" || typeof args.workspace !== "string" || allowed.slice(2).some(key => args[key] !== undefined && typeof args[key] !== "string")) throw new Error("Invalid Jax task arguments.");
  const controller = new AbortController();
  const cancel = () => controller.abort();
  extra.signal.addEventListener("abort", cancel, { once: true });
  if (extra.signal.aborted) controller.abort();
  try {
    const run = runJaxTask(args as unknown as JaxTask, { signal: controller.signal });
    activeRuns.set(controller, run);
    const result = await run;
    return { content: [{ type: "text", text: result.finalMessage }], structuredContent: { ...result } };
  } catch (error) {
    return { isError: true, content: [{ type: "text", text: error instanceof Error ? error.message : "Jax failed. Check before retrying." }] };
  } finally {
    extra.signal.removeEventListener("abort", cancel);
    activeRuns.delete(controller);
  }
});

let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  for (const controller of activeRuns.keys()) controller.abort();
  await Promise.allSettled([...activeRuns.values()]);
  await server.close();
  process.exit(0);
};
server.onclose = () => { void shutdown(); };
process.once("SIGINT", () => { void shutdown(); });
process.once("SIGTERM", () => { void shutdown(); });
await server.connect(new StdioServerTransport());
