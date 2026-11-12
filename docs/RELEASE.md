# Release plan

This is a local developer preview, with public source authorized by the user. Public GitHub source, a local build, a signed app, notarization, customer readiness and adoption are separate milestones.

Before distributing an app binary: finish the live speech/screen/selected-text/action/cancel journey; choose and verify the visual direction; review the once-per-user in-app update; establish one stable signing identity; notarize and verify a fresh Mac install; replace the upstream icon/remaining product copy where appropriate; and run the same-task comparison before making competitive claims. The current fork deliberately disables upstream updates.

## Small plugin candidate

Target user: someone who already has Drey Clicky and wants to check the connection or prepare a contextual task from Codex/ChatGPT. Useful first task: check the local Jax bridge and guide a failed microphone/screen permission setup without modifying permissions automatically.

Start with a focused setup/diagnosis skill; account-connected execution requires authenticated MCP tools and a separate action review. The existing local `jax_run` MCP server is not a remotely authenticated public service and must not be exposed on a public port.

Account and data permissions: local executable access; optional screenshot/selection only with user intent; the user's configured Jax model account; no bundled tokens or personal integrations. Path into the product: install the Mac app, grant permissions, then use the hotkey. Support cost: macOS TCC/signing and provider setup are the main expected issues. Measure adoption with opt-in successful setup counts and user-confirmed task completion, never raw screenshots or conversation telemetry.

Recheck current official OpenAI plugin documentation before packaging the public skill/MCP listing. Prepare a package, exact listing, positive/negative tests and demo before asking the user to approve submission and publication. No plugin submission or publication is claimed here. Customer distribution remains after the developer-preview gates above.
