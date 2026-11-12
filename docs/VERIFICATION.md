# Verification record

November 12, 2026. Local developer preview. Build/test success is separate from hands-free readiness and competitive superiority.

| Check | Result | Evidence |
|---|---|---|
| Current TypeScript gauntlet | PASS | 130 agent tests, 270 backend tests, typecheck, ESLint, source rules, skill validation, both builds and MCP handshake; three bounded gauntlet passes with concrete fixes between them |
| Native app build | PASS | Xcode 26.6, Debug arm64, unique com.dreytools.clicky.debug identity, explicit OpenClicky Swift module name |
| Broad native unit suite | PASS: 1125/1125 on final run | First run was 1124/1125: a probe encountered a broken local browser shim. The corrected probe checks that a real executable exists; the full suite was rerun green. |
| Native affected-suite rerun | PASS | Chromium probe, configuration and account-capability suites; incomplete browser bundles are not considered installed Chrome; no browser was installed or launched |
| Native Swift → CLI → MCP → Jax → Swift | PASS | Actual native smoke received the expected connection sentence and a completed Jax thread receipt |
| Actual Jax image + selection | PASS | Existing Jax identified a large red square and repeated CLICKY-CONTEXT-742 |
| Live screen routing fix | PASS | Jax's auxiliary image route failed the first fixture. Its Mac profile image_input_mode was changed from auto to native; only that key changed, private rollback saved; primary model/provider unchanged |
| Native speech rendering | PASS | Two Mac-voice sentences rendered to valid audio: 3.0 and 3.9 seconds, nothing played aloud; intelligibility has not been listened to |
| Installed app | PASS | /Applications/Drey Clicky.app, locally ad-hoc signed and verified; running with permission setup visible |
| Mac permissions | HUMAN STEP | Native diagnostics show microphone authorized (AVAuthorizationStatus 3) and Speech Recognition not determined (0); Accessibility/screen preflight returned true from the diagnostic launch, while installed-app onboarding still needs its explicit permission setup |
| Fresh independent consumer | PASS | Clean git-archive checkout outside iCloud: npm ci, agent build, MCP handshake, bundled workflow fixture task and fork checks |
| Live voice end to end | NOT YET | Cannot truthfully pass before the microphone/speech grants and a spoken request in the installed app |
| QuickSilver | PASS | Synthetic delayed classifier median 4006 to 2503 ms, with actual request abortion; not a competitor benchmark |
| RAMsey | PASS | Two read-only samples; disk 11 to 4.5 GiB, swap 30.35 to 35.41 GiB, transient warning then normal, thermal nominal; unrelated render left running |
| Runtime dependency audit | PASS | npm audit --omit=dev: zero vulnerabilities after compatible patch upgrades |
| Development-tool audit | REMAINS | Seven moderate development-tool advisories; no forced major upgrade/downgrade |
| REA metadata inspection | PASS | REA 6.4.0 inspect-plist on original Clicky 1.0.20, private raw receipt kept outside repo |
| REA decompilation | NOT COMPLETED | Universal Mach-O rejected, isolated arm64 attempt exceeded 120 seconds; no decompiled code or telemetry values republished |
| VoiceOS trial / same-task parity | NOT RUN | Official integration guide researched; no hands-on trial or superiority claim |
| Visual redesign | PENDING CHOICE | Six rendered concepts presented; working upstream visual design retained |
| Completion text | NOT SENT | Exact copy/recipient approval is pending; full voice-readiness check is also pending |

## Fixes made through the gauntlet

- Bounded slow gate requests and added cancellation/deadline regressions.
- Preserved selected text as JSON-escaped evidence and validated screenshot size/signature.
- Corrected MCP child environment forwarding so the configured Jax executable is used.
- Added actual task cancellation and process-group cleanup; never replay a task on another engine after uncertain dispatch.
- Adapted Codex integration assertions to Codex 0.166.0's developer-message request format, retaining file, image, approval and history checks.
- Retained the original Swift module name when branding the app product, preserving the inherited test imports.
- Excluded generated .build output from ESLint's source scan without weakening source rules.
- Updated skill-library assertions for the three added workflows and loaded those workflows into Jax task prompts.

The local reports directory retains the original failures and final receipts. No personal configuration backup, raw screenshot of the user's desktop, private message, API key or REA telemetry value is committed.

## GitHub Actions

[Run 43168152681](https://github.com/Dreydrey9000/drey-clicky/actions/runs/43168152681) passed TypeScript, macOS, Linux and Windows jobs on code revision `18dabd87533fe992159ab51e9b8b47286558d4a4`. Subsequent commits update maintenance documentation and the inspected rendered diagram only; they do not change application code.
