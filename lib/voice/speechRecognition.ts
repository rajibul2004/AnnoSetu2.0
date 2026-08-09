"use client";

// Type definitions for Web Speech API
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export type SupportedLanguage =
  | "en-IN"
  | "hi-IN"
  | "bn-IN"
  | "ta-IN"
  | "te-IN"
  | "mr-IN"
  | "gu-IN"
  | "kn-IN"
  | "ml-IN"
  | "pa-IN"
  | "en-US";

export interface SupportedVoiceLanguage {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: SupportedVoiceLanguage[] = [
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "en-IN", name: "English (India)", nativeName: "English", flag: "🇮🇳" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "en-US", name: "English (US)", nativeName: "English (US)", flag: "🇺🇸" },
];

export const SUPPORTED_LANGUAGES = SUPPORTED_VOICE_LANGUAGES;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export class VoiceRecognitionManager {
  private recognition: any = null;
  private isListening = false;
  private currentLanguage = "en-IN";
  private onTranscriptCallback?: (transcript: string, isFinal: boolean) => void;
  private onErrorCallback?: (error: string) => void;
  private onStateChangeCallback?: (isListening: boolean) => void;

  constructor(language = "en-IN") {
    this.currentLanguage = language;
  }

  public setLanguage(langCode: string) {
    this.currentLanguage = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  public onTranscript(callback: (transcript: string, isFinal: boolean) => void) {
    this.onTranscriptCallback = callback;
  }

  public onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  public onStateChange(callback: (isListening: boolean) => void) {
    this.onStateChangeCallback = callback;
  }

  public start(): boolean {
    if (typeof window === "undefined") return false;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.onErrorCallback?.("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or try typing.");
      return false;
    }

    try {
      if (this.recognition && this.isListening) {
        this.stop();
      }

      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChangeCallback?.(true);
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        if (combined) {
          this.onTranscriptCallback?.(combined, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        let message = "Voice recognition error";
        if (event.error === "no-speech") {
          message = "No speech detected. Please speak clearly into your microphone.";
        } else if (event.error === "audio-capture") {
          message = "Microphone not detected or permission denied.";
        } else if (event.error === "not-allowed") {
          message = "Microphone access blocked. Please enable microphone permissions in your browser settings.";
        } else if (event.error === "network") {
          message = "Speech network connection error. Please check your internet.";
        }
        this.onErrorCallback?.(message);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateChangeCallback?.(false);
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.onErrorCallback?.(err.message || "Failed to start speech recognition");
      return false;
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore already stopped
      }
    }
    this.isListening = false;
    this.onStateChangeCallback?.(false);
  }
}

export const speechRecognitionService = {
  manager: new VoiceRecognitionManager("bn-IN"),
  startListening(options: {
    language: SupportedLanguage;
    onResult: (res: { transcript: string; isFinal: boolean }) => void;
    onError?: (err: string) => void;
    onEnd?: () => void;
  }) {
    this.manager.setLanguage(options.language);
    this.manager.onTranscript((text, isFinal) => {
      options.onResult({ transcript: text, isFinal });
    });
    if (options.onError) this.manager.onError(options.onError);
    if (options.onEnd) {
      this.manager.onStateChange((listening) => {
        if (!listening) options.onEnd?.();
      });
    }
    return this.manager.start();
  },
  stopListening() {
    this.manager.stop();
  },
};
