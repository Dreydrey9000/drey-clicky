import AppKit
import Foundation
import Testing
@testable import OpenClicky

@MainActor
struct VoiceAppConnectionsTests {
    @Test func independentOptInsDefaultOffAndRestoreSavedChoices() throws {
        let suite = "drey-clicky-connections-\(UUID().uuidString)"
        let defaults = try #require(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        defaults.set("rightOption", forKey: "dictation.key")
        let connections = VoiceAppConnections(defaults: defaults)
        #expect(!connections.usesExternalVoice)
        connections.wisprFlow = true
        #expect(connections.usesExternalVoice && !connections.omi)
        connections.omi = true
        let restored = VoiceAppConnections(defaults: defaults)
        #expect(restored.wisprFlow && restored.omi)
        connections.wisprFlow = false
        #expect(connections.usesExternalVoice)
        connections.omi = false
        #expect(!connections.usesExternalVoice)
        #expect(defaults.string(forKey: "dictation.key") == "rightOption")
    }

    @Test func externalVoiceLeavesFnAndOmiControlGesturesAlone() {
        var recognizer = CompanionShortcutRecognizer(externalVoiceInput: true)
        let keys: [(UInt16, NSEvent.ModifierFlags)] = [(63, .function), (59, .control), (58, [.control, .option]), (63, [.control, .function])]
        for (index, item) in keys.enumerated() {
            #expect(recognizer.handle(.flagsChanged, keyCode: item.0, modifierFlags: item.1, at: Double(index)) == [])
            #expect(recognizer.handle(.flagsChanged, keyCode: item.0, modifierFlags: [], at: Double(index) + 0.1) == [])
        }
        #expect(!recognizer.isTalkHeld && !recognizer.isDictationKeyHeld)
    }

    @Test func eachPromptShortcutOpensOncePerPressAndEscapeStillStops() {
        for shortcut in ConnectorPromptShortcut.allCases {
            var recognizer = CompanionShortcutRecognizer(externalVoiceInput: true, connectorPromptShortcut: shortcut)
            #expect(recognizer.handle(.keyDown, keyCode: shortcut.keyCode, modifierFlags: shortcut.modifiers, at: 1) == [.textComposerRequested])
            #expect(recognizer.handle(.keyDown, keyCode: shortcut.keyCode, modifierFlags: shortcut.modifiers, at: 1.1) == [])
            #expect(recognizer.handle(.keyUp, keyCode: shortcut.keyCode, modifierFlags: shortcut.modifiers, at: 1.2) == [])
            #expect(recognizer.handle(.keyDown, keyCode: shortcut.keyCode, modifierFlags: shortcut.modifiers, at: 2) == [.textComposerRequested])
            #expect(recognizer.handle(.keyDown, keyCode: 53, modifierFlags: [], at: 3) == [.escapePressed])
        }
    }

    @Test func enablingAndResettingKeepTheSelectedExternalRouting() {
        var recognizer = CompanionShortcutRecognizer(dictationKey: .rightOption)
        recognizer.externalVoiceInput = true
        recognizer.connectorPromptShortcut = .commandOptionReturn
        recognizer.reset()
        #expect(recognizer.externalVoiceInput)
        #expect(recognizer.connectorPromptShortcut == .commandOptionReturn)
        #expect(recognizer.dictationKey == .rightOption)
        recognizer.externalVoiceInput = false
        #expect(recognizer.handle(.flagsChanged, keyCode: 61, modifierFlags: .option, at: 1) == [.dictationPressed])
    }

    @Test func extraModifiersDoNotTriggerAPrompt() {
        var recognizer = CompanionShortcutRecognizer(externalVoiceInput: true)
        #expect(recognizer.handle(.keyDown, keyCode: 49, modifierFlags: [.command, .shift, .control], at: 1) == [])
        #expect(recognizer.handle(.keyDown, keyCode: 49, modifierFlags: [.command, .shift, .function], at: 2) == [])
    }

    @Test func screenContextExpiresAndCannotAppearFreshFromTheFuture() {
        let now = Date()
        let context = ComposerScreenContext(screens: [], selectedText: "source selection", capturedAt: now)
        #expect(context.isFresh(at: now))
        #expect(context.isFresh(at: now.addingTimeInterval(120)))
        #expect(!context.isFresh(at: now.addingTimeInterval(121)))
        #expect(!context.isFresh(at: now.addingTimeInterval(-1)))
    }

    @Test func updateWaitsForPermissionsAndIdleThenShowsOncePerUser() throws {
        let suite = "drey-clicky-update-\(UUID().uuidString)"
        let defaults = try #require(UserDefaults(suiteName: suite))
        defer { defaults.removePersistentDomain(forName: suite) }
        #expect(!ConnectorUpdate.consumeIfReady(defaults: defaults, permissionsReady: false, idle: true))
        #expect(!ConnectorUpdate.consumeIfReady(defaults: defaults, permissionsReady: true, idle: false))
        #expect(ConnectorUpdate.consumeIfReady(defaults: defaults, permissionsReady: true, idle: true))
        #expect(!ConnectorUpdate.consumeIfReady(defaults: defaults, permissionsReady: true, idle: true))
        defaults.set("older-update", forKey: "dreyClicky.update.seen")
        #expect(ConnectorUpdate.consumeIfReady(defaults: defaults, permissionsReady: true, idle: true))
    }
}
