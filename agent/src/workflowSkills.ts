import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Only the real user request selects trusted bundled guidance; screenshot/selection text cannot. */
export async function workflowGuidance(task: string): Promise<string> {
  const ids: string[] = [];
  if (/\b(calendar|schedule|meeting|availability|event)\b/i.test(task)) ids.push("drey-calendar");
  if (/\b(content|draft|post|reel|caption|script)\b/i.test(task)) ids.push("drey-content");
  if (/\b(1bb|1buttonbusiness|1 button business)\b/i.test(task)) ids.push("drey-1bb");
  const pieces = await Promise.all(ids.map(async id => {
    const text = await fs.readFile(fileURLToPath(new URL(`../../skills/${id}/SKILL.md`, import.meta.url)), "utf8");
    if (text.length > 4000) throw new Error(`Bundled workflow ${id} exceeds its context budget.`);
    return text;
  }));
  return pieces.join("\n\n");
}
