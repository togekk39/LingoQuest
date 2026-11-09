package com.lingoquest.offlinetts

import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.mockito.Mockito.*
import java.util.Locale

class EnglishVoiceTest {
  private val engine = mock(TextToSpeech::class.java)

  private fun voice(name: String, locale: Locale, network: Boolean = false, missing: Boolean = false): Voice {
    val voice = mock(Voice::class.java)
    `when`(voice.name).thenReturn(name)
    `when`(voice.locale).thenReturn(locale)
    `when`(voice.isNetworkConnectionRequired).thenReturn(network)
    `when`(voice.features).thenReturn(if (missing) setOf(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) else emptySet())
    return voice
  }

  @Test fun pinsEnglishLanguageBeforeVoiceEvenWithSpanishDefaultsOnEveryPlayback() {
    val english = voice("english-uk", Locale.UK)
    val spanish = voice("spanish", Locale.forLanguageTag("es-MX"))
    `when`(engine.setLanguage(Locale.UK)).thenAnswer {
      // Model an engine whose setLanguage resets its previously selected voice.
      `when`(engine.voice).thenReturn(spanish)
      TextToSpeech.LANG_COUNTRY_AVAILABLE
    }
    `when`(engine.setVoice(english)).thenAnswer {
      `when`(engine.voice).thenReturn(english)
      TextToSpeech.SUCCESS
    }

    val previousLocale = Locale.getDefault()
    try {
      Locale.setDefault(Locale.forLanguageTag("es-MX"))
      repeat(2) { assertTrue(configureEnglishVoice(engine, english)) }
    } finally {
      Locale.setDefault(previousLocale)
    }
    val order = inOrder(engine)
    repeat(2) {
      order.verify(engine).setLanguage(Locale.UK)
      order.verify(engine).setVoice(english)
      order.verify(engine).voice
    }
  }

  @Test fun rejectsNonEnglishNetworkAndMissingVoicesBeforeConfiguringEngine() {
    listOf(
      voice("spanish", Locale.forLanguageTag("es-MX")),
      voice("network", Locale.US, network = true),
      voice("missing", Locale.US, missing = true)
    ).forEach { assertFalse(configureEnglishVoice(engine, it)) }
    verifyNoInteractions(engine)
  }

  @Test fun rejectsUnsupportedOrMissingEnglishLanguage() {
    val english = voice("english", Locale.US)
    listOf(TextToSpeech.LANG_NOT_SUPPORTED, TextToSpeech.LANG_MISSING_DATA).forEach { status ->
      `when`(engine.setLanguage(Locale.US)).thenReturn(status)
      assertFalse(configureEnglishVoice(engine, english))
    }
    verify(engine, never()).setVoice(any())
  }

  @Test fun rejectsVoiceConfigurationFailure() {
    val english = voice("english", Locale.US)
    `when`(engine.setLanguage(Locale.US)).thenReturn(TextToSpeech.LANG_AVAILABLE)
    `when`(engine.setVoice(english)).thenReturn(TextToSpeech.ERROR)
    assertFalse(configureEnglishVoice(engine, english))
  }

  @Test fun rejectsSilentFallbackOrUnavailableAppliedVoice() {
    val english = voice("english", Locale.US)
    `when`(engine.setLanguage(Locale.US)).thenReturn(TextToSpeech.LANG_AVAILABLE)
    `when`(engine.setVoice(english)).thenReturn(TextToSpeech.SUCCESS)
    listOf(
      null,
      voice("spanish", Locale.forLanguageTag("es-MX")),
      voice("english", Locale.forLanguageTag("es-MX")),
      voice("different-english", Locale.US),
      voice("english", Locale.US, network = true),
      voice("english", Locale.US, missing = true)
    ).forEach {
      `when`(engine.voice).thenReturn(it)
      assertFalse(configureEnglishVoice(engine, english))
    }
  }
}
