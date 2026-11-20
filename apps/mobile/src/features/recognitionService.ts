export function systemRecognitionOptions(platform: string) {
  // Leave the component unset so Android resolves the current system service for each attempt.
  // Deja el componente sin especificar para que Android elija el servicio del sistema en cada intento.
  return {
    lang: 'en-US',
    ...(platform === 'android' && { androidIntentOptions: { EXTRA_PREFER_OFFLINE: true } }),
  };
}
