# Run Drey Clicky

Developer preview, derived from [OpenClicky](https://github.com/prasanthsasikumar/openclicky) under MIT. Preserve its upstream notices. This guide describes the new Jax route; upstream's other platform clients remain in the repository and are not Drey Clicky releases.

## Prerequisites

Use a non-iCloud checkout, Node 22+, npm, Xcode 26+, an Apple Silicon Mac, and the user's existing `jax` CLI/profile. `jax chat --help` must support `--query-file`, `--image`, named `--continue`, and `--run-budget`. The current configured Jax provider supplies inference; no credentials are bundled. Intel packaging and notarization are not verified for this fork.

```sh
npm ci
npm run build -w agent
node agent/dist/cli.js doctor --json
node agent/dist/cli.js run "Say hello in one sentence" --cwd "$PWD" --json
```

`doctor` is a protocol check without a model call. If your existing Jax has a dedicated auxiliary vision provider and reports images unavailable, configure `agent.image_input_mode: native` in that profile when the primary model supports images, then repeat a harmless fixture test. Do not change models or providers blindly. A live `run` is separate and uses the existing Jax account. No paid VoiceOS account or OpenClicky hosted account is needed for the Jax route. If `jax` isn't on PATH, set `DREY_CLICKY_JAX_BIN` to its executable. Custom MCP servers may be selected with `DREY_CLICKY_MCP_COMMAND='["executable","arg"]'`; they must implement the documented `jax_run` receipt. `jax mcp serve` currently exposes a messaging bridge, so it is not a substitute for this task bridge.

```sh
bash scripts/build-drey-clicky.sh
open ".build/native/Build/Products/Debug/Drey Clicky.app"
```

Builds use two jobs and the repository's `.build` directory. This script does not enroll in signing, notarize, install globally, create a login item or publish.

## Connect the native companion

Create `~/.drey-clicky/shell.json` outside the repository. Use absolute paths; replace the examples with your checkout and Node paths. Do not put provider keys into public files.

```json
{
  "cliCommand": ["/absolute/path/to/node", "/absolute/path/to/drey-clicky/agent/dist/cli.js"],
  "workspace": "/absolute/path/to/your/working-folder",
  "workEngine": "jax",
  "transcriptionProvider": "apple",
  "speechVoice": "mac",
  "registerAsLoginItem": false
}
```

Grant Microphone, Speech Recognition, Screen Recording and Accessibility to **Drey Clicky Debug** when macOS asks. Reopen after Screen Recording changes. Do not grant the old app on the fork's behalf. Stable signing is needed before distributing to other Macs; re-signing an existing bundle with a different identity can invalidate grants.

Hold Control + Option, speak, then release. Escape/stop interrupts. The native path sends its captured cursor-screen image and available selected text to Jax; password fields are excluded by the existing selection reader. No selection is fabricated when Accessibility cannot read it. The selected passage uses the native reader's bounded context (currently 600 characters). Short summaries are spoken; full answers remain in the result card. The new route does not invent pointer coordinates: the upstream teacher route retains its pointer behavior.

## Context, conversations and fallback

```sh
node agent/dist/cli.js run "Explain this selection" --image /path/screen.png --selected-text-file /path/selection.txt --json
node agent/dist/cli.js run "Continue the task" --thread jax:THE-RETURNED-ID --json
node agent/dist/cli.js run "Fix the failing test" --engine codex --cwd /path/project --approve
```

Jax requests use an MCP client and a local server that launches the existing `jax chat` profile. Screenshots are PNG/JPEG, at most 12 MiB; CLI selected text is at most 20,000 characters. Evidence is JSON-escaped separately from the real request. Prompt isolation is a defense, not a guarantee that every model obeys it. Jax's existing permission controls remain authoritative; this bridge never adds `--yolo`.

Jax conversations use `jax:` identifiers and named sessions, scoped by workspace. Codex identifiers cannot be resumed in Jax. The Agents panel lists the current engine’s local history. Jax requests and full answers are stored in owner-only files under `~/.drey-clicky/history`, without screenshot or selection copies. History keeps the last fifty turns per conversation. Archiving moves its record into `archived/`; it does not delete the underlying Jax session. A history-write error never changes a successful task into a failure or triggers replay.

Codex is an **explicit** alternate engine, using upstream's own-key/backend route. It still needs its configured credentials. A failed or cancelled Jax request is never silently replayed through Codex: Jax may already have changed something. Inspect before retrying. The gate classifies ask/work; it does not authorize sending, deleting, purchasing or publishing.

## Verification and recovery

Run `bash scripts/gauntlet.sh`. Reports are stored in ignored `.build/gauntlet`. Native tests use `xcodebuild test-without-building` after `build-for-testing`; see `.github/workflows/test.yml`. Live provider, microphone, screen permission and hearing the final speech are separate checks. Never call a build end-to-end verified based only on a mocked Jax test.

The work engine's subprocess has a three-minute budget and twenty tool turns, with process-group cancellation. MCP connection and request budgets are bounded. Output is capped. Private child diagnostics are drained without echoing them into the result card. The native integration removes its temporary screenshot and selection after the task. Jax itself may retain request content according to its existing profile/provider settings; the fork does not claim ephemeral provider storage.

Errors name the next action: missing Jax executable, wrong MCP tool, unavailable provider, invalid context or an uncertain timeout. Do not “fix” them by adding retries to actions. The fork disables upstream automatic updates and has its own bundle and settings. Its analytics remain disabled without an explicit PostHog key.

The local app also provides `--drey-clicky-diagnostics`: a read-only JSON permission/CLI check. Microphone status values use AVAuthorizationStatus (0 not determined, 1 restricted, 2 denied, 3 authorized); Speech Recognition uses SFSpeechRecognizerAuthorizationStatus (0 not determined, 1 denied, 2 restricted, 3 authorized). Diagnostic preflight and the installed app’s first-run setup must both be checked.
