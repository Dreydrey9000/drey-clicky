import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { JaxResult } from "./jaxRunner.js";

interface ThreadSummary {
  id: string; preview: string; cwd: string; createdAt: number; updatedAt: number; status: string; modelProvider: string;
}
interface Turn { id: string; status: string; startedAt: number; completedAt: number; user: string[]; agent: string[]; commands: string[] }
interface History { thread: ThreadSummary; turns: Turn[] }
const root = () => process.env.DREY_CLICKY_HISTORY_DIR ?? path.join(os.homedir(), ".drey-clicky", "history");
function location(id: string): string {
  if (!/^jax:[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error("Invalid Jax conversation ID.");
  return path.join(root(), `${id.slice(4)}.json`);
}

export async function readJaxHistory(id: string): Promise<History> {
  const file = location(id);
  const stat = await fs.stat(file);
  if (stat.size > 10 * 1024 * 1024) throw new Error("Conversation history is too large to read safely.");
  const data = JSON.parse(await fs.readFile(file, "utf8")) as History;
  if (data?.thread?.id !== id || !Array.isArray(data.turns)) throw new Error("Conversation history is invalid.");
  return data;
}

export async function saveJaxHistory(task: string, workspace: string, result: JaxResult): Promise<void> {
  const file = location(result.threadId);
  await fs.mkdir(root(), { recursive: true, mode: 0o700 });
  const now = Date.now() / 1000;
  let history: History;
  try { history = await readJaxHistory(result.threadId); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    history = { thread: { id: result.threadId, preview: task.slice(0, 200), cwd: workspace, createdAt: now, updatedAt: now, status: result.status, modelProvider: "jax" }, turns: [] };
  }
  history.thread.updatedAt = now;
  history.thread.status = result.status;
  history.turns.push({ id: result.turnId, status: result.status, startedAt: now, completedAt: now, user: [task], agent: [result.finalMessage], commands: [] });
  history.turns = history.turns.slice(-50);
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temp, JSON.stringify(history), { mode: 0o600, flag: "wx" });
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}

export async function listJaxHistory(limit = 20): Promise<ThreadSummary[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw new Error("History limit must be between 1 and 200.");
  const files = await fs.readdir(root()).catch((error: NodeJS.ErrnoException) => { if (error.code === "ENOENT") return []; throw error; });
  const summaries: ThreadSummary[] = [];
  for (const name of files.filter(name => /^[a-zA-Z0-9-]{1,80}\.json$/.test(name))) {
    try { summaries.push((await readJaxHistory(`jax:${name.slice(0, -5)}`)).thread); }
    catch { /* One damaged local record must not hide every conversation. */ }
  }
  return summaries.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

export async function archiveJaxHistory(id: string): Promise<void> {
  const source = location(id);
  const archived = path.join(root(), "archived");
  await fs.mkdir(archived, { recursive: true, mode: 0o700 });
  await fs.rename(source, path.join(archived, `${id.slice(4)}-${randomUUID()}.json`));
}
