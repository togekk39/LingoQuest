import { useTheme } from '../theme';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { BookOpen, Download, FolderOpen, PackageCheck, RotateCcw } from 'lucide-react-native';
import { Button, Card, Heading, Label, Pill } from '../ui';
import {
  getCoursePackInfo,
  installCoursePackText,
  downloadAndInstallCourse,
  restoreBundledCourse,
} from '../lib/coursePacks';
import { pickTextFile } from '../lib/localFiles';
import courseSource from '../content/course-source.json';
export function ContentManager({
  onRefresh,
  onNotice,
}: {
  onRefresh: () => Promise<void>;
  onNotice: (message: string) => void;
}) {
  const { colors: C, tone } = useTheme();

  const [info, setInfo] = useState<Awaited<ReturnType<typeof getCoursePackInfo>> | null>(null);
  const [url, setUrl] = useState(courseSource.url);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    void getCoursePackInfo()
      .then(setInfo)
      .catch((e) => setError(e.message));
  }, []);
  async function run(work: () => Promise<{ installed: boolean } | null>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await work();
      if (result === null) return;
      setInfo(await getCoursePackInfo());
      await onRefresh();
      const text = result.installed
        ? 'Curso instalado. Tu progreso sigue en este dispositivo.'
        : 'Ya tienes esta versión del curso. Todo está listo para aprender.';
      setMessage(text);
      onNotice(text);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No pudimos instalar el paquete. Tu curso anterior sigue disponible.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }}>
        <BookOpen size={22} color={C.teal} />
        <Heading style={{ fontSize: 22 }}>Contenido sin conexión</Heading>
      </View>
      <Label>
        El curso completo viene incluido. Puedes aprender desde el primer inicio, sin cuenta ni
        conexión. Solo usamos internet cuando tú descargas una actualización de GitHub.
      </Label>
      {info && (
        <View
          style={{
            marginVertical: 18,
            padding: 17,
            borderRadius: 13,
            backgroundColor: tone('#F2F7F0', 'background'),
            gap: 9,
          }}
        >
          <Pill>{info.bundled ? 'INCLUIDO EN LA APP' : 'PAQUETE INSTALADO'}</Pill>
          <Text style={{ fontFamily: 'OutfitMedium', fontSize: 20, color: C.ink }}>
            {info.manifest.titleEs}
          </Text>
          <Label style={{ fontSize: 11 }}>
            Versión {info.manifest.version} · {info.lessons} lecciones · {info.exercises} ejercicios
            · {Math.ceil(info.bytes / 1024)} KB
          </Label>
          <Label style={{ fontSize: 10 }}>
            Formato LQP JSON · es-419 → en-US · Guardado en este dispositivo
          </Label>
          {!!info.recoveryMessage && <Label>{info.recoveryMessage}</Label>}
        </View>
      )}
      <View style={{ gap: 12 }}>
        <Button
          variant="secondary"
          icon={FolderOpen}
          loading={busy}
          onPress={() =>
            void run(async () => {
              const file = await pickTextFile('Importar paquete de curso', 4 * 1024 * 1024);
              return file === null ? null : installCoursePackText(file);
            })
          }
        >
          Importar paquete de curso
        </Button>
        <Label style={{ marginTop: 5, fontSize: 12 }}>
          O pega el enlace del archivo .lqp.json en GitHub Releases
        </Label>
        <TextInput
          accessibilityLabel="URL del paquete de curso"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://github.com/…/releases/download/…/curso.lqp.json"
          placeholderTextColor="#8BA296"
          value={url}
          onChangeText={setUrl}
          editable={!busy}
          style={{
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 11,
            padding: 13,
            minHeight: 48,
            fontFamily: 'Manrope',
            fontSize: 12,
            color: C.ink,
          }}
        />
        <Button
          icon={Download}
          disabled={!url.trim()}
          loading={busy}
          onPress={() => void run(() => downloadAndInstallCourse(url))}
        >
          Descargar e instalar
        </Button>
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{
            fontFamily: 'Manrope',
            fontSize: 12,
            lineHeight: 20,
            color: C.red,
            marginTop: 14,
          }}
        >
          {error}
        </Text>
      )}
      {!!message && (
        <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: C.teal, marginTop: 14 }}>
          {message}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 18 }}>
        <PackageCheck color={C.muted} size={16} />
        <Label style={{ fontSize: 10, flex: 1 }}>
          Comprobamos el formato, la versión y la integridad antes de instalar. Una descarga
          incompleta no reemplaza tu curso actual. El contenido de esta edición espera revisión
          editorial.
        </Label>
      </View>
      {info && !info.bundled && (
        <Button
          variant="ghost"
          icon={RotateCcw}
          disabled={busy}
          onPress={() =>
            void run(async () => {
              await restoreBundledCourse();
              return { installed: true };
            })
          }
        >
          Volver al curso incluido
        </Button>
      )}
    </Card>
  );
}
