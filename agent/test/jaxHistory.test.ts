import { it, expect, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { saveJaxHistory, readJaxHistory, listJaxHistory, archiveJaxHistory } from "../src/jaxHistory.js";
const original = process.env.DREY_CLICKY_HISTORY_DIR;
afterEach(() => { if (original === undefined) delete process.env.DREY_CLICKY_HISTORY_DIR; else process.env.DREY_CLICKY_HISTORY_DIR = original; });
it("stores real results privately, resumes history and archives without losing it", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "dc-history-"));
  process.env.DREY_CLICKY_HISTORY_DIR = dir;
  const result = { threadId: "jax:test-id", turnId: "turn-1", finalMessage: "Draft prepared.", spokenSummary: "Draft prepared.", status: "completed" as const, engine: "jax" as const, artifacts: [] };
  await saveJaxHistory("Prepare a draft", dir, result);
  await saveJaxHistory("Make it shorter", dir, { ...result, turnId: "turn-2" });
  expect((await readJaxHistory(result.threadId)).turns).toHaveLength(2);
  expect((await listJaxHistory())[0]?.modelProvider).toBe("jax");
  expect((await fs.stat(path.join(dir, "test-id.json"))).mode & 0o777).toBe(0o600);
  await archiveJaxHistory(result.threadId);
  expect(await listJaxHistory()).toEqual([]);
  expect(await fs.readdir(path.join(dir, "archived"))).toHaveLength(1);
});
it("rejects traversal and invalid history limits", async () => {
  await expect(readJaxHistory("jax:../../outside")).rejects.toThrow("Invalid Jax");
  await expect(listJaxHistory(500)).rejects.toThrow("between 1 and 200");
});
