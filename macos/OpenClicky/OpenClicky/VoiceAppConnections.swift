import AppKit
import Combine
import Foundation

enum VoiceAppConnector: String, CaseIterable, Identifiable {
    case wisprFlow, omi
    var id: String { rawValue }
    var name: String { self == .wisprFlow ? "Wispr Flow" : "Omi" }
    var bundleIdentifier: String { self == .wisprFlow ? "com.electron.wispr-flow" : "com.omi.computer-macos" }
    var website: URL { URL(string: self == .wisprFlow ? "https://wisprflow.ai" : "https://www.omi.me")! }
    @MainActor var installed: Bool { NSWorkspace.shared.urlForApplication(withBundleIdentifier: bundleIdentifier) != nil }
}

struct ComposerScreenContext {
    let screens: [CompanionScreenCapture]
    let selectedText: String?
    let capturedAt: Date
    func isFresh(at now: Date) -> Bool { (0...120).contains(now.timeIntervalSince(capturedAt)) }
}

enum ConnectorPromptShortcut: String, CaseIterable, Identifiable {
    case commandShiftSpace, commandOptionReturn, commandOptionShiftSpace
    var id: String { rawValue }
    var keyCode: UInt16 { self == .commandOptionReturn ? 36 : 49 }
    var modifiers: NSEvent.ModifierFlags {
        switch self {
        case .commandShiftSpace: return [.command, .shift]
        case .commandOptionReturn: return [.command, .option]
        case .commandOptionShiftSpace: return [.command, .option, .shift]
        }
    }
    var label: String {
        switch self {
        case .commandShiftSpace: return "⌘ ⇧ Space"
        case .commandOptionReturn: return "⌘ ⌥ Return"
        case .commandOptionShiftSpace: return "⌘ ⌥ ⇧ Space"
        }
    }
    var keycaps: [String] {
        switch self {
        case .commandShiftSpace: return ["⌘", "⇧", "space"]
        case .commandOptionReturn: return ["⌘", "⌥", "return"]
        case .commandOptionShiftSpace: return ["⌘", "⌥", "⇧", "space"]
        }
    }
}

/// Own preferences only. The companion never rewrites Flow or Omi's shortcuts/accounts.
@MainActor
final class VoiceAppConnections: ObservableObject {
    static let shared = VoiceAppConnections()
    private let defaults: UserDefaults
    @Published var wisprFlow: Bool { didSet { defaults.set(wisprFlow, forKey: "dreyClicky.voice.wisprFlow") } }
    @Published var omi: Bool { didSet { defaults.set(omi, forKey: "dreyClicky.voice.omi") } }
    @Published var promptShortcut: ConnectorPromptShortcut { didSet { defaults.set(promptShortcut.rawValue, forKey: "dreyClicky.voice.promptShortcut") } }
    var usesExternalVoice: Bool { wisprFlow || omi }
    var enabledNames: String { [wisprFlow ? "Wispr Flow" : nil, omi ? "Omi" : nil].compactMap { $0 }.joined(separator: " or ") }
    var promptHint: String { usesExternalVoice ? "dictate with \(enabledNames), then press Return…" : "ask clicky anything about your screen…" }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        wisprFlow = defaults.bool(forKey: "dreyClicky.voice.wisprFlow")
        omi = defaults.bool(forKey: "dreyClicky.voice.omi")
        promptShortcut = ConnectorPromptShortcut(rawValue: defaults.string(forKey: "dreyClicky.voice.promptShortcut") ?? "") ?? .commandShiftSpace
    }

    func enabled(_ app: VoiceAppConnector) -> Bool { app == .wisprFlow ? wisprFlow : omi }
    func setEnabled(_ app: VoiceAppConnector, _ value: Bool) {
        if app == .wisprFlow { wisprFlow = value } else { omi = value }
    }
}

enum ConnectorUpdate {
    static let version = "voice-connectors-1"
    static let text = "New: optional Wispr Flow and Omi voice typing. Enable either or both in Settings → Clicky → Voice app connectors."
    static func consumeIfReady(defaults: UserDefaults, permissionsReady: Bool, idle: Bool) -> Bool {
        guard permissionsReady, idle, defaults.string(forKey: "dreyClicky.update.seen") != version else { return false }
        defaults.set(version, forKey: "dreyClicky.update.seen")
        return true
    }
}
