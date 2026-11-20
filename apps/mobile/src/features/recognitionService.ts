export const recognitionLocale = 'en-US';
const marmaladePackage = 'app.marmalade.stt';

interface AndroidOnDeviceRecognition {
  supportsOnDeviceRecognition(): boolean;
  getSupportedLocales(options: {
    androidRecognitionServicePackage?: string;
  }): Promise<{ installedLocales: string[] }>;
}

const localeTag = (locale: string) => locale.replace(/_/g, '-').toLowerCase();

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
  if (!installedLocales.some((locale) => localeTag(locale) === 'en-us')) {
    throw new Error('on-device-language-unavailable');
  }
  return { lang: recognitionLocale, requiresOnDeviceRecognition: true };
}

export interface AndroidRecognitionServices {
  getDefaultRecognitionService(): { packageName: string };
  getSpeechRecognitionServices(): string[];
}

export function hasMarmaladeRecognition(
  platform: string,
  version: number | string,
  service: Pick<AndroidRecognitionServices, 'getSpeechRecognitionServices'>,
) {
  return (
    platform === 'android' &&
    Number(version) >= 28 &&
    service.getSpeechRecognitionServices().includes(marmaladePackage)
  );
}

export async function marmaladeRecognitionOptions(
  platform: string,
  version: number | string,
  service: Pick<AndroidRecognitionServices, 'getSpeechRecognitionServices'> &
    Pick<AndroidOnDeviceRecognition, 'getSupportedLocales'>,
) {
  if (!hasMarmaladeRecognition(platform, version, service)) {
    throw new Error('marmalade-service-unavailable');
  }

  if (Number(version) >= 33) {
    const { installedLocales } = await service.getSupportedLocales({
      androidRecognitionServicePackage: marmaladePackage,
    });
    if (!installedLocales.some((locale) => ['en', 'en-us'].includes(localeTag(locale)))) {
      throw new Error('marmalade-language-unavailable');
    }
  }

  // Passing requiresOnDeviceRecognition would make Expo ignore the named provider on API 33+.
  // En la API 33 o posterior, requiresOnDeviceRecognition haría que Expo ignore el proveedor elegido.
  return {
    lang: recognitionLocale,
    androidRecognitionServicePackage: marmaladePackage,
    androidIntentOptions: { EXTRA_PREFER_OFFLINE: true },
  };
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
