import AVFoundation
import Foundation

/// A real audio-file → on-device transcription → Jax image request → Mac voice check.
/// This never plays audio or substitutes for a test of the physical microphone.
@MainActor
enum DreyClickyVoiceSmoke {
    static func run(inputURL: URL, imagePath: String, outputDirectory: URL) async -> Int32 {
        do {
            try FileManager.default.createDirectory(at: outputDirectory, withIntermediateDirectories: true)
            let transcript = try await TakeAudioStore.transcribe(
                fileURL: inputURL, provider: AppleSpeechTranscriptionProvider(), keyterms: [],
                sliceSeconds: 0.1, pauseBetweenSlicesNanoseconds: 100_000_000,
                onTranscriptUpdate: { _ in })
            guard !transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw OpenClickyAgentError(message: "The voice fixture produced no transcript.")
            }
            let result = try await OpenClickyAgentClient().runAgent(
                task: transcript, screenshotPath: imagePath, threadId: nil,
                selectedText: "VOICE-CONTEXT-742", onEvent: { print("voice-check: \($0)") })
            guard result.status == "completed" else {
                throw OpenClickyAgentError(message: "Jax did not complete the voice fixture request.")
            }
            let spoken = result.spokenSummary ?? result.text
            let audio = try await MacVoice.shared.audio(for: spoken)
            let audioURL = outputDirectory.appendingPathComponent("reply.wav")
            try audio.write(to: audioURL, options: .atomic)
            let player = try AVAudioPlayer(data: audio)
            guard player.duration > 0.2 else { throw OpenClickyAgentError(message: "The voice reply was empty.") }
            let receipt: [String: Any] = [
                "transcript": transcript, "answer": result.text, "spokenSummary": spoken,
                "pointTag": result.pointTag ?? "", "threadId": result.threadId ?? "",
                "status": result.status, "audioSeconds": player.duration, "audioPath": audioURL.path,
                "microphoneTested": false, "audioPlayed": false
            ]
            let data = try JSONSerialization.data(withJSONObject: receipt, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: outputDirectory.appendingPathComponent("receipt.json"), options: .atomic)
            print("voice-check: completed; \(String(format: "%.1f", player.duration)) seconds of reply audio saved, not played")
            return 0
        } catch {
            print("voice-check: failed: \(error.localizedDescription)")
            return 1
        }
    }
}
