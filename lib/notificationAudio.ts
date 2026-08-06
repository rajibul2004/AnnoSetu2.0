/**
 * Synthesized Web Audio API sound effects for notifications and alerts.
 * Works natively in all modern browsers without requiring external audio asset files.
 */

let audioCtx: AudioContext | null = null;
let lastPlayedAt = 0;

const SOUND_STORAGE_KEY = "annosetu_chat_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SOUND_STORAGE_KEY);
  return stored !== "false";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
}

export function toggleSoundEnabled(): boolean {
  const current = isSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  return next;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }

    if (audioCtx && audioCtx.state === "suspended") {
      void audioCtx.resume();
    }

    return audioCtx;
  } catch {
    return null;
  }
}

// Automatically prepare audio context on first user interaction to satisfy autoplay policies
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };

  window.addEventListener("click", unlockAudio, { passive: true, once: true });
  window.addEventListener("keydown", unlockAudio, { passive: true, once: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true, once: true });
}

/**
 * Play a pleasant two-tone chime for incoming notifications.
 */
export function playNotificationSound() {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  if (now - lastPlayedAt < 1000) return;
  lastPlayedAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // First Note: F#5 (739.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(739.99, t);

    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.3);

    // Second Note: B5 (987.77 Hz) - cheerful chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, t + 0.09);

    gain2.gain.setValueAtTime(0.0001, t + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.24, t + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(t + 0.09);
    osc2.stop(t + 0.55);
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a subtle soft "pop" sound when user sends a chat message.
 */
export function playMessageSentSound() {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  if (now - lastPlayedAt < 300) return;
  lastPlayedAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.08); // A5

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  } catch {
    // Graceful fallback
  }
}

/**
 * Play a pleasant soft bubble tone for new incoming messages.
 */
export function playMessageReceivedSound() {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  if (now - lastPlayedAt < 600) return;
  lastPlayedAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, t); // E5
    osc.frequency.exponentialRampToValueAtTime(523.25, t + 0.1); // C5

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  } catch {
    // Graceful fallback
  }
}
