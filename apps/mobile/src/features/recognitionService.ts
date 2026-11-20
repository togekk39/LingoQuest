export const recognitionLocale = 'en-US';

interface AndroidOnDeviceRecognition {
  supportsOnDeviceRecognition(): boolean;
  getSupportedLocales(options: Record<string, never>): Promise<{ installedLocales: string[] }>;
}

export function canCheckOnDeviceRecognition(platform: string, version: number | string): boolean {
  // Expo uses Android's dedicated recognizer starting at API 33.
  // Expo usa el reconocedor dedicado de Android a partir de la API 33.
  return platform === 'android' && Number(version) >= 33;
}

export async function onDeviceRecognitionOptions(
  platform: string,
  version: number | string,
  service: AndroidOnDeviceRecognition,
) {
  if (!canCheckOnDeviceRecognition(platform, version) || !service.supportsOnDeviceRecognition()) {
    throw new Error('on-device-unavailable');
  }

  const { installedLocales } = await service.getSupportedLocales({});
  if (!installedLocales.some((locale) => locale.replace(/_/g, '-').toLowerCase() === 'en-us')) {
    throw new Error('on-device-language-unavailable');
  }
  return { lang: recognitionLocale, requiresOnDeviceRecognition: true };
}

export interface AndroidRecognitionServices {
  getDefaultRecognitionService(): { packageName: string };
  getSpeechRecognitionServices(): string[];
}
// Use the selected system provider, including third-party STT.
// Usa el proveedor seleccionado en el sistema, incluidos los de terceros.
export function selectedRecognitionService(services: AndroidRecognitionServices): string {
  const selected = services.getDefaultRecognitionService().packageName;
  if (!selected || !services.getSpeechRecognitionServices().includes(selected)) {
    throw new Error('service-unavailable');
  }
  return selected;
}
