# Verification record

November 12, 2026. Local developer preview. Successful builds, fixture checks, live microphone use and competitive superiority are separate results.

| Check | Result | Evidence |
|---|---|---|
| TypeScript gauntlet | PASS | 154 agent tests and 270 unchanged backend tests; types, ESLint, source rules, skill checks, both builds and MCP handshake. Three Python approval tests and JXA syntax check also passed. |
| Native build and unit suite | PASS | Xcode 26.6 Debug arm64; 1133/1133 native unit tests, zero failures, including seven new connector tests. The inherited real-audio concurrency class remains excluded as in CI. Interactive UI tests are separate. |
| Voice-app input routing | AUTOMATED PASS | Independent off-by-default Flow/Omi opt-ins, both together, preference persistence, original saved key, all prompt presets, repeat suppression, Escape, reset and opt-out restoration. No other apps' preferences changed. Real dictation through each provider is separate. |
| Connector settings | COMPONENT CHECK | Installed/missing provider, off/Flow/both and disabled states captured at fixed wide and narrow native window sizes. An initial unconstrained fixture window was corrected before final captures. Native controls have accessibility labels; this is not a live VoiceOver or microphone test. |
| Jax Mac approval frontend | PROTOCOL PASS; LIVE ACTION OPEN | Child-only adapter compatibility verified against the actual local Jax CLI and profile path. Malformed/overlapping payloads, cancellation, late answers, missing frontend and non-once decisions deny; denial forces a blocked receipt despite a model completion claim. The Calculator action was not approved, so it was not dispatched or retried. |
| Adapter → real Jax | PASS | A no-tools request through the rebuilt CLI/MCP/adapter returned the exact requested marker from the existing Jax profile. The unrelated existing omh setup warning remained visible. This does not validate a write action. |
| Computer-use observation | PASS; APP OPEN UNVERIFIED | Actual Jax computer tools captured the screen and listed apps. Its earlier focus attempt timed out in the hidden terminal approval frontend. Selecting a running window does not launch an installed nonrunning app; the new frontend still needs a user-approved live action check. |
| Native test stability | FIXED AND RERUN | One continuation run exposed a fixed-sleep HUD assertion: collapsed had not yet become compact. The test now waits for the actual transition with a deadline. An unwanted interactive UI runner was cancelled; the final unit-only run matches CI and passed. |
| Swift → CLI → MCP → Jax → Swift | PASS | Actual native connection smoke received a completed Jax receipt. |
| Image, selected text and pointer | PASS | Actual Jax identified a synthetic red square, repeated the selected fixture text and returned its valid center point; pointer metadata stayed out of speech and answer text. |
| Actual Jax file action | PASS AFTER FIX | First run followed an old profile working-directory default. The bridge now supplies an authoritative absolute workspace in its prompt and environment. A repeat created and linked the exact verified file in the intended workspace. This is not an OS sandbox for Jax. |
| Codex code fallback | PASS | Existing ChatGPT sign-in created a module and two node:test cases. Agent and independent execution both passed; existing account config hash was unchanged. No account credentials were copied. |
| Account/history boundaries | PASS | Unit checks prevent reading turns, resuming or archiving another workspace's Codex chat. Jax resume checks its saved workspace before dispatch. |
| Complete voice fixture | PASS | A recorded utterance passed through Apple on-device transcription, native CLI/MCP/Jax image+selection, answer card fields, pointer and Mac voice. Generated reply audio was 5.80 s; independent transcription recovered the expected answer. Nothing played aloud; no human listening or physical spoken request is claimed. |
| Apple speech consent | VERIFIED | On macOS 26 the on-device analyzer does not require the legacy speech-recognition consent. The older recognizer fallback requests/checks that consent when used. No TCC database changes or consent bypass. |
| Installed preview | PASS AFTER SIGNING FIX | Updated /Applications/Drey Clicky.app launched after signature verification. An initial hardened-runtime/ad-hoc Debug mismatch failed the load check; re-signing with the previous preview's ordinary ad-hoc developer flags fixed it. The previous preview is retained privately. Diagnostics report Accessibility, microphone and screen access plus Jax/CLI availability; live GUI/voice acceptance is separate. Stable signing/notarization for distribution remains open. |
| Live hotkey/microphone conversation | HUMAN CHECK | The fixture proves the pipeline. A person still needs to speak a request through the installed app and confirm the real microphone, screen, pointing and final voice experience. |
| Fresh independent consumer | PASS ON 53346b2 | Clean git-archive checkout: npm ci, agent build, MCP handshake, fixture task, exact created-file content and artifact link; scratch removed after receipts. Subsequent welcome/copy/build-script changes have their own native checks. |
| QuickSilver loop 1 | PASS | Delayed classifier median 4006 to 2503 ms; request abortion and heuristic fallback. Synthetic comparison, not a competitor benchmark. |
| QuickSilver loop 2 | PASS | Artifact stat attempts now capped at 20,000; explicit truncation. Flat 25,000-file fixture median 153.27 to 117.93 ms (23.1%). Incomplete Jax scans withhold automatic links. |
| RAMsey | PASS | Latest connector-build check: normal pressure, about 42 GiB disk free, nominal thermal state, AC power. Only task-owned apps were closed; Omi, Flow and unrelated jobs remained protected. |
| Dependency audit | RUNTIME PASS | Zero runtime advisories after compatible patch upgrades. Seven moderate development-tool advisories remain; no forced major changes. |
| REA inspection | METADATA PASS | REA 6.4.0 inspect-plist succeeded on original Clicky 1.0.20 and VoiceOS 0.1.40. Native decompilation/VoiceOS UI observation did not complete. Raw private metadata is not published. |
| VoiceOS trial / same-task parity | INCOMPLETE | Official app installed and launched, signature/notarization verified. Black window capture and unavailable AX geometry blocked usable UI inspection. No account signup, purchase, trial activation or superiority claim. |
| Visual redesign | PENDING CHOICE | Six rendered concepts presented; existing native design retained. |

