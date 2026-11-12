import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { snapshotWorkspace, diffSnapshots } from "../src/artifacts.js";

const root = path.resolve("synthetic-artifact-fixture");
const file = (name: string) => ({ name, isFile: () => true, isDirectory: () => false }) as fs.Dirent;
const directory = (name: string) => ({ name, isFile: () => false, isDirectory: () => true }) as fs.Dirent;
const files = (count: number, prefix = "file") => Array.from({ length: count }, (_, index) => file(`${prefix}-${index}.txt`));
const readableStat = () => vi.spyOn(fs, "statSync").mockReturnValue({ mtimeMs: 1, size: 1 } as fs.Stats);
const listing = (read: (directoryPath: fs.PathLike) => fs.Dirent[]) => vi.spyOn(fs, "readdirSync").mockImplementation(read as unknown as typeof fs.readdirSync);

afterEach(() => vi.restoreAllMocks());

describe("artifact snapshot limits", () => {
  it("stops a flat workspace at 20000 files and reports an incomplete snapshot", () => {
    listing(() => files(20_003));
    const stat = readableStat();
    const snapshot = snapshotWorkspace(root);
    expect(snapshot.size).toBe(20_000);
    expect(stat).toHaveBeenCalledTimes(20_000);
    expect(snapshot.truncated).toBe(true);
  });

  it("does not mark a completely scanned exact-cap workspace as truncated", () => {
    listing(() => [...files(20_000), directory("node_modules")]);
    readableStat();
    const snapshot = snapshotWorkspace(root);
    expect(snapshot.size).toBe(20_000);
    expect(snapshot.truncated).toBe(false);
  });

  it("caps file-stat work even when every attempted file is unreadable", () => {
    listing(() => files(20_003));
    const stat = readableStat().mockImplementation(() => { throw new Error("synthetic EACCES"); });
    const snapshot = snapshotWorkspace(root);
    expect(snapshot.size).toBe(0);
    expect(stat).toHaveBeenCalledTimes(20_000);
    expect(snapshot.truncated).toBe(true);
  });

  it("enforces the same total across sibling directories", () => {
    listing((directoryPath) => directoryPath === root ? [directory("a"), directory("b")] : files(15_000));
    const stat = readableStat();
    const snapshot = snapshotWorkspace(root);
    expect(snapshot.size).toBe(20_000);
    expect(stat).toHaveBeenCalledTimes(20_000);
    expect(snapshot.truncated).toBe(true);
  });

  it("reports depth truncation without scanning past the sixth child level", () => {
    const read = listing(() => [directory("next")]);
    readableStat();
    const snapshot = snapshotWorkspace(root);
    expect(snapshot.size).toBe(0);
    expect(snapshot.truncated).toBe(true);
    expect(read).toHaveBeenCalledTimes(7); // root (0) through child level 6
  });

  it("marks unreadable directories as incomplete", () => {
    listing(() => { throw new Error("synthetic EACCES"); });
    const snapshot = snapshotWorkspace(root);
    expect(snapshot.size).toBe(0);
    expect(snapshot.truncated).toBe(true);
  });

  it("marks an unreadable or vanished file as incomplete and continues other files", () => {
    listing(() => [file("unreadable.txt"), file("readable.txt")]);
    readableStat().mockImplementationOnce(() => { throw new Error("synthetic ENOENT"); });
    const snapshot = snapshotWorkspace(root);
    expect([...snapshot.keys()]).toEqual([path.join(root, "readable.txt")]);
    expect(snapshot.truncated).toBe(true);
  });

  it("keeps the sorted diff interface compatible with plain Maps", () => {
    expect(diffSnapshots(new Map([["/b", "old"]]), new Map([["/b", "new"], ["/a", "new"]])))
      .toEqual(["/a", "/b"]);
  });
});
