# QuickSilver: bound the routing gate

Measured on November 12, 2026, on the build Mac with Node v22.22.3. One bottleneck was changed: a slow cloud classifier could hold the request indefinitely before either the ask or agent lane started.

## Change

`agent/src/gate.ts` now gives the classifier request and response body a shared 2,500 ms deadline. A deadline aborts the actual fetch and returns the existing local heuristic decision. It clears the timer on every completed path. Optional caller cancellation propagates to the caller rather than beginning a different operation. An explicit timeout must be an integer from 1 to 60,000 ms.

This preserves model classification on a prompt response and preserves the existing heuristic when classification is unavailable. It does **not** grant tools additional permissions. A slow classifier may now use the heuristic where it previously waited for the model; the heuristic intentionally favors the agent lane for requests involving work.

## Measured before and after

The benchmark runs five sequential requests against a loopback HTTP server that waits 4,000 ms before sending a valid classification. It uses synthetic text and a dummy local token. It makes no model/provider requests and reads no screen content or personal data. The baseline was measured before editing `gate.ts`, on upstream revision `3b516e997764d3372958b31cd395be400e595cea`.

| Measurement | Before | After |
| --- | ---: | ---: |
| Median time until a lane decision | 4,006.36 ms | 2,502.66 ms |
| Observed p95 (five samples) | 4,024.96 ms | 2,504.27 ms |
| Real HTTP requests aborted | 0 / 5 | 5 / 5 |
| Final lane for the synthetic question | ask | ask |
| Model classified | 5 / 5 | 0 / 5 (heuristic fallback) |

The median wait in this delayed-response scenario fell by **1,503.70 ms (37.5%)**. This is a latency-versus-classifier tradeoff under a deliberately slow endpoint, not an ordinary-turn speedup, a Jax end-to-end benchmark, or a comparison with VoiceOS. Five samples describe this local run only. The upstream implementation had no application deadline; the benchmark's 4-second response does not measure how long a completely non-responsive endpoint would otherwise stall.

A zero-delay loopback sanity run is saved separately in `gate-fast.json`; all five fast responses retained model classification.

Raw data: [before](gate-before.json), [after](gate-after.json), [fast response](gate-fast.json).

## Reproduce

From the repository root after `npm ci`:

```sh
node --import tsx agent/bench/gate-latency.mjs
BENCH_GATE_DELAY_MS=0 node --import tsx agent/bench/gate-latency.mjs
node_modules/.bin/vitest run agent/test/gate.test.ts agent/test/gateDeadline.test.ts
```

`BENCH_RUNS` accepts 1–20 and defaults to 5. `BENCH_GATE_DELAY_MS` accepts a non-negative integer and defaults to 4000. Save the JSON output to compare future runs. To reproduce the pre-change baseline, run the same benchmark against the recorded upstream version of `gate.ts` in an isolated checkout.

## Verification

Ten gate tests pass: existing classification/parsing/fallback behavior plus stalled-fetch abort, deadline through response-body reading, timer cleanup after a fast response, caller cancellation, pre-cancelled requests, and invalid timeout rejection. The new test and benchmark files pass ESLint. Existing `gate.ts` parsing code emits its pre-existing unsafe-`any` warnings; this change adds no lint errors there.

No production deployment, service configuration changes, model downloads, or private-data transfers were performed for this loop.
