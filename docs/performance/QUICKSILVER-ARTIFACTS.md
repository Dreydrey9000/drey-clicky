# QuickSilver loop 2: enforce the artifact scan's file limit

Measured November 12, 2026, with Node v22.22.3 on the build Mac. This loop changes one bottleneck: the workspace snapshot's 20,000-file limit was checked when entering a directory, but not while reading that directory. A flat directory could therefore scan and return arbitrarily more than 20,000 files.

## Small fix and contract

`agent/src/artifacts.ts` now checks the global file count before each in-scope directory entry. It performs at most **20,000 regular-file stat attempts**, including attempts that fail. Records therefore cannot exceed 20,000 either. The same global budget applies across sibling directories. Existing skip rules, file signatures, enumeration order and sorted `diffSnapshots` output are unchanged.

`snapshotWorkspace` still returns a `Map`; it now also exposes a boolean `truncated`. It is true when the count or depth cap stops the traversal, or a directory/file cannot be read. A fully scanned flat directory with exactly 20,000 files is not marked truncated. `diffSnapshots` continues to accept plain Maps, preserving its existing interface.

A truncated snapshot is **not complete evidence** that a file is new or changed. A caller that needs reliable before/after candidates must check both snapshots' metadata and avoid claiming completeness when either is truncated. The Jax caller checks both snapshots and withholds automatic artifact links when either is truncated, with an explanation in the full answer card. This loop does not change the older Codex caller's handling of incomplete snapshots.

This is a bound on recorded regular files, not all filesystem work or memory: `readdirSync` still materializes the current directory's entry names, directories themselves do not consume the file count. Failed stat calls consume the inspection budget without creating records. Very wide directory listings or trees with many empty directories can therefore still cost time/memory. Depth remains limited to root level 0 through child level 6; directory links are not followed.

## Measured before and after

Both measurements create 25,000 small synthetic regular files in a new, isolated scratch directory, snapshot it five times sequentially, then remove only that fixture. No home-directory scan, model request, service call, dependency install or native build is involved. Fixture setup/cleanup is excluded from snapshot timing.

| Measurement | Before | After |
| --- | ---: | ---: |
| Files returned, every run | 25,000 | 20,000 |
| File-stat calls, every run | 25,000 | 20,000 |
| Truncation metadata | absent | true |
| Snapshot median | 153.27 ms | 117.93 ms |
| Observed p95 (five samples) | 201.07 ms | 124.82 ms |

The operation count fell **20%** and the measured median fell **35.34 ms (23.1%)** in this local fixture. Timing varies with filesystem caching and other Mac activity; five runs are descriptive evidence, not a general speed guarantee. The reliable result is that every after-run honors the record/stat cap for this fixture and reports truncation. This is not an end-to-end Jax benchmark or a comparison with VoiceOS.

Raw samples: [before](artifacts-before.json), [after](artifacts-after.json).

## Reproduce and verify

```sh
node --import tsx agent/bench/artifacts-limit.mjs
node_modules/.bin/vitest run agent/test/artifacts.test.ts agent/test/artifactsLimit.test.ts
node_modules/.bin/tsc --noEmit -p agent/tsconfig.typecheck.json
```

`BENCH_FILES` accepts 20,001–100,000 (default 25,000), `BENCH_RUNS` accepts 1–20 (default 5), and `BENCH_LABEL` labels saved JSON. To reproduce the before-run, use the same script with the pre-change `artifacts.ts` revision in an isolated checkout.

Ten artifact tests pass: existing new/modified-file and `fileChange` extraction tests plus flat overflow, exact-cap completeness, a cap on failed stat attempts, sibling-directory global count, depth truncation, unreadable directory, unreadable/vanished file, and sorted plain-Map diff compatibility. Agent typecheck passes. The new benchmark/tests have no ESLint errors; `artifacts.ts` retains its existing unsafe-`any` warnings in `artifactsFromItems`.
