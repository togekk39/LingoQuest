import { selectOfflineVoice, type OfflineVoice, type SpeechPreferences } from './types';

export async function getOfflineVoices(): Promise<OfflineVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const synth = window.speechSynthesis;
  if (!synth.getVoices().length) {
    // Chromium can populate voices asynchronously on a cold start.
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        synth.removeEventListener('voiceschanged', done);
        resolve();
      };
      const timer = setTimeout(done, 1000);
      synth.addEventListener('voiceschanged', done);
    });
  }
  return synth
    .getVoices()
    .filter((voice) => voice.localService === true && /^en(?:-|$)/i.test(voice.lang))
    .map((voice) => ({
      identifier: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
      isDefault: voice.default,
    }));
}
let cancelPending: (() => void) | undefined;
export async function stopDeviceSpeech() {
  cancelPending?.();
  cancelPending = undefined;
  window.speechSynthesis?.cancel();
}
export async function playDeviceSpeech(
  text: string,
  preferences: SpeechPreferences,
  voices: OfflineVoice[],
  isCurrent: () => boolean,
) {
  if (!isCurrent()) return false;
  const selected = selectOfflineVoice(voices, preferences.voice);
  if (!selected) throw new Error('No offline voice');
  const synth = window.speechSynthesis;
  // Recheck locality at playback; never allow the browser's implicit cloud fallback.
  const voice = synth
    .getVoices()
    .find((item) => item.voiceURI === selected.identifier && item.localService === true);
  if (!voice) throw new Error('Voice unavailable');
  void stopDeviceSpeech();
  return new Promise<boolean>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    if (preferences.rate !== null) utterance.rate = preferences.rate;
    const cancel = () => resolve(false);
    cancelPending = cancel;
    const cleanup = () => {
      if (cancelPending === cancel) cancelPending = undefined;
    };
    utterance.onend = () => {
      cleanup();
      resolve(true);
    };
    utterance.onerror = () => {
      cleanup();
      reject(new Error('Offline speech failed'));
    };
    synth.speak(utterance);
  });
}
export async function openDeviceSpeechSettings() {
  throw new Error('Configura las voces sin conexión en los ajustes de voz de tu dispositivo.');
}
