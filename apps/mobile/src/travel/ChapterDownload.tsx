import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BookOpen, Download, FolderOpen } from 'lucide-react-native';
import { downloadChapter, getInstalledChapter, importChapterFile } from '../lib/chapterPacks';
import { useTheme } from '../theme';
import { Button, Label } from '../ui';

const installedListeners = new Set<(chapterId: string, revision: number) => void>();
type Transfer = 'download' | 'import';

export function ChapterDownload({
  chapterId,
  onOpen,
}: {
  chapterId: string;
  onOpen: (chapterId: string) => void;
}) {
  const { colors } = useTheme();
  const [revision, setRevision] = useState<number | null>();
  const [busy, setBusy] = useState<Transfer>();
  const [error, setError] = useState<{ method: Transfer; message: string }>();
  const [message, setMessage] = useState('');

  useEffect(() => {
    let current = true;
    setRevision(undefined);
    setError(undefined);
    setMessage('');
    const installedHere = (id: string, nextRevision: number) => {
      if (id === chapterId) setRevision((current) => Math.max(current ?? 0, nextRevision));
    };
    installedListeners.add(installedHere);
    void getInstalledChapter(chapterId).then(
      (pack) => {
        if (current) setRevision((value) => value ?? pack?.revision ?? null);
      },
      () => {
        if (current) {
          setRevision((value) => value ?? null);
          setError({
            method: 'download',
            message:
              'No pudimos abrir la descarga anterior. Puedes descargar el capítulo de nuevo.',
          });
        }
      },
    );
    return () => {
      current = false;
      installedListeners.delete(installedHere);
    };
  }, [chapterId]);

  async function save(method: Transfer) {
    setBusy(method);
    setError(undefined);
    setMessage('');
    try {
      const saved = await (method === 'download'
        ? downloadChapter(chapterId)
        : importChapterFile(chapterId));
      if (saved) {
        for (const listener of installedListeners) listener(chapterId, saved.revision);
        if (revision != null && saved.revision !== revision) setMessage('Capítulo actualizado.');
        else if (revision != null)
          setMessage(
            method === 'download' ? 'Ya tienes la última versión.' : 'Ya tienes esta versión.',
          );
      }
    } catch (failure) {
      setError({
        method,
        message:
          failure instanceof Error
            ? failure.message
            : 'No pudimos guardar el capítulo. Inténtalo de nuevo.',
      });
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <View testID={`chapter-package-${chapterId}`} style={{ gap: 6 }}>
      {revision != null ? (
        <>
          <Text accessibilityLiveRegion="polite" style={{ color: colors.teal }}>
            Disponible sin conexión
          </Text>
          <Label>Versión {revision}</Label>
          <Button variant="secondary" icon={BookOpen} onPress={() => onOpen(chapterId)}>
            Abrir capítulo descargado
          </Button>
        </>
      ) : (
        <Label>Lecciones, imágenes y audio</Label>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={{ color: colors.red }}>
          {error.message}
        </Text>
      )}
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.teal }}>
          {message}
        </Text>
      )}
      {!!busy && (
        <Text accessibilityLiveRegion="polite" style={{ color: colors.teal }}>
          {busy === 'import'
            ? 'Importando capítulo…'
            : revision != null
              ? 'Buscando actualización…'
              : 'Descargando capítulo…'}
        </Text>
      )}
      <Button
        variant={revision != null ? 'ghost' : 'secondary'}
        icon={Download}
        loading={busy === 'download'}
        disabled={revision === undefined || busy === 'import'}
        onPress={() => void save('download')}
      >
        {revision != null
          ? 'Buscar actualización'
          : error?.method === 'download'
            ? 'Reintentar descarga'
            : 'Descargar capítulo'}
      </Button>
      <Button
        variant="ghost"
        icon={FolderOpen}
        loading={busy === 'import'}
        disabled={revision === undefined || busy === 'download'}
        onPress={() => void save('import')}
      >
        {error?.method === 'import' ? 'Reintentar importación' : 'Importar archivo del capítulo'}
      </Button>
    </View>
  );
}
