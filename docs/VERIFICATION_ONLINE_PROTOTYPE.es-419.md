# Registro de verificación del prototipo en línea

[English](VERIFICATION_ONLINE_PROTOTYPE.md)

Las verificaciones del 2026-11-08 se ejecutaron localmente con Node.js 24, el Chromium del sistema y PostgreSQL 16.

| Verificación                                            | Resultado                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| TypeScript estricto y ESLint                            | Aprobaron.                                                                      |
| Pruebas de integración de la API Fastify y de seguridad | Aprobaron 17.                                                                   |
| Playwright en navegador de escritorio y móvil a 390 px  | Aprobaron 12.                                                                   |
| Migraciones de PostgreSQL y aislamiento con RLS         | Aprobaron con una implementación simulada mínima de Supabase Auth.              |
| Exportación de producción web de Expo                   | Aprobó.                                                                         |
| Exportación del paquete Hermes para Android de Expo     | Aprobó. El APK y las pruebas en dispositivos físicos se verifican por separado. |
| Prettier                                                | Aprobó.                                                                         |

Las pruebas en navegador cubrieron completar una lección con todas las respuestas incorrectas, omitir la práctica oral, conservar el progreso, descargar contenido para usarlo sin conexión, acreditar XP una sola vez al reconectarse, aislar el cambio de cuenta cuando coincide con la sincronización, conservar las colas de otras cuentas al cerrar sesión o borrar datos, arrancar en frío sin conexión, completar 40 ejercicios de pronunciación y 12 preguntas de nivel, realizar la misión del aeropuerto, abrir 13 niveles de desafío, asignar un tiempo independiente a la lectura, conservar el avance al fallar y descontar corazones una sola vez al reenviar una solicitud cuya respuesta se perdió.

Las pruebas del servidor cubrieron los 320 ejercicios y las 32 lecciones, el reloj del servidor, la idempotencia, JWT y aislamiento entre cuentas, 13 niveles, copias privadas del banco de preguntas, borrado y exportación de datos y producción sin pistas en días distintos.

Las pruebas de RLS se ejecutaron en un contenedor desechable de PostgreSQL sin conectarse a Supabase alojado. No se usaron API de pago ni despliegues en la nube. La revisión humana del currículo y los resultados educativos quedaron fuera del alcance de estas pruebas. Consulta las [instrucciones de producción](PRODUCTION_SETUP.md).
