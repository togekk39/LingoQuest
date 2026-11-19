import { route, type Destination } from './travel-route';

export const learningSkills = {
  vocabulary: 'Vocabulario',
  grammar: 'Gramática',
  listening: 'Comprensión oral',
  reading: 'Comprensión lectora',
  writing: 'Escritura',
  speaking: 'Conversación y pronunciación',
} as const;

export type CurriculumSkill = keyof typeof learningSkills;

interface ConceptDefinition {
  labelEs: string;
  prerequisiteIds: readonly string[];
}

export const travelConcepts = {
  greeting: { labelEs: 'Saludos básicos', prerequisiteIds: [] },
  introduction: { labelEs: 'Presentación con I am y My name is', prerequisiteIds: ['greeting'] },
  'place-question': { labelEs: 'Preguntas con Where is', prerequisiteIds: [] },
  'place-location': {
    labelEs: 'Ubicación con It is y next to',
    prerequisiteIds: ['place-question'],
  },
  'item-ownership': { labelEs: 'Pertenencia con my', prerequisiteIds: ['introduction'] },
  'item-color': {
    labelEs: 'Descripción de un objeto con is y un color',
    prerequisiteIds: ['place-location'],
  },
  'routine-time': { labelEs: 'Horas y momentos del día', prerequisiteIds: [] },
  'routine-verbs': {
    labelEs: 'Rutinas y tercera persona del presente',
    prerequisiteIds: ['introduction', 'routine-time'],
  },
  'food-quantity': {
    labelEs: 'Cantidades, artículos y alimentos',
    prerequisiteIds: ['item-ownership'],
  },
  'requests-preferences': {
    labelEs: 'Pedidos y preferencias',
    prerequisiteIds: ['food-quantity', 'routine-verbs'],
  },
  'past-events': { labelEs: 'Hechos con pasado simple', prerequisiteIds: ['routine-verbs'] },
  'past-questions': {
    labelEs: 'Preguntas y negativas con did',
    prerequisiteIds: ['past-events', 'place-question'],
  },
  'present-actions': {
    labelEs: 'Acciones en curso con be + -ing',
    prerequisiteIds: ['routine-verbs', 'item-color'],
  },
  'task-order': {
    labelEs: 'Secuencia e instrucciones para un grupo',
    prerequisiteIds: ['present-actions', 'past-events'],
  },
  'future-plans': {
    labelEs: 'Planes con be going to',
    prerequisiteIds: ['present-actions', 'routine-time'],
  },
  'offers-and-decisions': {
    labelEs: 'Ofertas y decisiones con will',
    prerequisiteIds: ['requests-preferences', 'future-plans'],
  },
  'life-experiences': {
    labelEs: 'Experiencias con have + participio',
    prerequisiteIds: ['past-events', 'past-questions'],
  },
  'completed-preparations': {
    labelEs: 'Preparativos con already, yet y just',
    prerequisiteIds: ['life-experiences', 'future-plans'],
  },
  'option-comparison': {
    labelEs: 'Comparativos y superlativos',
    prerequisiteIds: ['item-color', 'routine-verbs'],
  },
  'reasons-and-results': {
    labelEs: 'Motivos y resultados con because y so',
    prerequisiteIds: ['option-comparison'],
  },
  requirements: {
    labelEs: 'Reglas y requisitos con have to y can',
    prerequisiteIds: ['requests-preferences', 'future-plans'],
  },
  'form-confirmation': {
    labelEs: 'Datos de inscripción y confirmación',
    prerequisiteIds: ['introduction', 'requirements'],
  },
  'transport-announcements': {
    labelEs: 'Idea principal y detalles de un aviso',
    prerequisiteIds: ['place-location', 'routine-time', 'task-order'],
  },
  'contingency-plans': {
    labelEs: 'Planes alternativos con if y when',
    prerequisiteIds: ['future-plans', 'transport-announcements'],
  },
  recommendations: {
    labelEs: 'Opiniones y recomendaciones con razones',
    prerequisiteIds: ['option-comparison', 'reasons-and-results'],
  },
  'relative-descriptions': {
    labelEs: 'Descripción con who, which y that',
    prerequisiteIds: ['item-color', 'recommendations'],
  },
  'problem-narrative': {
    labelEs: 'Problemas y contexto con dos tiempos pasados',
    prerequisiteIds: ['past-events', 'present-actions'],
  },
  'negotiated-repair': {
    labelEs: 'Reclamos y acuerdos con cortesía',
    prerequisiteIds: ['requests-preferences', 'problem-narrative', 'contingency-plans'],
  },
  'condition-and-limits': {
    labelEs: 'Condiciones, excepciones y límites',
    prerequisiteIds: ['requirements', 'contingency-plans'],
  },
  'instruction-relay': {
    labelEs: 'Transmitir instrucciones',
    prerequisiteIds: ['task-order', 'condition-and-limits'],
  },
  'ongoing-symptoms': {
    labelEs: 'Duración de síntomas con for y since',
    prerequisiteIds: ['life-experiences', 'problem-narrative'],
  },
  'confirm-understanding': {
    labelEs: 'Paráfrasis y preguntas de verificación',
    prerequisiteIds: ['instruction-relay', 'ongoing-symptoms'],
  },
  'permission-register': {
    labelEs: 'Permiso y registro con can, could y may',
    prerequisiteIds: ['requirements', 'negotiated-repair'],
  },
  'hypothetical-preference': {
    labelEs: 'Preferencias y situaciones hipotéticas con would',
    prerequisiteIds: ['recommendations', 'permission-register', 'contingency-plans'],
  },
  'weather-uncertainty': {
    labelEs: 'Incertidumbre y probabilidad en pronósticos',
    prerequisiteIds: ['transport-announcements', 'condition-and-limits'],
  },
  'risk-tradeoffs': {
    labelEs: 'Alternativas y concesión con although y even if',
    prerequisiteIds: ['weather-uncertainty', 'hypothetical-preference'],
  },
  'observation-summary': {
    labelEs: 'Observaciones, estilo indirecto y resumen',
    prerequisiteIds: ['instruction-relay', 'relative-descriptions'],
  },
  'qualified-proposals': {
    labelEs: 'Propuestas matizadas con evidencia',
    prerequisiteIds: ['risk-tradeoffs', 'observation-summary'],
  },
  'role-negotiation': {
    labelEs: 'Distribución de roles y negociación',
    prerequisiteIds: ['qualified-proposals', 'permission-register'],
  },
  'decision-summary': {
    labelEs: 'Acuerdos, plazos y próximos pasos',
    prerequisiteIds: ['role-negotiation', 'form-confirmation'],
  },
  'source-evaluation': {
    labelEs: 'Hechos, opiniones, atribución y confianza',
    prerequisiteIds: ['observation-summary', 'weather-uncertainty'],
  },
  'source-synthesis': {
    labelEs: 'Síntesis de fuentes y contraste',
    prerequisiteIds: ['source-evaluation', 'qualified-proposals'],
  },
  'protocol-reading': {
    labelEs: 'Protocolos, obligaciones y excepciones',
    prerequisiteIds: ['condition-and-limits', 'risk-tradeoffs', 'decision-summary'],
  },
  'expedition-report': {
    labelEs: 'Informe oral y escrito con seguimiento',
    prerequisiteIds: ['protocol-reading', 'source-synthesis', 'confirm-understanding'],
  },
} as const satisfies Record<string, ConceptDefinition>;

