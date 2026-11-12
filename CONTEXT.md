# Shared vocabulary

- **Companion:** the native Mac voice, screen capture, pointer, and answer-card app.
- **Gate:** the bounded classifier that chooses ask or work; it never grants action permission.
- **Work engine:** Jax by default; Codex when explicitly selected for code.
- **Task bridge:** the local MCP server exposing `jax_run` to the CLI; it calls the existing Jax profile, not a new identity.
- **Context:** a screenshot and selected text attached to a request as untrusted evidence.
- **Receipt:** the actual terminal result of one request; a transport failure is not proof no work happened.
- **Gauntlet:** repeatable verification passes with a fixed stop rule, not unbounded recursive self-editing.

Public research references: OpenClicky, VoiceOS's MCP integration guide, and morluto/rea. See docs/COMPARISON.md for actual status. Personal integrations are provided through the user's existing Jax setup and are never bundled as private data.
