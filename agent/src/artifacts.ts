import fs from "node:fs";
import path from "node:path";

const SKIP = new Set(["node_modules", ".git", "dist", ".venv", "__pycache__"]);
const MAX_DEPTH = 6;
const MAX_FILES = 20_000;

type Snapshot = Map<string, string>; // abs path → `${mtimeMs}:${size}`
type WorkspaceSnapshot = Snapshot & { truncated: boolean };

/** Record regular files with bounded depth/count. `truncated` also flags unreadable entries. */
export function snapshotWorkspace(dir: string): WorkspaceSnapshot {
  const snap: WorkspaceSnapshot = Object.assign(new Map<string, string>(), { truncated: false });
  let inspectedFiles = 0;
  const walk = (d: string, depth: number) => {
    if (depth > MAX_DEPTH || inspectedFiles >= MAX_FILES) {
      snap.truncated = true;
      return;
    }
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      snap.truncated = true;
      return;
    }
    for (const e of entries) {
      if (SKIP.has(e.name) || (e.name.startsWith(".") && e.isDirectory())) continue;
      if (!e.isFile() && !e.isDirectory()) continue;
      // A flat directory never re-enters walk(), so checking only on entry misses the cap.
      if (inspectedFiles >= MAX_FILES) {
        snap.truncated = true;
        return;
      }
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.isFile()) {
        inspectedFiles += 1;
        try {
          const st = fs.statSync(p);
          snap.set(p, `${st.mtimeMs}:${st.size}`);
        } catch {
          // Do not present an incomplete before/after pair as evidence that a file is new.
          snap.truncated = true;
        }
      }
    }
  };
  walk(dir, 0);
  return snap;
}

/** Files that are new or changed between two snapshots (sorted absolute paths). */
export function diffSnapshots(before: Snapshot, after: Snapshot): string[] {
  const out: string[] = [];
  for (const [p, sig] of after) if (before.get(p) !== sig) out.push(p);
  return out.sort();
}

/** Paths reported by Codex `fileChange` items. */
export function artifactsFromItems(items: unknown[]): string[] {
  const out: string[] = [];
  for (const it of items as any[]) {
    if (it?.type !== "fileChange" || !Array.isArray(it.changes)) continue;
    for (const ch of it.changes) if (typeof ch?.path === "string") out.push(ch.path);
  }
  return out;
}
