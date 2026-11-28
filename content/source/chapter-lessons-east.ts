import type { ChapterLessonSource } from '@lingoquest/course-pack';

export const easternChapterLessons = {
  paris: {
    title: 'Una exposición para el grupo',
    objectiveEs: 'Recomienda una exposición en París según los intereses de una visitante.',
    dialogue: [
      {
        speaker: 'Nina',
        en: 'I like art that shows what everyday life is like. Which exhibit would you recommend?',
        es: 'Me gusta el arte que muestra cómo es la vida cotidiana. ¿Qué exposición me recomendarías?',
      },
      {
        speaker: 'Alex',
        en: 'Try the photo exhibit, which shows what Paris looked like a hundred years ago.',
        es: 'Te recomiendo la exposición de fotos, que muestra cómo era París hace cien años.',
      },
      {
        speaker: 'Nina',
        en: 'What about the sculpture gallery? My brother likes artists who work with wood.',
        es: '¿Y la sala de esculturas? A mi hermano le gustan los artistas que trabajan con madera.',
      },
      {
        speaker: 'Alex',
        en: 'He might enjoy that one. I would start with the photos because you can see how people lived.',
        es: 'Quizá le guste esa sala. Yo empezaría por las fotos porque puedes ver cómo vivía la gente.',
      },
    ],
    vocabulary: [
      { en: 'exhibit', es: 'exposición' },
      { en: 'sculpture', es: 'escultura' },
      { en: 'everyday life', es: 'vida cotidiana' },
      { en: 'recommend', es: 'recomendar' },
      { en: 'art market', es: 'mercado de arte' },
      { en: 'local artists', es: 'artistas locales' },
    ],
    grammarEs:
      'En «artists who work with wood», «who» aclara de qué artistas hablamos. En «art that tells a story», «that» aclara qué tipo de arte. Esos datos identifican lo que quieres decir y van sin coma. Compara «an exhibit that shows old photos» con «the photo exhibit, which shows what Paris looked like years ago». En el segundo caso, ya sabemos cuál es la exposición y añadimos un dato con coma y «which». Para recomendar, prueba «I’d recommend… because…».',
    question: {
      promptEs: '¿Por qué Alex recomienda empezar por las fotos?',
      options: [
        'Porque hay esculturas de madera en la sala.',
        'Porque muestran cómo vivía la gente en París.',
        'Porque las fotos muestran el París actual.',
      ],
      answerIndex: 1,
      feedbackEs:
        'Alex dice que en las fotos puedes ver cómo vivía la gente y que muestran el París de hace cien años.',
    },
    practiceEs:
      'Un amigo disfruta los paseos al aire libre y quiere conocer a artistas locales. Recomiéndale un mercado de arte de fin de semana. Explica tu recomendación con «because» y usa «who» para decir a qué artistas puede conocer.',
    model: {
      en: 'I would recommend the weekend art market because you like being outdoors. You can meet artists who live in the neighborhood.',
      es: 'Te recomendaría el mercado de arte de fin de semana porque te gusta estar al aire libre. Ahí puedes conocer artistas que viven en el barrio.',
    },
  },
  rome: {
    title: 'Resolver un problema durante el viaje',
    objectiveEs: 'Aclara una reserva en un alojamiento en Estambul, negocia una alternativa y confirma el acuerdo por escrito.',
    dialogue: [
      {
        speaker: 'Maya',
        en: 'I was crossing the Bosphorus when I got your message about a repair. Could you check my booking? I booked a double room for two nights.',
        es: 'Estaba cruzando el Bósforo cuando recibí su mensaje sobre una reparación. ¿Podría revisar mi reserva? Reservé una habitación doble para dos noches.',
      },
      {
        speaker: 'Deniz',
        en: 'The repair won’t be finished today. I can offer a single room here tonight or a double room nearby for both nights.',
        es: 'La reparación no terminará hoy. Puedo ofrecerle una habitación individual aquí para hoy, o una doble cerca para las dos noches.',
      },
      {
        speaker: 'Maya',
        en: 'Would it be possible to take the double room nearby at the original price?',
        es: '¿Sería posible quedarme con la habitación doble de aquí cerca al precio original?',
      },
      {
        speaker: 'Deniz',
        en: 'Yes. I’ll send you the address and confirm both nights at the original price.',
        es: 'Sí. Le enviaré la dirección y le confirmaré las dos noches al precio original.',
      },
      {
        speaker: 'Maya',
        en: 'Thank you. I’m writing to confirm the double room for two nights at the original price.',
        es: 'Gracias. Escribo para confirmar la habitación doble por dos noches al precio original.',
      },
    ],
    vocabulary: [
      { en: 'booking', es: 'reserva' },
      { en: 'double room', es: 'habitación doble' },
      { en: 'original price', es: 'precio original' },
      { en: 'repair', es: 'reparación' },
    ],
    grammarEs:
      'Usa «was» o «were» más un verbo en «-ing» para el contexto y el pasado simple para el hecho que ocurrió en ese momento: «I was crossing the Bosphorus when I got your message». Otro ejemplo es «I was unpacking when water started dripping». Usa «Could you…?» o «Would it be possible to…?» para pedir una solución con cortesía. En el mensaje final, usa «I’m writing to confirm…» y repite los datos acordados.',
    question: {
      promptEs: '¿Qué acuerdan Maya y Deniz mientras sigue la reparación?',
      options: [
        'Una habitación individual en el mismo alojamiento para las dos noches.',
        'Una habitación doble en otro alojamiento por una sola noche.',
        'Una habitación doble cerca por dos noches al precio original.',
      ],
      answerIndex: 2,
      feedbackEs:
        'La reparación sigue pendiente. Deniz acepta la habitación doble cerca y se compromete a confirmar las dos noches al precio original.',
    },
    practiceEs:
      'Estabas leyendo el mensaje de una reserva de tren cuando viste que los asientos no estaban juntos. Explica qué pasó, pide un cambio y escribe una frase para confirmar los nuevos asientos 12A y 12B.',
    model: {
      en: 'I was reading the booking email when I noticed our seats weren’t together. Would it be possible to change one of them? I’m writing to confirm seats twelve A and twelve B.',
      es: 'Estaba leyendo el correo de la reserva cuando noté que nuestros asientos no estaban juntos. ¿Sería posible cambiar uno? Escribo para confirmar los asientos doce A y doce B.',
    },
  },
  cairo: {
    title: 'Una entrada diferente',
    objectiveEs:
      'Confirma el nuevo punto de encuentro y explica quién puede seguir usando la entrada habitual.',
    dialogue: [
      {
        speaker: 'Salma',
        en: 'It’s very hot, so we’ll meet at the shaded north gate at two instead of the main entrance.',
        es: 'Hace mucho calor, así que nos reuniremos en la entrada norte, donde hay sombra, a las dos, en vez de la entrada principal.',
      },
      {
        speaker: 'Jules',
        en: 'Does everyone have to go to the north gate?',
        es: '¿Todas las personas tienen que ir a la entrada norte?',
      },
      {
        speaker: 'Salma',
        en: 'Yes, unless they need the ramp at the main entrance. If they use the ramp, a guide will meet them inside.',
        es: 'Sí, a menos que necesiten la rampa de la entrada principal. Si usan la rampa, una guía estará adentro para recibirlos.',
      },
      {
        speaker: 'Jules',
        en: 'I’ll tell the group to wait at the north gate unless they need the ramp.',
        es: 'Le diré al grupo que espere en la entrada norte, a menos que necesite la rampa.',
      },
    ],
    vocabulary: [
      { en: 'main entrance', es: 'entrada principal' },
      { en: 'shaded', es: 'con sombra' },
      { en: 'ramp', es: 'rampa' },
      { en: 'meeting point', es: 'punto de encuentro' },
    ],
    grammarEs:
      '«Unless» equivale a «a menos que»: «Go to the north gate unless you need the ramp». La regla se aplica cuando no necesitas la rampa. Con «if» das la instrucción para el otro caso: «If you use the ramp, a guide will meet you». Usa presente simple después de «if» y «unless» en este tipo de aviso. Para pasarlo a otra persona, usa «tell» + persona + «to» + verbo: «Tell the group to wait inside».',
    question: {
      promptEs: '¿Qué debe hacer alguien que necesita la rampa?',
      options: [
        'Usar la entrada principal y encontrarse con una guía adentro.',
        'Ir primero a la entrada norte y pedir que instalen una rampa.',
        'Esperar afuera en la entrada principal a que llegue todo el grupo.',
      ],
      answerIndex: 0,
      feedbackEs:
        'La instrucción general es reunirse en la entrada norte. Quienes necesitan la rampa entran por la entrada principal y se encuentran con una guía adentro.',
    },
    practiceEs:
      'La coordinadora pide usar la entrada sur, salvo para las personas que ya tienen un boleto digital. Con ese boleto pueden pasar por la entrada este. Pasa el aviso en inglés a un compañero que llega con el siguiente grupo.',
    model: {
      en: 'Please tell the group to use the south entrance unless they already have a digital ticket. If they have one, they can use the east entrance.',
      es: 'Por favor, dile al grupo que use la entrada sur a menos que ya tenga un boleto digital. Si tiene uno, puede usar la entrada este.',
    },
  },
  singapore: {
    title: 'Confirmar una cita de seguimiento',
    objectiveEs:
      'Describe desde cuándo tienes un síntoma y confirma las indicaciones para una cita simulada.',
    dialogue: [
      {
        speaker: 'Noah',
        en: 'I’ve had a sore throat since Tuesday, and I’ve been coughing at night for two days.',
        es: 'Me duele la garganta desde el martes y llevo dos días tosiendo por la noche.',
      },
      {
        speaker: 'Aisha',
        en: 'Let’s book a follow-up for Friday morning. Bring your symptom notes to the front desk.',
        es: 'Programemos una cita de seguimiento para el viernes en la mañana. Trae tus notas sobre los síntomas a recepción.',
      },
      {
        speaker: 'Noah',
        en: 'Just to make sure I understood, should I check in at the front desk with my notes on Friday morning?',
        es: 'Solo para asegurarme de haber entendido, ¿debo registrarme en recepción con mis notas el viernes en la mañana?',
      },
      {
        speaker: 'Aisha',
        en: 'That’s right. Ask for me when you arrive.',
        es: 'Así es. Pregunta por mí al llegar.',
      },
    ],
    vocabulary: [
      { en: 'sore throat', es: 'dolor de garganta' },
      { en: 'cough', es: 'toser' },
      { en: 'follow-up', es: 'cita de seguimiento' },
      { en: 'check in', es: 'registrarse al llegar' },
    ],
    grammarEs:
      'Usa «since» con el momento de inicio («since Tuesday») y «for» con la duración («for two days»). Para un estado que sigue, usa «have» + participio: «I’ve had a sore throat». Para una acción que ha continuado o se ha repetido, puedes usar «have been» + verbo en «-ing»: «I’ve been coughing». Para verificar una instrucción, repítela con tus palabras y «Should I…?».',
    question: {
      promptEs: '¿Qué confirma Noah antes de terminar la cita?',
      options: [
        'Que debe esperar una llamada el viernes en la noche.',
        'Que debe registrarse en recepción con sus notas el viernes en la mañana.',
        'Que debe llevar las notas cuando empiecen los síntomas.',
      ],
      answerIndex: 1,
      feedbackEs:
        'Noah repite dónde debe registrarse, qué debe traer y cuándo debe llegar. Aisha confirma los tres datos.',
    },
    practiceEs:
      'En otra consulta simulada, explica que tienes dolor de cabeza desde el lunes y que has dormido mal durante dos noches. Confirma si debes llevar tus notas el jueves por la tarde.',
    model: {
      en: 'I’ve had a headache since Monday, and I’ve been sleeping poorly for two nights. Just to make sure, should I bring my notes on Thursday afternoon?',
      es: 'Me duele la cabeza desde el lunes y llevo dos noches durmiendo mal. Solo para confirmar, ¿debo traer mis notas el jueves por la tarde?',
    },
  },
  tokyo: {
    title: 'Permiso para tomar fotos',
    objectiveEs:
      'Pide permiso en un taller de fotografía y elige una alternativa que respete las condiciones.',
    dialogue: [
      {
        speaker: 'Eva',
        en: 'May I take a photo of the origami display for my travel journal?',
        es: '¿Puedo tomar una foto de la exhibición de origami para mi diario de viaje?',
      },
      {
        speaker: 'Haru',
        en: 'Yes, but please turn off the flash and make sure no other visitors are in the picture.',
        es: 'Sí, pero por favor desactiva el flash y asegúrate de que no salgan otras personas en la foto.',
      },
      {
        speaker: 'Eva',
        en: 'I’d rather wait until the room is empty. Could I come back after the workshop?',
        es: 'Preferiría esperar a que la sala esté vacía. ¿Podría volver después del taller?',
      },
      {
        speaker: 'Haru',
        en: 'Of course. The exhibit will still be open, and there are usually fewer people then.',
        es: 'Claro. La exhibición seguirá abierta y normalmente hay menos gente a esa hora.',
      },
    ],
    vocabulary: [
      { en: 'display', es: 'exhibición' },
      { en: 'turn off the flash', es: 'desactivar el flash' },
      { en: 'workshop', es: 'taller' },
      { en: 'I’d rather wait', es: 'preferiría esperar' },
    ],
    grammarEs:
      'Can I…? funciona en una conversación cotidiana, Could I…? suaviza la solicitud y May I…? tiene un tono más formal. Usa would rather más el verbo sin to para indicar una preferencia. En I’d rather wait, I’d significa I would.',
    question: {
      promptEs: '¿Con qué condiciones puede tomar la foto Eva?',
      options: [
        'Puede usar el flash si toma la foto después del taller.',
        'Puede tomar una foto con otras personas si la guarda para su diario.',
        'Debe desactivar el flash y evitar que salgan otras personas.',
      ],
      answerIndex: 2,
      feedbackEs:
        'Haru permite tomar la foto si Eva desactiva el flash y se asegura de que no salga nadie más en la imagen.',
    },
    practiceEs:
      'En otro taller, pregunta si puedes grabar las instrucciones de la persona que lo dirige. Te dicen que está permitido grabarlas, pero no puedes grabar al resto del grupo. Expresa tu preferencia y propone esperar hasta después del taller.',
    model: {
      en: 'Could I record your instructions? I’d rather wait until after the workshop so I don’t record anyone else. Would that be okay?',
      es: '¿Podría grabar tus instrucciones? Preferiría esperar hasta después del taller para no grabar a nadie más. ¿Te parece bien?',
    },
  },
  australia: {
    title: 'Una decisión junto al mar',
    objectiveEs: 'Sopesa dos fuentes y recomienda un plan para el equipo en Sídney. Los pronósticos, avisos y trayectos del ejercicio son ficticios.',
    dialogue: [
      {
        speaker: 'Radio',
        en: 'Here’s the morning forecast for Bondi. Showers are likely after noon, but winds should stay light along the coast.',
        es: 'Este es el pronóstico de la mañana para Bondi. Es probable que haya chubascos después del mediodía, pero el viento debería mantenerse leve en la costa.',
      },
      {
        speaker: 'Guía',
        en: 'The latest advisory says gusts could hit the coast at eleven. The exposed part of the trail is closed, but the sheltered trail is still open.',
        es: 'El aviso más reciente dice que podría haber ráfagas en la costa a las once. El tramo expuesto del sendero está cerrado, pero el sendero resguardado sigue abierto.',
      },
      {
        speaker: 'Sam',
        en: 'Although we may miss the rain, I’m worried about the wind. Even if the sky clears, part of the trail is still closed.',
        es: 'Aunque quizá evitemos la lluvia, me preocupa el viento. Aunque se despeje, parte del sendero sigue cerrada.',
      },
      {
        speaker: 'Luz',
        en: 'I see your point. Given the advisory and how tired the group is, I’d recommend taking a harbor ferry from Circular Quay if it’s running.',
        es: 'Entiendo tu punto. Por el aviso y porque el grupo está cansado, recomendaría tomar un ferry por el puerto desde Circular Quay si está en servicio.',
      },
      {
        speaker: 'Guía',
        en: 'I’ll check the ferry service. If it’s suspended, let’s postpone the outing.',
        es: 'Voy a confirmar el servicio del ferry. Si se suspende, aplacemos la salida.',
      },
    ],
    vocabulary: [
      { en: 'gust', es: 'ráfaga' },
      { en: 'sheltered trail', es: 'sendero resguardado' },
      { en: 'postpone', es: 'aplazar' },
      { en: 'advisory', es: 'aviso' },
      { en: 'harbor ferry', es: 'ferry del puerto' },
    ],
    grammarEs:
      'Usa «may» o «could» para una posibilidad y «likely» para algo probable. Separa lo posible de lo confirmado. «Although» reconoce otro punto antes de tu conclusión. «Even if» presenta una circunstancia que no cambia la decisión. Con «Given the advisory, I’d recommend…» explicas en qué te basas antes de recomendar algo.',
    question: {
      promptEs: '¿Qué aporta el aviso más reciente a la decisión del grupo?',
      options: [
        'Advierte que podría haber ráfagas antes de los chubascos y que solo sigue abierto el sendero resguardado.',
        'Confirma que ambos senderos cerraron y que todos los ferris están suspendidos.',
        'Confirma que la lluvia ya empezó y que el viento será leve durante toda la salida.',
      ],
      answerIndex: 0,
      feedbackEs:
        'El aviso distingue un riesgo posible, las ráfagas, de un cierre confirmado. El sendero resguardado está abierto y el equipo aún tiene que comprobar si opera el ferry.',
    },
    practiceEs:
      'Un pronóstico ficticio anuncia buen tiempo en un valle, pero la guía dice que el sendero bajo podría inundarse. Reconoce el atractivo de esa ruta, recomienda el sendero alto y explica cuándo aplazarías la salida.',
    model: {
      en: 'Although the lower trail has better views, it could flood. Given the guide’s report, I’d recommend the higher trail. If that trail closes too, I’ll postpone the walk.',
      es: 'Aunque el sendero bajo tiene mejores vistas, podría inundarse. Según el informe de la guía, recomendaría el sendero alto. Si también lo cierran, aplazaré la caminata.',
    },
  },
  'new-zealand': {
    title: 'Un registro de observación en la costa',
    objectiveEs:
      'Resume dos observaciones de conservación y propone un cambio con el respaldo que permite la evidencia.',
    dialogue: [
      {
        speaker: 'Riley',
        en: 'Our field notes show three sets of footprints beyond the rope. I didn’t see who left them.',
        es: 'En las notas anotamos tres grupos de huellas del otro lado de la cuerda. No vi quién dejó las huellas.',
      },
      {
        speaker: 'Mere',
        en: 'I noticed that the sign was hard to see from the new path. A visitor told me she hadn’t noticed it at all.',
        es: 'Noté que era difícil ver el letrero desde el sendero nuevo. Una visitante me dijo que ni siquiera lo había visto.',
      },
      {
        speaker: 'Riley',
        en: 'A clearer sign might help, although the footprints alone don’t tell us why people crossed the rope.',
        es: 'Un letrero más visible podría ayudar, aunque las huellas por sí solas no nos dicen por qué cruzó la gente.',
      },
      {
        speaker: 'Mere',
        en: 'Let’s move it to the fork in the path and compare what we observe next weekend.',
        es: 'Movámoslo a la bifurcación del sendero y comparemos lo que observemos el próximo fin de semana.',
      },
    ],
    vocabulary: [
      { en: 'field notes', es: 'notas de campo' },
      { en: 'footprints', es: 'huellas' },
      { en: 'fork in the path', es: 'bifurcación del sendero' },
      { en: 'observe', es: 'observar' },
    ],
    grammarEs:
      'Atribuye un dato a una persona con said that o reported that. En She told me she hadn’t noticed it, el pasado perfecto ubica lo que ocurrió antes de que lo contara. Usa might help para una propuesta razonable cuyo efecto todavía queda por comprobar.',
    question: {
      promptEs: '¿Qué conclusión respaldan las observaciones del equipo?',
      options: [
        'Las tres personas cruzaron porque no vieron el letrero.',
        'Hay huellas del otro lado de la cuerda y el letrero es difícil de ver desde el sendero nuevo.',
        'Mover el letrero evitará que todas las personas crucen la cuerda.',
      ],
      answerIndex: 1,
      feedbackEs:
        'El equipo observó las huellas y el problema de visibilidad. Puede probar un cambio, ya que todavía desconoce qué causó las huellas.',
    },
    practiceEs:
      'En otro sitio, tu compañera vio envoltorios cerca de un mirador y anotó que el bote de basura más cercano estaba al final del sendero. Resume sus observaciones y propón probar un cambio. Aclara qué dato sigue sin confirmarse.',
    model: {
      en: 'My teammate reported finding wrappers by the lookout. She said the nearest trash can was at the end of the trail. A trash can by the lookout might help, though we don’t know who left the wrappers.',
      es: 'Mi compañera informó que encontró envoltorios cerca del mirador. Dijo que el bote más cercano estaba al final del sendero. Un bote cerca del mirador podría ayudar, aunque no sabemos quién dejó los envoltorios.',
    },
  },
  kenya: {
    title: 'Responsables para una jornada comunitaria',
    objectiveEs:
      'Negocia quién cubre cada tarea y confirma responsables y plazos en un mensaje al equipo.',
    dialogue: [
      {
        speaker: 'Wanjiku',
        en: 'We need someone at the registration desk by eight thirty. David, can you cover it?',
        es: 'Necesitamos a alguien en la mesa de registro a más tardar a las ocho y media. David, ¿puedes atenderla?',
      },
      {
        speaker: 'David',
        en: 'I can take over at ten, provided someone else handles the early arrivals.',
        es: 'Puedo hacerme cargo a las diez, siempre que alguien atienda a quienes lleguen temprano.',
      },
      {
        speaker: 'Amina',
        en: 'I can cover the desk until ten if David emails me the sign-in sheet by Friday afternoon.',
        es: 'Puedo atender la mesa hasta las diez si David me manda la lista de registro por correo a más tardar el viernes por la tarde.',
      },
      {
        speaker: 'Wanjiku',
        en: 'Agreed. Amina will open the desk, David will relieve her at ten, and the sheet will be sent by Friday afternoon.',
        es: 'De acuerdo. Amina abrirá la mesa, David la relevará a las diez y la lista se enviará a más tardar el viernes por la tarde.',
      },
    ],
    vocabulary: [
      { en: 'take over', es: 'hacerse cargo' },
      { en: 'early arrivals', es: 'personas que llegan temprano' },
      { en: 'sign-in sheet', es: 'lista de registro' },
      { en: 'deadline', es: 'plazo' },
    ],
    grammarEs:
      'Usa provided para negociar una condición y by para indicar el plazo. David will send the sheet identifica al responsable. The sheet will be sent usa la voz pasiva para centrar la atención en la lista y puede ser útil al resumir una tarea cuyo responsable ya se conoce.',
    question: {
      promptEs: '¿Qué acuerdo confirma el equipo?',
      options: [
        'David abrirá la mesa de registro y Amina lo relevará el viernes.',
        'Wanjiku abrirá la mesa y enviará la lista cuando termine la jornada.',
        'Amina abrirá la mesa, David la relevará a las diez y enviará la lista a más tardar el viernes por la tarde.',
      ],
      answerIndex: 2,
      feedbackEs:
        'Amina acepta cubrir el primer turno con la condición de recibir la lista de David. Wanjiku confirma el relevo y el plazo de envío.',
    },
    practiceEs:
      'Amina avisa que no podrá llegar a tiempo. Ofrece abrir la mesa con la condición de que David te mande la lista a más tardar el viernes por la tarde. Pregunta si David todavía te relevará a las diez.',
    model: {
      en: 'I can open the registration desk provided David sends me the sign-in sheet by Friday afternoon. Can you confirm that David will still take over at ten?',
      es: 'Puedo abrir la mesa de registro siempre que David me envíe la lista a más tardar el viernes por la tarde. ¿Puedes confirmar que David aún se hará cargo a las diez?',
    },
  },
  'south-africa': {
    title: 'Dos versiones de una salida',
    objectiveEs:
      'Atribuye cada versión a su fuente y distingue lo confirmado de lo que todavía está en duda.',
    dialogue: [
      {
        speaker: 'Lebo',
        en: 'The departure board listed the ferry at three thirty. I thought I saw it leave before then, but I was far from the dock.',
        es: 'El tablero indicaba que el ferry salía a las tres y media. Me pareció verlo salir antes, pero estaba lejos del muelle.',
      },
      {
        speaker: 'Sofia',
        en: 'Actually, I watched passengers board at three thirty. I left before the boat pulled away.',
        es: 'En realidad, vi a pasajeros abordar a las tres y media. Me fui antes de que zarpara el barco.',
      },
      {
        speaker: 'Lebo',
        en: 'The terminal staff are currently checking the log. Until we see it, I can only confirm the scheduled time.',
        es: 'El personal de la terminal está revisando la bitácora en este momento. Hasta que la veamos, solo puedo confirmar la hora programada.',
      },
      {
        speaker: 'Sofia',
        en: 'Then let’s report what each of us saw and say the actual departure time hasn’t been confirmed.',
        es: 'Entonces contemos lo que vio cada quien y digamos que la hora real de salida sigue sin confirmarse.',
      },
    ],
    vocabulary: [
      { en: 'departure board', es: 'tablero de salidas' },
      { en: 'pull away', es: 'zarpar' },
      { en: 'next to the dock', es: 'junto al muelle' },
      { en: 'terminal log', es: 'bitácora de la terminal' },
      { en: 'actually', es: 'en realidad' },
      { en: 'currently', es: 'actualmente, en este momento' },
    ],
    grammarEs:
      'Para contrastar dos testimonios, identifica quién aporta cada versión: «Lebo thought the ferry left early, while Sofia said she saw people boarding at three thirty». «Actually» puede introducir una corrección. «Currently» indica lo que sucede ahora. Para marcar un dato todavía sin verificar, usa «hasn’t been confirmed».',
    question: {
      promptEs: '¿Cuál dato puede confirmar Lebo antes de que se revise la bitácora?',
      options: [
        'El tablero anunciaba la salida a las tres y media.',
        'El ferry zarpó antes de las tres y media.',
        'El ferry zarpó exactamente a las tres y media.',
      ],
      answerIndex: 0,
      feedbackEs:
        'Lebo puede confirmar lo que decía el tablero. Sofia vio a pasajeros subir al ferry. La hora real de salida todavía no se ha verificado.',
    },
    practiceEs:
      'Una tercera viajera, Amara, te muestra un video en el que solo se ve el ferry junto al muelle. Su teléfono indica que el video se grabó a las tres y cuarenta. Explica en inglés qué muestra el video, qué dato sigue sin confirmarse y qué habría que comprobar antes de cambiar el informe.',
    model: {
      en: 'Amara’s video shows the ferry next to the dock. Her phone says the video was recorded at three forty. The video doesn’t show the ferry pulling away, so the actual departure time hasn’t been confirmed. We need to check the phone’s clock and compare the recording with the terminal log.',
      es: 'El video de Amara muestra el ferry junto al muelle. Su teléfono indica que se grabó a las tres y cuarenta. El video no muestra al ferry zarpar, así que la hora real de salida sigue sin confirmarse. Tenemos que revisar el reloj del teléfono y comparar la grabación con la bitácora de la terminal.',
    },
  },
  antarctica: {
    title: 'Un informe para la expedición',
    objectiveEs:
      'Interpreta el protocolo simulado, explica el cambio de plan y asigna el siguiente paso.',
    dialogue: [
      {
        speaker: 'Sam',
        en: 'The protocol says visitors must stay on the marked route. The landing may go ahead only after the lead guide has confirmed that the route is clear.',
        es: 'El protocolo dice que los visitantes deben permanecer en la ruta señalizada. El desembarco puede realizarse solo después de que la guía responsable confirme que la ruta está despejada.',
      },
      {
        speaker: 'Inez',
        en: 'The field team reports that the morning’s snowfall has covered some of the route markers.',
        es: 'El equipo de campo informa que la nevada de la mañana cubrió algunas señales de la ruta.',
      },
      {
        speaker: 'Sam',
        en: 'Given that report, the landing should be delayed. If the lead guide clears the route, we can review the plan at the next briefing.',
        es: 'En vista de ese informe, conviene aplazar el desembarco. Si la guía responsable confirma que la ruta está despejada, podemos revisar el plan en la próxima reunión informativa.',
      },
      {
        speaker: 'Inez',
        en: 'I’ll record the decision and ask the lead guide to update us before the briefing.',
        es: 'Registraré la decisión y le pediré a la guía responsable que nos informe antes de la reunión.',
      },
    ],
    vocabulary: [
      { en: 'landing', es: 'desembarco' },
      { en: 'marked route', es: 'ruta señalizada' },
      { en: 'snowfall', es: 'nevada' },
      { en: 'briefing', es: 'reunión informativa' },
    ],
    grammarEs:
      'En el protocolo, «must» indica una obligación y «may» un permiso. «Only after» y «until» te permiten ordenar los pasos: «We may land only after the guide checks the route» y «We must wait until the guide checks the route». «Should be delayed» presenta una recomendación sobre el desembarco. Para atribuir la información a su fuente, empieza con «The protocol says…» o «The field team reports…».',
    question: {
      promptEs: '¿Qué debe ocurrir antes de volver a considerar el desembarco?',
      options: [
        'El grupo debe volver a leer el protocolo sin esperar al equipo de campo.',
        'La guía responsable debe confirmar que la ruta está despejada.',
        'Los visitantes deben salir primero a buscar las señales cubiertas.',
      ],
      answerIndex: 1,
      feedbackEs:
        'El protocolo condiciona el desembarco a la confirmación de la guía responsable. El equipo puede revisar el plan en la próxima reunión si cuenta con esa confirmación.',
    },
    practiceEs:
      'En la siguiente reunión, el equipo informa que ya ve las señales, pero la guía responsable aún no autoriza el desembarco. Presenta un informe breve en inglés con el dato nuevo, la condición pendiente y el siguiente paso.',
    model: {
      en: 'The field team reports that the markers are visible again. The landing must stay on hold until the lead guide confirms that the route is clear. I’ll ask for an update before we review the plan.',
      es: 'El equipo de campo informa que las señales ya se ven. El desembarco debe seguir en pausa hasta que la guía responsable confirme que la ruta está despejada. Pediré una actualización antes de que revisemos el plan.',
    },
  },
} satisfies Record<string, ChapterLessonSource>;