## Improvements verified through bounded loops

- Slow routing has a 2.5-second deadline, cancellation and local heuristic fallback.
- Jax work is limited in time/output and its process group is cleaned up after cancellation. Codex cancellation also stops its child; initialization has a deadline.
- Selected text is JSON-separated evidence; PNG/JPEG context has size and dimension validation. Only in-bounds point metadata reaches the native overlay.
- Active workspace guidance fixes the observed old-profile-directory error. Complete before/after scans provide actual changed-file links; incomplete scans are disclosed.
- Jax uses the existing profile through the local MCP task bridge. No automatic engine replay follows an uncertain action outcome.
- Codex can use an existing ChatGPT login without writing account config, while keeping own-key/backend compatibility and limiting history access to the active workspace.
- Personal settings, dictionary, shortcuts, saved take audio, user skills and backend-mode Codex state have fork-specific paths. Installed model caches can remain shared.
- Unique bundle identity, disabled upstream updater, preserved Swift module imports, source rules and isolated local history are checked.
- The first-use welcome explains Jax after permissions, keeps existing once-per-user tour behavior, skips the old automatic screen/backend demo and never creates an upstream guest account.
- The documented native build command was executed: a test-only coverage flag was removed from the ordinary build script. Account settings copy now describes the actual key storage and backend route.

Private reports retain original failures and final receipts. No personal configuration backup, desktop screenshot, message, key or raw REA metadata token is committed. The Jax vision check required changing only the existing profile's image_input_mode from auto to native; its primary model/provider stayed unchanged, with a private rollback copy.

## GitHub Actions

All four jobs passed on runtime-code revision `e19980f65787a604af2ae93bb1d8f759861b06c5`: [run 43174751397](https://github.com/Dreydrey9000/drey-clicky/actions/runs/43174751397) — TypeScript, macOS, Linux and Windows. The earlier continuation run had an inherited Windows voice-timing assertion failure; its original receipt is retained. No Windows product behavior was changed to obtain the later passing result.

The subsequent handoff commit changed documentation and made the native UI-capture script resolve CFBundleExecutable from the app bundle, supporting the renamed product. That script completed ten first-run component captures under a disposable demo home; the welcome and talk cards were inspected for readable, unclipped copy. Those fixture captures do not establish live microphone or Mac permission readiness.

The later voice-connector and Mac approval changes are a new runtime revision. Its local checks are listed above; a previous green workflow does not validate that new revision. SwiftLint is unavailable in this local shell; the macOS workflow installs and runs it separately.
