import Testing
@testable import OpenClicky

struct AppleSpeechPermissionTests {
    @Test func theOnDeviceAnalyzerDoesNotPreflightServerRecognitionConsent() {
        if #available(macOS 26, *) {
            #expect(!AppleSpeechTranscriptionProvider().requiresSpeechRecognitionPermission)
        } else {
            #expect(AppleSpeechTranscriptionProvider().requiresSpeechRecognitionPermission)
        }
    }
}