export type TravelConceptId = keyof typeof travelConcepts;

interface CurriculumStageContent {
  objectives: Record<CurriculumSkill, string>;
  introduces: readonly TravelConceptId[];
  revisits: readonly TravelConceptId[];
  transferEs: string;
}

export interface TravelCurriculumStage extends CurriculumStageContent {
  destinationId: string;
  band: Destination['band'];
}

const stages: Record<string, CurriculumStageContent> = {
  home: {
    objectives: {
      vocabulary: 'Recuperar saludos, colores y palabras para lugares y objetos cercanos.',
      grammar: 'Formar presentaciones, preguntas Where is y descripciones breves con sujeto + be.',
      listening: 'Identificar qué lugar pide una viajera y anotar una indicación corta.',
      reading: 'Encontrar el nombre o el color relevante en un mensaje de objetos perdidos.',
      writing: 'Responder a una tarjeta de bienvenida y confirmar qué objeto encontraste.',
      speaking: 'Imitar una presentación y ensayar con tu nombre antes de escuchar tu grabación.',
    },
    introduces: [
      'greeting',
      'introduction',
      'place-question',
      'place-location',
      'item-ownership',
      'item-color',
    ],
    revisits: [],
    transferEs:
      'Registrarte para una foto, indicar otro punto en el croquis y devolver un objeto distinto.',
  },
  mexico: {
    objectives: {
      vocabulary: 'Recuperar verbos de rutina y expresiones de hora y frecuencia.',
      grammar:
        'Usar presente simple con I y he/she; conservar el sujeto y agregar -s cuando corresponde.',
      listening: 'Distinguir dos horarios y quién realiza cada actividad.',
      reading: 'Localizar una hora y una actividad en una agenda del barrio.',
      writing: 'Enviar un itinerario breve sobre tu rutina y la de una anfitriona.',
      speaking: 'Describir una rutina y acentuar la hora que necesitas confirmar.',
    },
    introduces: ['routine-time', 'routine-verbs'],
    revisits: ['introduction', 'place-location'],
    transferEs: 'Ayudar a alguien que acaba de llegar a elegir otro horario para el mercado.',
  },
  colombia: {
    objectives: {
      vocabulary: 'Identificar alimentos, bebidas, porciones y precios.',
      grammar: 'Usar a/an, some y la cantidad adecuada; alternar I like y I’d like.',
      listening: 'Reconocer qué pidió cada persona y cuántas porciones.',
      reading: 'Cruzar dos gustos con ingredientes y precios de un menú.',
      writing: 'Enviar un pedido breve con una sustitución y la cantidad.',
      speaking: 'Pedir y confirmar un plato; acentuar la cantidad o el ingrediente.',
    },
    introduces: ['food-quantity', 'requests-preferences'],
    revisits: ['item-ownership', 'routine-verbs', 'greeting'],
    transferEs: 'Pedir una opción para llevar con otra cantidad cuando un ingrediente se acaba.',
  },
  peru: {
    objectives: {
      vocabulary: 'Recuperar verbos de salida y expresiones como yesterday y last night.',
      grammar: 'Construir afirmativas, negativas y preguntas de pasado simple con did.',
      listening: 'Ordenar dos hechos narrados e identificar cuál sucedió primero.',
      reading: 'Extraer quién, cuándo y dónde de un mensaje sobre la salida.',
      writing: 'Redactar una nota de tres hechos y preguntar por un dato ausente.',
      speaking: 'Explicar qué pasó; distinguir terminaciones de pasado con modelos de audio.',
    },
    introduces: ['past-events', 'past-questions'],
    revisits: ['routine-time', 'place-question', 'item-color'],
    transferEs: 'Reconstruir una visita a una feria a partir de dos recuerdos diferentes.',
  },
  brazil: {
    objectives: {
      vocabulary: 'Nombrar tareas de cocina, objetos y conectores de secuencia.',
      grammar: 'Contrastar una rutina con una acción actual y distinguir las formas de be.',
      listening: 'Identificar qué tarea está en curso y cuál viene después.',
      reading: 'Seguir un listado breve de tareas con horarios y responsables.',
      writing: 'Actualizar al grupo sobre lo que cada persona está haciendo.',
      speaking: 'Coordinar el siguiente paso; practicar los grupos de palabras de be + -ing.',
    },
    introduces: ['present-actions', 'task-order'],
    revisits: ['routine-verbs', 'food-quantity', 'item-ownership'],
    transferEs: 'Coordinar la preparación de un juego de mesa con personas distintas.',
  },
  chile: {
    objectives: {
      vocabulary: 'Usar expresiones del clima, fechas, planes y citas.',
      grammar: 'Diferenciar un plan con going to de una oferta o decisión inmediata con will.',
      listening: 'Distinguir el plan inicial y el cambio de último momento.',
      reading: 'Cruzar un pronóstico con horarios y opciones de encuentro.',
      writing: 'Proponer un lugar y una hora nuevos en un mensaje al grupo.',
      speaking: 'Reorganizar una salida y repetir la hora acordada con claridad.',
    },
    introduces: ['future-plans', 'offers-and-decisions'],
    revisits: ['routine-time', 'requests-preferences', 'place-location'],
    transferEs: 'Invitar al grupo a otra actividad después de que se cancele una salida.',
  },
  miami: {
    objectives: {
      vocabulary: 'Usar verbos de experiencia, equipaje y preparativos.',
      grammar: 'Contrastar pasado con fecha y presente perfecto con yet, already o just.',
      listening: 'Separar experiencias previas, tareas pendientes y recién hechas.',
      reading: 'Interpretar un inventario y notas de preparación de otro viajero.',
      writing: 'Actualizar un listado y preguntar qué falta.',
      speaking:
        'Preguntar por una experiencia, pedir la fecha y comparar formas reducidas de have.',
    },
    introduces: ['life-experiences', 'completed-preparations'],
    revisits: ['past-events', 'past-questions', 'item-ownership'],
    transferEs: 'Organizar la preparación de un picnic con un equipo que ya hizo algunas tareas.',
  },
  'new-york': {
    objectives: {
      vocabulary: 'Describir opciones de transporte y habilidades para un trabajo.',
      grammar: 'Comparar opciones y conectar motivos con because y so.',
      listening: 'Identificar dos opciones y por qué una persona prefiere una.',
      reading: 'Comparar costo, duración y accesibilidad en dos fichas.',
      writing: 'Justificar una ruta accesible y responder un mensaje de entrevista.',
      speaking: 'Explicar una elección y acentuar las palabras que contrastan.',
    },
    introduces: ['option-comparison', 'reasons-and-results'],
    revisits: ['place-location', 'routine-time', 'life-experiences'],
    transferEs: 'Recomendar un servicio más conveniente para una persona con otros requisitos.',
  },
  toronto: {
    objectives: {
      vocabulary:
        'Identificar campos, requisitos y datos de contacto. Distinguir attend (asistir) de assist (ayudar).',
      grammar: 'Usar have to, can y don’t have to para distinguir permisos y obligaciones.',
      listening: 'Identificar qué debes llevar y deletrear o confirmar un dato.',
      reading: 'Detectar requisitos y excepciones de una inscripción.',
      writing: 'Completar un formulario y pedir que confirmen una condición.',
      speaking: 'Solicitar cupo y confirmar datos de contacto por grupos de palabras.',
    },
    introduces: ['requirements', 'form-confirmation'],
    revisits: ['introduction', 'requests-preferences', 'routine-time'],
    transferEs: 'Inscribir a una persona en otro taller con distinto requisito de edad u horario.',
  },
  london: {
    objectives: {
      vocabulary: 'Reconocer avisos de retraso, transbordo y cierre.',
      grammar: 'Expresar una alternativa con if o when y sus consecuencias.',
      listening: 'Distinguir ideas principales y datos horarios en dos avisos.',
      reading: 'Combinar un aviso de transporte con el mapa y una cita.',
      writing: 'Avisar de un retraso y presentar una alternativa viable.',
      speaking: 'Confirmar un itinerario y acentuar la información que cambió.',
    },
    introduces: ['transport-announcements', 'contingency-plans'],
    revisits: ['place-question', 'offers-and-decisions', 'option-comparison'],
    transferEs: 'Adaptar una ruta al centro comunitario después de que cambie otro servicio.',
  },
  paris: {
    objectives: {
      vocabulary: 'Describir exposiciones, gustos y características de una visita.',
      grammar: 'Desarrollar razones y usar relativas con who, which y that.',
      listening: 'Distinguir una recomendación y el motivo que la sostiene.',
      reading: 'Comparar dos descripciones y detectar a qué público interesan.',
      writing: 'Escribir una recomendación breve que incluya una condición.',
      speaking: 'Proponer una visita y practicar la entonación para dar turno a otra persona.',
    },
    introduces: ['recommendations', 'relative-descriptions'],
    revisits: ['requests-preferences', 'reasons-and-results', 'option-comparison'],
    transferEs: 'Recomendar una actividad fuera del museo para intereses diferentes.',
  },
  rome: {
    objectives: {
      vocabulary: 'Describir averías, reservas y posibles soluciones.',
      grammar: 'Diferenciar un hecho puntual y lo que ocurría de fondo; suavizar un reclamo.',
      listening: 'Reconocer qué falló y qué solución se está ofreciendo.',
      reading: 'Contrastar la reserva, las condiciones y la respuesta del alojamiento.',
      writing: 'Describir un incidente y proponer una solución concreta.',
      speaking: 'Negociar otra solución y practicar la entonación de una solicitud cortés.',
    },
    introduces: ['problem-narrative', 'negotiated-repair'],
    revisits: ['past-events', 'item-ownership', 'contingency-plans'],
    transferEs: 'Resolver un error parecido en una reserva de transporte.',
  },
  cairo: {
    objectives: {
      vocabulary: 'Reconocer indicaciones, puntos de encuentro y restricciones.',
      grammar:
        'Distinguir condiciones, límites y excepciones; pasar una instrucción a otra persona.',
      listening: 'Tomar nota de dos condiciones y del cambio anunciado.',
      reading: 'Interpretar un aviso con una excepción para parte del grupo.',
      writing: 'Resumir las instrucciones y explicar a quién aplica cada una.',
      speaking: 'Confirmar y transmitir una instrucción con pausas claras.',
    },
    introduces: ['condition-and-limits', 'instruction-relay'],
    revisits: ['requirements', 'task-order', 'contingency-plans'],
    transferEs: 'Explicar a un grupo nuevo qué debe hacer cuando se cierra otra entrada.',
  },
  singapore: {
    objectives: {
      vocabulary: 'Describir síntomas, duración y frecuencia con expresiones cotidianas.',
      grammar: 'Usar for y since; formar preguntas para confirmar instrucciones.',
      listening: 'Distinguir inicio, duración y pasos de seguimiento en un diálogo.',
      reading: 'Identificar acciones y horarios en instrucciones clínicas simuladas.',
      writing: 'Preparar una nota breve con síntomas y preguntas pendientes.',
      speaking: 'Explicar qué ocurre y verificar la indicación con una paráfrasis corta.',
    },
    introduces: ['ongoing-symptoms', 'confirm-understanding'],
    revisits: ['form-confirmation', 'life-experiences', 'instruction-relay'],
    transferEs: 'Ayudar a otra persona a confirmar indicaciones en una consulta simulada.',
  },
  tokyo: {
    objectives: {
      vocabulary: 'Usar nombres de actividades, espacios y expresiones de permiso.',
      grammar: 'Ajustar can, could y may al contexto y explicar una preferencia con would.',
      listening: 'Distinguir permiso, negativa cortés y permiso con condiciones.',
      reading: 'Localizar las reglas de fotografía y sus excepciones.',
      writing: 'Pedir permiso y ofrecer una alternativa que respete las reglas.',
      speaking:
        'Pedir permiso, recibir una respuesta y confirmar la condición con entonación cortés.',
    },
    introduces: ['permission-register', 'hypothetical-preference'],
    revisits: ['requests-preferences', 'negotiated-repair', 'condition-and-limits'],
    transferEs: 'Solicitar permiso para grabar audio en una actividad con otras reglas.',
  },
  australia: {
    objectives: {
      vocabulary: 'Interpretar términos de pronóstico, riesgo y avisos costeros.',
      grammar: 'Expresar probabilidad y matizar una propuesta con although o even if.',
      listening: 'Comparar un pronóstico grabado y un cambio en las recomendaciones.',
      reading: 'Distinguir probabilidad y consecuencia en dos avisos.',
      writing: 'Justificar una ruta, sus límites y el criterio para aplazarla.',
      speaking: 'Comparar opciones y explicar reservas con acento contrastivo.',
    },
    introduces: ['weather-uncertainty', 'risk-tradeoffs'],
    revisits: ['transport-announcements', 'condition-and-limits', 'option-comparison'],
    transferEs:
      'Ajustar la recomendación tras recibir un aviso distinto durante una salida de campo.',
  },
  'new-zealand': {
    objectives: {
      vocabulary: 'Precisar observaciones, impactos y medidas de conservación.',
      grammar: 'Usar estilo indirecto y matizadores que indican el grado de certeza.',
      listening: 'Distinguir observaciones coincidentes y discrepancias del equipo.',
      reading: 'Relacionar un registro de campo con datos de una ficha local.',
      writing: 'Redactar una propuesta breve respaldada por dos observaciones.',
      speaking: 'Presentar hallazgos y responder una objeción sin afirmar más de lo observado.',
    },
    introduces: ['observation-summary', 'qualified-proposals'],
    revisits: ['relative-descriptions', 'risk-tradeoffs', 'instruction-relay'],
    transferEs: 'Recomendar otra mejora después de observar un sitio con limitaciones distintas.',
  },
  kenya: {
    objectives: {
      vocabulary: 'Usar expresiones de responsabilidades, plazos y acuerdos.',
      grammar:
        'Formular compromisos con condiciones y resumir decisiones con voz activa o pasiva según el foco.',
      listening: 'Seguir desacuerdos y reconocer lo que el equipo realmente aprobó.',
      reading: 'Comparar horarios, capacidad y condiciones de participación.',
      writing: 'Registrar responsables, plazos y tareas de seguimiento.',
      speaking: 'Distribuir tareas, ceder el turno y comprobar el acuerdo.',
    },
    introduces: ['role-negotiation', 'decision-summary'],
    revisits: ['requirements', 'confirm-understanding', 'qualified-proposals'],
    transferEs: 'Redistribuir responsabilidades cuando la persona a cargo no puede asistir.',
  },
  'south-africa': {
    objectives: {
      vocabulary:
        'Usar verbos de atribución y grados de certeza. Distinguir actually (en realidad) de currently (actualmente).',
      grammar: 'Combinar estilo indirecto y conectores de contraste para atribuir afirmaciones.',
      listening: 'Separar observaciones, opiniones y datos dudosos de dos testimonios.',
      reading: 'Rastrear qué fuente respalda cada afirmación y evaluar discrepancias.',
      writing: 'Sintetizar dos fuentes y explicitar un punto sin confirmar.',
      speaking: 'Contar una versión atribuyendo cada dato clave y responder una pregunta.',
    },
    introduces: ['source-evaluation', 'source-synthesis'],
    revisits: ['observation-summary', 'reasons-and-results', 'decision-summary'],
    transferEs: 'Revisar la síntesis al recibir un tercer testimonio contradictorio.',
  },
  antarctica: {
    objectives: {
      vocabulary: 'Interpretar términos de expedición, seguimiento y cuidado ambiental.',
      grammar: 'Alternar modales, condiciones y pasiva para explicar medidas y excepciones.',
      listening: 'Identificar datos, riesgos y tareas en una reunión de preparación.',
      reading: 'Justificar decisiones citando un protocolo y una nota del equipo.',
      writing: 'Redactar un informe con evidencia, reservas y próximos pasos claros.',
      speaking:
        'Presentar el informe y responder preguntas de seguimiento con estructura y pausas claras.',
    },
    introduces: ['protocol-reading', 'expedition-report'],
    revisits: ['source-synthesis', 'risk-tradeoffs', 'role-negotiation', 'confirm-understanding'],
    transferEs:
      'Adaptar el informe y las indicaciones ante un escenario nuevo de la expedición que sale de Ushuaia.',
  },
};

export const travelCurriculum: readonly TravelCurriculumStage[] = route.map(({ id, band }) => ({
  destinationId: id,
  band,
  ...stages[id],
}));
