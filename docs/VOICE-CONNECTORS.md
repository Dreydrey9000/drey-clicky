# Optional Wispr Flow and Omi voice input

Enable either or both under **Settings → Clicky → Voice app connectors**. They are off by default. Each provider keeps its own account, microphone, transcription and shortcut settings. Clicky does not import credentials or change the other apps' preferences.

1. Install and configure your preferred voice app normally.
2. Enable its Clicky opt-in. Both switches can be on together.
3. Open Clicky's prompt with **Command + Shift + Space** (or choose one of the other presets).
4. Dictate with the voice app's own shortcut. With their usual settings, this is Fn for Wispr Flow and Control for Omi. Verify your own settings if you changed them.
5. Review the text, then press Return to send it to Jax. Escape closes the prompt.

While either opt-in is on, Clicky's Fn, Control + Option and double-Control listeners pause. Its own hands-free input also pauses so it does not compete for the microphone. Turning both opt-ins off restores Clicky's saved dictation key. Nothing remaps Fn system-wide. Choose a prompt preset that is unused by your keyboard layout and other apps.

Clicky saves the original screen and available selected text locally before focusing its prompt. It sends that context only when you submit; the in-memory snapshot expires after two minutes. If expired, Clicky uses a fresh screen and tells you the saved selection expired. Cancelling discards the snapshot. The provider's own audio/data policy still applies while it transcribes.

**These are voice-input connections.** They use the apps' normal ability to type into a focused field, rather than an embedded audio API. They do not connect Omi memories, meetings, ambient transcripts or a Wispr account-data API. Omi's [Developer API](https://docs.omi.me/doc/developer/api/overview) offers separately scoped access; that needs an independent authorized data connection. See [Wispr's dictation guide](https://docs.wisprflow.ai/articles/6409258247-starting-your-first-dictation) for its focused-field workflow and [Omi's source](https://github.com/BasedHardware/omi) for its desktop voice-typing implementation.

## Computer actions

The Jax route uses your existing Jax profile and enabled computer tools. On the supported local Hermes installation, a child-only adapter replaces its terminal approval UI with a Mac dialog. It does not change your installed Hermes source, profile, model, account or approval mode. Gated actions offer **Allow once** or **Deny**; there is no session-wide or permanent unlock. Closing, expiry, cancellation, malformed data or a missing frontend denies the action. Existing Jax policies still decide which actions require approval.

An approval denial makes the Clicky receipt **blocked**, even if the model's answer claims completion. Read the card and inspect any earlier work before deciding to retry. App launching needs an actual launch action: focusing an already-running window is a different tool operation. A successful screen capture does not prove app opening or clicking works.

The adapter recognizes the standard local `jax` installation at `~/.hermes/hermes-agent`, uses that installation's Python environment, and verifies its CLI callback interface before dispatch. A changed interface stops the adapter. Custom `DREY_CLICKY_JAX_BIN` launchers keep their own frontend. `DREY_CLICKY_HERMES_ROOT` and `DREY_CLICKY_JAX_PROFILE` select another compatible installation/profile. `DREY_CLICKY_APPROVAL_UI=off` uses the original CLI UI; it does not grant approvals and can be unusable for interactive approvals in a background app.

## Acceptance and recovery

- Missing voice app: the switch stays unavailable until installed. The Get app button opens its official site. You can still type normally.
- No dictated text: confirm the Clicky field has focus and that dictation works in another text field. Check the provider's microphone and shortcut settings; Clicky cannot validate its account sign-in.
- Wrong shortcut: choose another Clicky prompt preset. Never assign two voice listeners the same gesture.
- Permission cards reappear after replacing an ad-hoc build: macOS grants belong to the app identity. Complete its own prompts again; do not edit the TCC database.
- Before claiming live acceptance, dictate one harmless screen question through each provider, verify the original screen/selection, hear the answer, test Escape, and approve a harmless app action yourself. Component screenshots and synthetic keystrokes do not establish those checks.
