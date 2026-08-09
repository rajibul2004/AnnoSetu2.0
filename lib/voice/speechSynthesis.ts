import { SupportedLanguage } from "./speechRecognition";
import { ConversationStep, STEP_PROMPTS } from "./conversationStateMachine";

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
}

class SpeechSynthesisManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingInternal = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingInternal || (this.synth?.speaking ?? false);
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  /**
   * Find the most suitable voice for the chosen language
   */
  public findBestVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    const langCode = language.split("-")[0].toLowerCase(); // e.g. 'bn', 'hi', 'en'

    // 1. Exact match (e.g. 'bn-IN', 'hi-IN')
    const exact = voices.find(
      (v) => v.lang.toLowerCase() === language.toLowerCase()
    );
    if (exact) return exact;

    // 2. Prefix match (e.g. 'bn', 'hi')
    const prefix = voices.find((v) =>
      v.lang.toLowerCase().startsWith(langCode)
    );
    if (prefix) return prefix;

    // 3. Indian English fallback if language is Indian
    const indianEnglish = voices.find((v) =>
      v.lang.toLowerCase().includes("en-in")
    );
    if (indianEnglish && langCode !== "en") return indianEnglish;

    // 4. Any English voice as universal fallback
    const english = voices.find((v) =>
      v.lang.toLowerCase().startsWith("en")
    );
    return english || voices[0] || null;
  }

  /**
   * Speak a text string with complete lifecycle callbacks (echo-safety guarantee)
   */
  public speak(
    text: string,
    language: SupportedLanguage,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        callbacks?.onEnd?.();
        resolve();
        return;
      }

      // Stop any previous speech first
      this.stop();

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        const bestVoice = this.findBestVoice(language);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        utterance.lang = language;
        // Natural pleasant rate and pitch
        utterance.rate = language === "en-IN" ? 0.95 : 0.92;
        utterance.pitch = 1.05;

        let finished = false;

        const cleanup = () => {
          if (!finished) {
            finished = true;
            this.isSpeakingInternal = false;
            this.currentUtterance = null;
            callbacks?.onEnd?.();
            resolve();
          }
        };

        utterance.onstart = () => {
          this.isSpeakingInternal = true;
          callbacks?.onStart?.();
        };

        utterance.onend = () => {
          cleanup();
        };

        utterance.onerror = (e) => {
          console.warn("Speech synthesis notice:", e);
          cleanup();
        };

        // Safety fallback timeout to prevent hanging in background tabs (max 12s)
        const estDuration = Math.max(3000, text.length * 90);
        setTimeout(() => {
          if (!finished && this.isSpeakingInternal) {
            cleanup();
          }
        }, estDuration + 2000);

        this.synth.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis invocation error:", err);
        this.isSpeakingInternal = false;
        callbacks?.onError?.(err);
        callbacks?.onEnd?.();
        resolve();
      }
    });
  }

  /**
   * Speak the prompt for a specific conversation step
   */
  public speakStepPrompt(
    step: ConversationStep,
    language: SupportedLanguage,
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): Promise<void> {
    const prompt = STEP_PROMPTS[language]?.[step] || STEP_PROMPTS["en-IN"][step];
    return this.speak(prompt.spokenText, language, callbacks);
  }

  /**
   * Stop all active speech immediately
   */
  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignored
      }
    }
    this.isSpeakingInternal = false;
    this.currentUtterance = null;
  }
}

export const speechSynthManager = new SpeechSynthesisManager();
