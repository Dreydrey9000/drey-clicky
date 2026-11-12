#!/usr/bin/env node
// Synthetic loopback benchmark: no model calls, credentials, or screen content.
// Run with: node --import tsx agent/bench/gate-latency.mjs
import http from "node:http";
import { performance } from "node:perf_hooks";
import { gate } from "../src/gate.ts";
import { resolveConfig } from "../src/config.ts";

const delayMs = Number(process.env.BENCH_GATE_DELAY_MS ?? 4000);
const runs = Number(process.env.BENCH_RUNS ?? 5);
if (!Number.isInteger(delayMs) || delayMs < 0 || !Number.isInteger(runs) || runs < 1 || runs > 20) {
  throw new Error("Use a non-negative integer BENCH_GATE_DELAY_MS and BENCH_RUNS from 1 to 20");
}

const sockets = new Set();
let calls = 0;
let abortedResponses = 0;
const server = http.createServer((request, response) => {
  request.resume();
  request.on("end", () => {
    calls += 1;
    const timer = setTimeout(() => {
      response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
        content: [{ type: "text", text: '{"lane":"ask","reason":"benchmark reply"}' }],
      }));
    }, delayMs);
    response.on("close", () => {
      clearTimeout(timer);
      if (!response.writableEnded) abortedResponses += 1;
    });
  });
});
server.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
try {
  const config = resolveConfig({
    backendUrl: `http://127.0.0.1:${server.address().port}`,
    token: "synthetic-benchmark-only",
  }, { HOME: process.env.HOME });
  const samples = [];
  for (let index = 0; index < runs; index += 1) {
    const startedAt = performance.now();
    const result = await gate(config, "what is a monad");
    samples.push({ milliseconds: Number((performance.now() - startedAt).toFixed(2)), gated: result.gated, lane: result.lane });
  }
  // Let loopback close events drain before counting actual request aborts.
  await new Promise((resolve) => setTimeout(resolve, 30));
  const sorted = samples.map((sample) => sample.milliseconds).sort((left, right) => left - right);
  console.log(JSON.stringify({
    label: process.env.BENCH_LABEL ?? "current",
    node: process.version,
    scenario: `loopback gate response delayed ${delayMs} ms`,
    samples,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    calls,
    abortedResponses,
  }, null, 2));
} finally {
  for (const socket of sockets) socket.destroy();
  await new Promise((resolve) => server.close(resolve));
}
