export const homeCountries = {
  AR: 'Argentina',
  BO: 'Bolivia',
  BR: 'Brasil',
  CL: 'Chile',
  CO: 'Colombia',
  CR: 'Costa Rica',
  CU: 'Cuba',
  DO: 'República Dominicana',
  EC: 'Ecuador',
  SV: 'El Salvador',
  GT: 'Guatemala',
  HT: 'Haití',
  HN: 'Honduras',
  MX: 'México',
  NI: 'Nicaragua',
  PA: 'Panamá',
  PY: 'Paraguay',
  PE: 'Perú',
  PR: 'Puerto Rico',
  UY: 'Uruguay',
  VE: 'Venezuela',
  BZ: 'Belice',
  GY: 'Guyana',
  SR: 'Surinam',
  JM: 'Jamaica',
  TT: 'Trinidad y Tobago',
  OTHER: 'Otro lugar',
} as const;
export type HomeCountry = keyof typeof homeCountries;

export type Continent =
  'América del Norte' | 'América del Sur' | 'Europa' | 'África' | 'Asia' | 'Oceanía' | 'Antártida';

export interface Destination {
  id: string;
  name: string;
  location: string;
  continent: Continent;
  description: string;
  goals: string[];
  band: 'Desde cero' | 'A1' | 'A2' | 'B1' | 'B2';
  position: [longitude: number, latitude: number];
  unitId?: string;
  storyPublished?: true;
}

export const homeChapterDetails = {
  id: 'home',
  title: 'La primera postal',
  stamp: 'Primer encuentro',
  postcard: 'Una postal para el camino',
  message:
    'Hoy di indicaciones en inglés en mi propio barrio. A veces un viaje empieza cuando te animas a hablar con alguien.',
  collectible: 'La postal de Sam',
};

export const salvadorLisbonHandoff = {
  destinationId: 'chile',
  postcardId: 'salvador-valparaiso-postcard',
  name: 'Postal para Lisboa',
  description: 'Bia te invita a cruzar el Atlántico y continuar el viaje en Lisboa, Portugal.',
  goal: 'Recoge la postal para Lisboa.',
  hotspot: 'Ver la postal para Lisboa',
  dialogue:
    'Junto a las fotos, Bia deja una postal para Lisboa. «En Portugal también se habla portugués. Una amiga nos invita a conocer su barrio al otro lado del Atlántico».',
  choice: 'Guardar la postal para Lisboa',
  message:
    'En Salvador usamos inglés para ponernos de acuerdo. La postal de Bia nos invita a cruzar el Atlántico y encontrarnos con su amiga en Lisboa, Portugal.',
};

export const routeCardRevisions: Readonly<
  Record<string, { revision: number; previousName: string }>
> = {
  chile: { revision: 19, previousName: 'Valparaíso' },
  'new-york': { revision: 19, previousName: 'Nueva York' },
  rome: { revision: 19, previousName: 'Roma' },
  australia: { revision: 19, previousName: 'Hobart' },
};

export function routeCardUpdate(chapterId: string) {
  return Object.hasOwn(routeCardRevisions, chapterId) ? routeCardRevisions[chapterId] : undefined;
}

