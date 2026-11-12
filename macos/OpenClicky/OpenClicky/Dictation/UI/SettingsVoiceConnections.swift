import AppKit
import SwiftUI

extension SettingsCatalog {
    func voiceConnectionItems() -> [SettingsItem] {
        var items = VoiceAppConnector.allCases.map { app in
            SettingsItem(id: "connectors.\(app.rawValue)", title: "Use \(app.name)",
                detail: "Optional voice typing into Clicky's prompt. Your other app keeps its own shortcut and account.",
                keywords: ["connector", "connection", "voice", "dictation", "wispr", "whisper", "flow", "omi", "fn"],
                view: AnyView(VoiceConnectionRow(app: app, openPrompt: { companionManager.openTextComposer() })))
        }
        items.append(SettingsItem(id: "connectors.promptShortcut", title: "Clicky prompt shortcut",
            detail: "With either connector on, Clicky's Fn, Control + Option and double-Control listeners pause. Open this prompt, dictate using either app, then press Return.",
            keywords: ["connector", "shortcut", "hotkey", "fn", "control", "prompt", "typing"],
            view: AnyView(VoicePromptShortcutRow())))
        items.append(SettingsItem(id: "connectors.privacy", title: "How voice connections work",
            detail: "Each app transcribes in its own account and types into Clicky's prompt. Clicky sends that text and your screen context to your assistant. This connects voice typing; Omi memories need a separate data connection.",
            keywords: ["privacy", "connector", "account", "omi", "memories", "audio"], chrome: .footer,
            view: AnyView(SettingsFootnote(text: "Each app transcribes in its own account and types into Clicky's prompt. Clicky sends that text and your screen context to your assistant. This connects voice typing; Omi memories need a separate data connection."))))
        return items
    }
}

struct VoiceConnectionRow: View {
    let app: VoiceAppConnector
    var installedOverride: Bool? = nil
    var openPrompt: () -> Void = {}
    @ObservedObject private var connections = VoiceAppConnections.shared
    var body: some View {
        let installed = installedOverride ?? app.installed
        SettingsRow(title: "Use \(app.name)", detail: installed ? "Voice typing · optional · uses \(app.name)'s own shortcut." : "Install \(app.name) to enable voice typing. You can still type into Clicky.") {
            HStack(spacing: 8) {
                if installed {
                    Button("Try", action: openPrompt)
                        .accessibilityLabel("Try \(app.name) voice typing in Clicky")
                        .disabled(!connections.enabled(app))
                } else {
                    Button("Get app") { NSWorkspace.shared.open(app.website) }
                        .accessibilityLabel("Get \(app.name)")
                }
                Toggle("Use \(app.name)", isOn: Binding(get: { connections.enabled(app) }, set: { connections.setEnabled(app, $0) }))
                    .labelsHidden()
                    .accessibilityLabel("Use \(app.name) voice typing in Clicky")
                    .disabled(!installed && !connections.enabled(app))
            }
        }
    }
}

struct VoicePromptShortcutRow: View {
    @ObservedObject private var connections = VoiceAppConnections.shared
    var body: some View {
        SettingsRow(title: "Clicky prompt shortcut", detail: connections.usesExternalVoice
                    ? "Open the prompt, dictate with \(connections.enabledNames), then press Return. Choose a shortcut unused by your other apps."
                    : "Enable a voice app above to use a dedicated prompt shortcut.") {
            Picker("Clicky prompt shortcut", selection: $connections.promptShortcut) {
                ForEach(ConnectorPromptShortcut.allCases) { shortcut in Text(shortcut.label).tag(shortcut) }
            }
            .labelsHidden()
            .accessibilityLabel("Clicky prompt shortcut")
            .disabled(!connections.usesExternalVoice)
        }
    }
}
