package com.lingoquest.offlinetts

import android.speech.tts.TextToSpeech
import android.speech.tts.Voice

internal fun Voice.isOfflineEnglish(): Boolean =
  locale.language == "en" && !isNetworkConnectionRequired &&
    !features.orEmpty().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)

/** Pin both language and voice on every utterance, independent of the app/system locale. */
internal fun configureEnglishVoice(engine: TextToSpeech, voice: Voice): Boolean {
  if (!voice.isOfflineEnglish()) return false
  // setLanguage may reset the voice, so it must precede setVoice. Retain the
  // selected English dialect rather than relying on the engine's default locale.
  if (engine.setLanguage(voice.locale) < TextToSpeech.LANG_AVAILABLE) return false
  if (engine.setVoice(voice) != TextToSpeech.SUCCESS) return false
  // Some engines report success but keep a fallback voice. Do not speak through it.
  val applied = engine.voice ?: return false
  return applied.name == voice.name && applied.isOfflineEnglish()
}
