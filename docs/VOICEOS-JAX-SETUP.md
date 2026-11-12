# VoiceOS trial with the existing Jax bridge

Status: the local launcher can be prepared and its MCP handshake checked independently. This does **not** establish VoiceOS sign-in, trial activation, connection or successful voice tool use. Those still need the actual app session. Do not buy a plan or claim a comparison result from a handshake.

VoiceOS's [official custom integration guide](https://www.voiceos.com/guide/build-mcp-integration) describes a local stdio server configured through Settings → Integrations → Custom Integrations → Add. Use this fork's existing `jax_run` server; no new Jax identity, provider key, remote port or messaging gateway is needed.

## Prepare the command

Build the agent, then resolve the installed Node executable:

```sh
npm run build -w agent
command -v node
```

The server entry point is `/absolute/path/to/drey-clicky/agent/dist/jaxServer.js`. If paths contain spaces or the GUI app has a different PATH, create an owner-only executable wrapper in a path without spaces. Substitute the actual paths:

```sh
#!/bin/sh
exec '/absolute/path/to/node' '/absolute/path/to/drey-clicky/agent/dist/jaxServer.js'
```

Save it, for example, as `~/.local/bin/drey-clicky-voiceos-mcp`, give it mode `700`, and verify it with the existing MCP client:

```sh
DREY_CLICKY_MCP_COMMAND='["/absolute/path/to/drey-clicky-voiceos-mcp"]' node agent/dist/cli.js doctor --json
```

Expected: `mcpConnected: true`, `taskToolAvailable: true`, and tool `jax_run`. This check does not call the model or perform an action. Do not overwrite an existing different launcher. The standard local Mac Jax installation uses the child-only approval frontend; custom launchers may need their own approval UI. See [voice and approval setup](VOICE-CONNECTORS.md).

## Connect in the authenticated VoiceOS app

1. Finish VoiceOS sign-in and review the available trial yourself. Stop if a purchase or payment details are required.
2. In its Custom Integrations page, name the integration **Jax via Drey Clicky** and enter the wrapper's absolute path as the launch command.
3. Confirm VoiceOS discovers `jax_run`. It requires `task` and an absolute `workspace`; use the same dedicated scratch workspace for both apps. Optional arguments are `imagePath`, `selectedText` and `threadId`.
4. First ask for a one-sentence response without tools or actions. Confirm an actual Jax receipt before testing writes.
5. Then run the same harmless fixtures in both apps using the [comparison worksheet](VOICEOS-BENCHMARK.csv). Start with screen explanation and a selected-text draft. Review any action approval yourself. Do not retry an unapproved or uncertain action through another route.

Image context is a path to an actual local PNG/JPEG file, not a screenshot description or a remote URL. Do not assume VoiceOS automatically forwards an image or selection to a custom tool: verify the real call and receipt. Never invent a screenshot path. An integration appearing in a list does not prove context forwarding or action completion.

## Record evidence

Use synthetic screen/selection fixtures and local scratch files. Keep raw desktop images, account details, task receipts and timings outside the public repository. Record successful completion separately from spoken claims. Measure elapsed time using a clock or recorder, and repeat the same scenario enough times before reporting p50/p95. Leave unrun cases blank; zero is not a missing result.

The worksheet lists the target cases; it contains no claimed competitor measurements. Overall superiority remains unproven until both apps complete the same tasks under comparable settings. The OpenWhispr fallback remains conditional on an actual OpenClicky blocker.
