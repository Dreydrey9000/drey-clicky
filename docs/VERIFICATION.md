# Verification record

November 12, 2026. Local developer preview. Successful builds, fixture checks, live microphone use and competitive superiority are separate results.

| Check | Result | Evidence |
|---|---|---|
| TypeScript gauntlet | PASS | 145 agent tests and 270 unchanged backend tests; types, ESLint, source rules, skill checks, both builds and MCP handshake. Final cancellation change also passed its scoped checks. |
| Native build and unit suite | PASS | Xcode 26.6 Debug arm64; 1126/1126 native unit tests, zero failures. The inherited real-audio concurrency class remains excluded as in CI. Interactive UI tests are separate. |
| Native test stability | FIXED AND RERUN | One continuation run exposed a fixed-sleep HUD assertion: collapsed had not yet become compact. The test now waits for the actual transition with a deadline. An unwanted interactive UI runner was cancelled; the final unit-only run matches CI and passed. |
| Swift → CLI → MCP → Jax → Swift | PASS | Actual native connection smoke received a completed Jax receipt. |
| Image, selected text and pointer | PASS | Actual Jax identified a synthetic red square, repeated the selected fixture text and returned its valid center point; pointer metadata stayed out of speech and answer text. |
| Actual Jax file action | PASS AFTER FIX | First run followed an old profile working-directory default. The bridge now supplies an authoritative absolute workspace in its prompt and environment. A repeat created and linked the exact verified file in the intended workspace. This is not an OS sandbox for Jax. |
| Codex code fallback | PASS | Existing ChatGPT sign-in created a module and two node:test cases. Agent and independent execution both passed; existing account config hash was unchanged. No account credentials were copied. |
| Account/history boundaries | PASS | Unit checks prevent reading turns, resuming or archiving another workspace's Codex chat. Jax resume checks its saved workspace before dispatch. |
| Complete voice fixture | PASS | A recorded utterance passed through Apple on-device transcription, native CLI/MCP/Jax image+selection, answer card fields, pointer and Mac voice. Generated reply audio was 5.80 s; independent transcription recovered the expected answer. Nothing played aloud; no human listening or physical spoken request is claimed. |
| Apple speech consent | VERIFIED | On macOS 26 the on-device analyzer does not require the legacy speech-recognition consent. The older recognizer fallback requests/checks that consent when used. No TCC database changes or consent bypass. |
| Installed preview | PASS | Updated /Applications/Drey Clicky.app, ad-hoc signed and verified; previous task-built preview retained privately for rollback. Stable signing/notarization for distribution remains open. |
| Live hotkey/microphone conversation | HUMAN CHECK | The fixture proves the pipeline. A person still needs to speak a request through the installed app and confirm the real microphone, screen, pointing and final voice experience. |
| Fresh independent consumer | PASS ON INITIAL VERSION | Clean git-archive checkout: npm ci, agent build, handshake and workflow fixture. Later changes have local tests and their own live receipts; this earlier checkout is not presented as a fresh check of later code. |
| QuickSilver loop 1 | PASS | Delayed classifier median 4006 to 2503 ms; request abortion and heuristic fallback. Synthetic comparison, not a competitor benchmark. |
| QuickSilver loop 2 | PASS | Artifact stat attempts now capped at 20,000; explicit truncation. Flat 25,000-file fixture median 153.27 to 117.93 ms (23.1%). Incomplete Jax scans withhold automatic links. |
| RAMsey | PASS | Three read-only resource checks; latest normal pressure, about 13 GiB disk free, nominal thermal state, AC power. Only task-owned VoiceOS was closed; unrelated jobs remained protected. |
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

Private reports retain original failures and final receipts. No personal configuration backup, desktop screenshot, message, key or raw REA metadata token is committed. The Jax vision check required changing only the existing profile's image_input_mode from auto to native; its primary model/provider stayed unchanged, with a private rollback copy.

## GitHub Actions

The earlier [four-platform run](https://github.com/Dreydrey9000/drey-clicky/actions/runs/43168152681) passed on the initial implementation. The continuation changes require a new run; its final result will be recorded after the source push.
