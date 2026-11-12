#!/usr/bin/env node
// Measures only a new synthetic scratch workspace; never scans the user's files.
// Run: node --import tsx agent/bench/artifacts-limit.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { snapshotWorkspace } from "../src/artifacts.ts";

const files = Number(process.env.BENCH_FILES ?? 25_000);
const runs = Number(process.env.BENCH_RUNS ?? 5);
if (!Number.isInteger(files) || files <= 20_000 || files > 100_000 || !Number.isInteger(runs) || runs < 1 || runs > 20) {
  throw new Error("BENCH_FILES must be an integer from 20001 to 100000; BENCH_RUNS must be from 1 to 20");
}
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "drey-clicky-artifacts-benchmark-"));
const realStat = fs.statSync;
try {
  const setupStart = performance.now();
  for (let index = 0; index < files; index += 1) {
    fs.writeFileSync(path.join(scratch, `synthetic-${String(index).padStart(6, "0")}.txt`), "synthetic\n");
  }
  const setupMs = performance.now() - setupStart;
  const samples = [];
  for (let index = 0; index < runs; index += 1) {
    let statCalls = 0;
    fs.statSync = (...args) => {
      statCalls += 1;
      return realStat(...args);
    };
    const startedAt = performance.now();
    const snapshot = snapshotWorkspace(scratch);
    const milliseconds = performance.now() - startedAt;
    fs.statSync = realStat;
    samples.push({ milliseconds: Number(milliseconds.toFixed(2)), returnedFiles: snapshot.size, statCalls, truncated: snapshot.truncated ?? null });
  }
  const sorted = samples.map((sample) => sample.milliseconds).sort((left, right) => left - right);
  console.log(JSON.stringify({
    label: process.env.BENCH_LABEL ?? "current",
    node: process.version,
    scenario: `${files} regular synthetic files in one flat directory`,
    setupMs: Number(setupMs.toFixed(2)),
    samples,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    fixtureRemovedOnExit: true,
  }, null, 2));
} finally {
  fs.statSync = realStat;
  fs.rmSync(scratch, { recursive: true, force: true });
}
