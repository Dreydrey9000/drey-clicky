# Optional voice connectors

Two independent opt-ins let an existing Wispr Flow or Omi app type into Clicky's prompt. Both may be enabled. The requested scope is voice typing from both apps. This is local voice-input interoperability, not an account-data connection or an embedded transcription API. Omi memories/meeting context are outside this change. The implemented user guide is [VOICE-CONNECTORS.md](VOICE-CONNECTORS.md).

| Outcome | Interface | State/storage | Permissions/integration | Recovery and verification |
|---|---|---|---|---|
| Review Jax computer actions | Existing Mac system dialog | Per-request ID, child-only Hermes frontend; no approval-mode writes | Reuse current Jax profile and cua-driver. Once or deny only | Missing/expired/cancelled answers deny; protocol and compatibility tests; real user-approved app-opening check |
| Use either/both voice apps | Existing Settings → Clicky controls and composer | VoiceAppConnections, off by default in own UserDefaults domain | Installed app check; existing apps keep shortcuts/accounts | Missing app remains explicit; Flow/Omi keys do not start Clicky's microphone; unit and rendered UI checks |
| Open a separate Clicky prompt | Configurable preset shortcut | Same input-routing preferences | Reuse global event monitor, pause Clicky's conflicting legacy gestures only while opted in | Escape/cancel and key-repeat tests; ordinary dictation in other apps remains with its provider |
| Preserve the screen being discussed | Existing screen/selection capture and task bridge | Short-lived in-memory composer snapshot | Capture locally before focusing the input; send only on submission | Fresh-context selection tests and native context/bridge checks |
| Tell users what changed | Existing welcome/caption | Versioned once-per-user update marker | Show after permission setup, at idle | New-user and repeat-launch behavior tests |

Order: approval frontend, shared input preferences/routing, settings/composer integration, acceptance checks. Reuse the existing task bridge, screenshot types, private history, answer cards and spoken summaries. No provider keys, account exports or other apps' preferences are changed by voice opt-ins.
