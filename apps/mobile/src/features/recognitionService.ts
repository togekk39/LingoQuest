export interface AndroidRecognitionServices {
  getDefaultRecognitionService(): { packageName: string };
  getSpeechRecognitionServices(): string[];
}
// Respect the selected provider, including third-party STT. Never silently select Google.
export function selectedRecognitionService(services: AndroidRecognitionServices): string {
  const selected = services.getDefaultRecognitionService().packageName;
  if (!selected || !services.getSpeechRecognitionServices().includes(selected)) {
    throw new Error('service-unavailable');
  }
  return selected;
}
