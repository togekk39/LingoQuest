package com.lingoquest.offlinetts

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

/** Uses the user's system engine, but never allows a network or missing-data voice. */
class OfflineTtsModule : Module() {
  private val handler = Handler(Looper.getMainLooper())
  private var tts: TextToSpeech? = null
  private var engineName: String? = null
  private var ready = false
  private var generation = 0
  private val waiting = mutableListOf<Pair<Promise, (TextToSpeech) -> Unit>>()
  private val utterances = mutableMapOf<String, Promise>()

  override fun definition() = ModuleDefinition {
    Name("OfflineTts")

    AsyncFunction("getVoices") { promise: Promise ->
      withEngine(promise) { engine ->
        val defaultName = engine.defaultVoice?.name
        promise.resolve(offlineVoices(engine).map { voice ->
          mapOf(
            "identifier" to voice.name,
            "name" to voice.name,
            "language" to voice.locale.toLanguageTag(),
            "isDefault" to (voice.name == defaultName)
          )
        })
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("speak") { text: String, identifier: String?, rate: Double?, promise: Promise ->
      withEngine(promise) { engine ->
        val voices = offlineVoices(engine)
        val voice = if (identifier != null) voices.find { it.name == identifier }
          else voices.find { it.name == engine.defaultVoice?.name }
            ?: voices.find { it.locale.toLanguageTag().equals("en-US", true) }
            ?: voices.firstOrNull()
        if (voice == null || engine.setVoice(voice) != TextToSpeech.SUCCESS) {
          promise.reject("NO_OFFLINE_VOICE", "Install an offline English voice in system TTS settings.", null)
        } else {
          cancelUtterances()
          val systemRate = Settings.Secure.getInt(context().contentResolver, "tts_default_rate", 100) / 100.0
          val speed = (rate ?: systemRate).coerceAtLeast(0.1).toFloat()
          if (engine.setSpeechRate(speed) != TextToSpeech.SUCCESS) {
            promise.reject("TTS_RATE", "Could not set the speech rate.", null)
          } else {
            val id = UUID.randomUUID().toString()
            utterances[id] = promise
            val params = Bundle().apply { putString(TextToSpeech.Engine.KEY_FEATURE_NETWORK_SYNTHESIS, "false") }
            if (engine.speak(text, TextToSpeech.QUEUE_FLUSH, params, id) == TextToSpeech.ERROR) {
              utterances.remove(id)?.reject("TTS_SPEAK", "Could not start offline speech.", null)
            }
          }
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Unit>("stop") {
      // Cancel initialization too, so leaving a screen cannot start delayed speech.
      release()
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Unit>("openSettings") {
      context().startActivity(Intent("com.android.settings.TTS_SETTINGS").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }.runOnQueue(Queues.MAIN)

    // Re-read system engine, language and rate after the user returns from Settings.
    OnActivityEntersForeground { release() }
    OnDestroy { handler.post { release() } }
  }

  private fun context() = appContext.reactContext ?: error("React context unavailable")

  private fun offlineVoices(engine: TextToSpeech): List<Voice> =
    (engine.voices ?: emptySet()).filter {
      it.locale.language == "en" && !it.isNetworkConnectionRequired &&
        !it.features.orEmpty().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)
    }.sortedBy { it.name }

  private fun cancelUtterances() {
    utterances.values.forEach { it.resolve(false) }
    utterances.clear()
    tts?.stop()
  }

  private fun release() {
    generation++
    ready = false
    waiting.forEach { it.first.reject("TTS_CANCELLED", "Speech cancelled.", null) }
    waiting.clear()
    cancelUtterances()
    tts?.shutdown()
    tts = null
  }

  private fun withEngine(promise: Promise, action: (TextToSpeech) -> Unit) {
    try {
      val selectedEngine = Settings.Secure.getString(context().contentResolver, "tts_default_synth")
      if (tts != null && engineName != selectedEngine) release()
      engineName = selectedEngine
      if (ready) {
        action(tts!!)
        return
      }
      waiting.add(promise to action)
      if (tts != null) return
      val ticket = ++generation
      tts = TextToSpeech(context(), { status ->
        handler.post {
          if (ticket != generation) return@post
          val engine = tts
          if (status != TextToSpeech.SUCCESS || engine == null) {
            release()
          } else {
            ready = true
            engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
              override fun onStart(id: String) {}
              override fun onDone(id: String) { handler.post { utterances.remove(id)?.resolve(true) } }
              override fun onStop(id: String, interrupted: Boolean) { handler.post { utterances.remove(id)?.resolve(false) } }
              @Deprecated("Deprecated in Java")
              override fun onError(id: String) { failed(id) }
              override fun onError(id: String, code: Int) { failed(id) }
              private fun failed(id: String) {
                handler.post {
                  utterances.remove(id)?.reject("TTS_PLAYBACK", "Offline speech failed.", null)
                }
              }
            })
            val pending = waiting.toList()
            waiting.clear()
            pending.forEach { (request, run) ->
              try { run(engine) } catch (error: Exception) {
                request.reject("TTS_ERROR", error.message, error)
              }
            }
          }
        }
      }, selectedEngine)
      handler.postDelayed({ if (ticket == generation && !ready) release() }, 5000)
    } catch (error: Exception) {
      release()
      promise.reject("TTS_ERROR", error.message, error)
    }
  }
}
