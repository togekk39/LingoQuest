export interface OfflineVoice {
  identifier: string;
  name: string;
  language: string;
  isDefault: boolean;
}
export interface SpeechPreferences {
  /** null follows the system's English voice and rate. */
  voice: string | null;
  rate: number | null;
}
export const DEFAULT_SPEECH_PREFERENCES: SpeechPreferences = { voice: null, rate: null };
export function normalizeSpeechPreferences(value: unknown): SpeechPreferences {
  const data = value && typeof value === 'object' ? (value as Partial<SpeechPreferences>) : {};
  return {
    voice: typeof data.voice === 'string' && data.voice.length > 0 ? data.voice : null,
    rate: typeof data.rate === 'number' && [0.75, 1, 1.25].includes(data.rate) ? data.rate : null,
  };
}
export function selectOfflineVoice(voices: OfflineVoice[], identifier: string | null) {
  const englishVoices = voices.filter((voice) => /^en(?:-|$)/i.test(voice.language));
  // A removed user-selected voice requires attention, not a silent voice change.
  return identifier
    ? englishVoices.find((voice) => voice.identifier === identifier)
    : (englishVoices.find((voice) => voice.isDefault) ??
        englishVoices.find((voice) => /^en-US$/i.test(voice.language)) ??
        englishVoices[0]);
}
