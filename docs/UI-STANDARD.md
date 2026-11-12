# Drey Clicky interaction standard

The shared Drey UI standard applies. This initial developer fork retains OpenClicky's native interface while the visual board awaits a choice. No new visual theme is implied by a successful build.

- Use native buttons, labels, focus, VoiceOver, reduced motion and keyboard controls. Show a meaningful pending state and real errors; never synthesize successful work from a timer.
- Preserve the stop/Escape behavior. Cancelling voice, speech or a task must stop the relevant process and must not replay the task on another engine.
- Speak a short summary; retain the full result in the card. Code and long URLs belong in the card. Failed and uncertain tasks must not say “done.”
- Disclose screen and selected-text context. Respect macOS permission and secure-field boundaries; do not bypass TCC or capture in the background for this integration.
- Keep the fork's bundle, settings, history and updater separate from upstream. Never make the fork silently install an upstream app.
- New product changes need truthful, persistent guidance. The developer setup guide and first-run macOS permission cards describe this build; a customer release needs a reviewed in-app update and final visual/keyboard checks.

Executable local and CI checks: `npm run lint:source`, `node scripts/check-drey-clicky.mjs`, TypeScript tests, and native unit tests. Source checks do not prove visual accessibility. Before customer release, run the actual app's recording, error, empty, disabled, keyboard, VoiceOver, reduced-motion and zoom journeys at the smallest supported window and normal desktop sizes. This is a Mac app, not a mobile website; a phone screenshot cannot verify it.