export const route: Destination[] = [
  {
    id: homeChapterDetails.id,
    name: 'Mi lugar de origen',
    location: 'Latinoamérica y el Caribe',
    continent: 'América del Norte',
    description:
      'Un viajero llega a la plaza buscando la parada del bus. Si lo ayudas, tal vez termines planeando tu propio viaje.',
    goals: ['Presentarte', 'Dar indicaciones', 'Identificar un objeto perdido'],
    band: 'Desde cero',
    position: [-88, 15],
    unitId: 'u01',
  },
  {
    id: 'mexico',
    name: 'Ciudad de México',
    location: 'México',
    continent: 'América del Norte',
    description: 'Comparte la vida del barrio con una visitante que se queda una semana.',
    goals: ['Describir rutinas', 'Decir la hora'],
    band: 'A1',
    position: [-99, 19],
    unitId: 'u02',
    storyPublished: true,
  },
  {
    id: 'colombia',
    name: 'Cartagena',
    location: 'Colombia',
    continent: 'América del Sur',
    description: 'Recorre el mercado con Sam y Luz, compara los precios y pidan algo para comer.',
    goals: [
      'Hablar de gustos y cantidades',
      'Leer un menú y sus precios',
      'Pedir y confirmar un plato',
    ],
    band: 'A1',
    position: [-76, 10],
    unitId: 'u03',
    storyPublished: true,
  },
  {
    id: 'peru',
    name: 'Cusco',
    location: 'Perú',
    continent: 'América del Sur',
    description: 'Una viajera quiere reconstruir lo que pasó durante una salida al mercado.',
    goals: ['Contar hechos pasados', 'Hacer preguntas sobre ayer'],
    band: 'A1',
    position: [-72, -13],
    unitId: 'u04',
    storyPublished: true,
  },
  {
    id: 'brazil',
    name: 'Salvador',
    location: 'Brasil',
    continent: 'América del Sur',
    description: 'Coordina un almuerzo con visitantes que usan el inglés como idioma común.',
    goals: ['Describir qué está pasando', 'Coordinar tareas'],
    band: 'A1',
    position: [-38, -13],
    unitId: 'u05',
    storyPublished: true,
  },
  {
    id: salvadorLisbonHandoff.destinationId,
    name: 'Lisboa',
    location: 'Portugal',
    continent: 'Europa',
    description:
      'Cruza el Atlántico desde Salvador para tomar un tranvía hacia Belém. Si cambia el tiempo, acuerda otro punto de encuentro.',
    goals: ['Planear un encuentro', 'Ofrecer ayuda', 'Confirmar un plan alternativo'],
    band: 'A2',
    position: [-9.1393, 38.7223],
    unitId: 'u06',
  },
  {
    id: 'miami',
    name: 'Miami',
    location: 'Estados Unidos',
    continent: 'América del Norte',
    description:
      'Cruza la ciudad para un encuentro de viajeros y conversa sobre lo que ya conoces.',
    goals: ['Hablar de experiencias', 'Revisar preparativos'],
    band: 'A2',
    position: [-80, 26],
    unitId: 'u07',
  },
  {
    id: 'new-york',
    name: 'Hong Kong',
    location: 'Región administrativa especial de China',
    continent: 'Asia',
    description:
      'Pregunta qué necesita cada viajero y compara cómo cruzar el puerto Victoria en metro o ferry.',
    goals: ['Comparar rutas', 'Preguntar por las necesidades del grupo', 'Justificar una elección'],
    band: 'A2',
    position: [114.1694, 22.3193],
    unitId: 'u08',
  },
  {
    id: 'toronto',
    name: 'Toronto',
    location: 'Canadá',
    continent: 'América del Norte',
    description: 'Organiza una visita a un centro comunitario.',
    goals: ['Inscribirte en una actividad', 'Deletrear tu apellido', 'Confirmar requisitos'],
    band: 'A2',
    position: [-79, 44],
  },
  {
    id: 'london',
    name: 'Londres',
    location: 'Reino Unido',
    continent: 'Europa',
    description: 'Decide cómo llegar a una entrevista cuando cambia el servicio de transporte.',
    goals: ['Interpretar avisos', 'Confirmar una alternativa'],
    band: 'B1',
    position: [-0.1, 52],
  },
  {
    id: 'paris',
    name: 'París',
    location: 'Francia',
    continent: 'Europa',
    description: 'Una visita internacional al museo reúne a personas que se comunican en inglés.',
    goals: ['Dar tu opinión', 'Recomendar una visita'],
    band: 'B1',
    position: [2, 49],
  },
  {
    id: 'rome',
    name: 'Estambul',
    location: 'Türkiye',
    continent: 'Europa',
    description:
      'Después de cruzar el Bósforo, aclara una reserva con recepción y confirma por escrito el nuevo acuerdo.',
    goals: ['Describir un problema', 'Negociar una solución', 'Confirmar el acuerdo por escrito'],
    band: 'B1',
    position: [28.9784, 41.0082],
  },
  {
    id: 'cairo',
    name: 'El Cairo',
    location: 'Egipto',
    continent: 'África',
    description: 'Una guía local adapta una visita internacional al clima y al horario del grupo.',
    goals: ['Aclarar condiciones', 'Transmitir instrucciones'],
    band: 'B1',
    position: [31, 30],
  },
  {
    id: 'singapore',
    name: 'Singapur',
    location: 'Singapur',
    continent: 'Asia',
    description: 'Acompaña a un amigo a una consulta y ayuda a explicar los síntomas.',
    goals: ['Describir síntomas', 'Confirmar indicaciones'],
    band: 'B1',
    position: [104, 1],
  },
  {
    id: 'tokyo',
    name: 'Tokio',
    location: 'Japón',
    continent: 'Asia',
    description:
      'Participa en una actividad internacional de fotografía y solicita permiso antes de tomar fotos.',
    goals: ['Pedir permiso con tacto', 'Explicar preferencias'],
    band: 'B1',
    position: [140, 36],
  },
  {
    id: 'australia',
    name: 'Sídney',
    location: 'Australia',
    continent: 'Oceanía',
    description:
      'Contrasta un pronóstico y un aviso de la costa de Bondi. Escucha al equipo y decide si conviene cambiar la caminata por un paseo en el puerto.',
    goals: [
      'Comparar fuentes',
      'Sopesar riesgos y puntos de vista',
      'Justificar una recomendación',
    ],
    band: 'B2',
    position: [151.2093, -33.8688],
  },
  {
    id: 'new-zealand',
    name: 'Wellington',
    location: 'Nueva Zelanda',
    continent: 'Oceanía',
    description: 'Colabora en una actividad abierta de conservación y comparte lo que observaste.',
    goals: ['Resumir observaciones', 'Proponer mejoras'],
    band: 'B2',
    position: [175, -41],
  },
  {
    id: 'kenya',
    name: 'Nairobi',
    location: 'Kenia',
    continent: 'África',
    description: 'Trabaja con un equipo internacional para preparar una jornada comunitaria.',
    goals: ['Distribuir responsabilidades', 'Llegar a acuerdos'],
    band: 'B2',
    position: [37, -1],
  },
  {
    id: 'south-africa',
    name: 'Ciudad del Cabo',
    location: 'Sudáfrica',
    continent: 'África',
    description:
      'Compara testimonios y prepara una historia para compartir con tus compañeros de viaje.',
    goals: ['Distinguir hechos y opiniones', 'Sintetizar fuentes'],
    band: 'B2',
    position: [18, -34],
  },
  {
    id: 'antarctica',
    name: 'Antártida',
    location: 'Desde Ushuaia, Argentina',
    continent: 'Antártida',
    description:
      'Desde Ushuaia, te unes a una expedición. En la Antártida, compartes lo aprendido y acuerdas cómo cuidar el entorno con el equipo.',
    goals: ['Interpretar un protocolo', 'Presentar un informe de viaje'],
    band: 'B2',
    position: [-62, -70],
  },
];
