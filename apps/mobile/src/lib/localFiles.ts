import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';

export async function pickTextFile(
  label: string,
  maxBytes = 8 * 1024 * 1024,
): Promise<string | null> {
  if (Platform.OS === 'web')
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.setAttribute('aria-label', label);
      input.style.display = 'none';
      document.body.appendChild(input);
      const cleanup = () => input.remove();
      input.oncancel = () => {
        cleanup();
        resolve(null);
      };
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          resolve(null);
          return;
        }
        if (file.size > maxBytes) {
          cleanup();
          reject(new Error('El archivo es demasiado grande.'));
          return;
        }
        void file
          .text()
          .then((text) => {
            cleanup();
            resolve(text);
          })
          .catch((error) => {
            cleanup();
            reject(error);
          });
      };
      input.click();
    });
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'application/octet-stream', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const picked = result.assets[0];
  const file = new File(picked.uri);
  try {
    if ((picked.size ?? file.size ?? 0) > maxBytes)
      throw new Error('El archivo es demasiado grande.');
    return await file.text();
  } finally {
    try {
      if (file.exists) file.delete();
    } catch {
      /* Picker cache cleanup is best effort. */
    }
  }
}
export async function saveTextFile(filename: string, text: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const directory = new Directory(Paths.cache, 'exports');
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, filename);
  file.write(text);
  try {
    if (!(await Sharing.isAvailableAsync()))
      throw new Error('No pudimos abrir el menú para guardar tu respaldo en este dispositivo.');
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Guardar respaldo de LingoQuest',
    });
  } finally {
    try {
      if (file.exists) file.delete();
    } catch {
      /* No personal exports retained in cache. */
    }
  }
}
