# Comparison and research log

Checked November 12, 2026. This is an engineering comparison, not a claim of overall superiority. Competitor features below come from primary public documentation; observed local tests are labeled separately.

| Capability | OpenClicky upstream | VoiceOS public documentation | Drey Clicky change |
|---|---|---|---|
| Voice and screen companion | Native speech, screen capture, pointer, dictation and answer UI | Voice-driven agent and dictation workflows | Reuses the native OpenClicky foundation |
| MCP integration | Optional tool servers in the Codex route | Custom stdio MCP servers; Python/TypeScript guide | Direct MCP client and local `jax_run` bridge to the existing Jax profile |
| Work engine | Codex thread adapter | VoiceOS's agent and connected tools | Jax by default; Codex selected explicitly for code jobs |
| Context | Screenshot support and selected text in existing answer paths | Features documented by VoiceOS; not measured locally | Screenshot plus selected text in the new Jax task route |
| Spoken result | Existing voice providers | Voice interaction | Bounded spoken summary and unchanged full answer card |
| Slow routing | Network classifier could stall indefinitely | Not measured | QuickSilver's 2.5-second deadline and heuristic fallback; synthetic before/after evidence in performance/ |
| Failed action | Depends on original adapter | Not measured | No automatic replay on another engine after uncertain dispatch |
| Trial experience | Not applicable | Trial requires account access | No trial run or hands-on parity claim until account access is available |

Primary references:

- [OpenClicky source and README](https://github.com/prasanthsasikumar/openclicky)
- [VoiceOS custom MCP integration](https://www.voiceos.com/guide/build-mcp-integration)
- [VoiceOS](https://www.voiceos.com/)
- [REA source](https://github.com/morluto/rea)
- [MCP client guidance](https://modelcontextprotocol.io/docs/develop/build-client)
- [Hermes source](https://github.com/NousResearch/hermes-agent)

## REA

REA 6.4.0 is installed locally. A native analysis of the installed original Clicky app was attempted. The first attempt without the configured provider environment failed with `provider_unavailable`, explicitly identifying Ghidra configuration and universal Mach-O constraints. The configured attempt rejected universal Mach-O; an isolated arm64 retry timed out after 120 seconds. A separate REA `inspect-plist` operation succeeded on the installed Clicky 1.0.20. This establishes bundle metadata only, not a completed behavioral teardown. Its private raw receipts stay outside the public repository. No private decompiled application code or strings are republished here; no VoiceOS binary or proprietary assets were copied.

The useful design principle is evidence-backed inspection before reconstruction. We use the public OpenClicky source for implementation and official VoiceOS documentation for interoperability. A failed REA command is never counted as successful comparative analysis.

## Same-task benchmark still required

Before calling this better overall: measure the same dictation, screen explanation, selected-text rewrite, calendar draft, code task, cancellation and failure-recovery cases on each app. Record successful completion, permission prompts, speech intelligibility, latency p50/p95, memory and battery impact. Fix the single worst measured bottleneck per pass. Do not invent competitor timings or count advertised features as executed tests.
