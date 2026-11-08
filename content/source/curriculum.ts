/** Original development fixtures. Human language/education review is still required.
 * Authoring source for offline course packs. Runtime mobile content is generated JSON. */
export type ExerciseType = 'single_choice' | 'cloze' | 'reorder' | 'correction' | 'short_text';
export type ChallengeType = 'grammar_rush' | 'cloze_battle' | 'reading_quest';
export interface PrivateExercise {
  id: string;
  type: ExerciseType;
  promptEs: string;
  sentence?: string;
  options?: { id: string; text: string }[];
  tokens?: string[];
  skillId: string;
  feedbackEs: string;
  acceptedAnswers: string[];
  correctOptionId?: string;
  passage?: string;
  difficulty: number;
}
export interface PrivateLesson {
  id: string;
  unitId: string;
  title: string;
  introEs: string;
  examples: { en: string; es: string }[];
  speakingText: string;
  exercises: PrivateExercise[];
  estimatedMinutes: number;
}
export interface Unit {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  cefr: 'A1' | 'A2';
  lessons: { id: string; title: string; estimatedMinutes: number; skills: string[]; seq: number }[];
}
export const contentStatus = {
  version: 'original-draft-1',
  status: 'draft_needs_human_review',
  rankedPublished: false,
  source: 'original_development_content',
} as const;
type Seed = readonly [en: string, es: string, focus: string, wrong: string];
type LessonSeed = { title: string; intro: string; sentences: readonly Seed[] };
const lessonSeeds: readonly LessonSeed[][] = [
  [
    {
      title: 'Verbo be',
      intro:
        'Usa am con I, is con he/she/it y are con you/we/they. Be sirve para presentarte y describir quién eres.',
      sentences: [
        ['I am Ana.', 'Soy Ana.', 'am', 'is'],
        ['She is a teacher.', 'Ella es profesora.', 'is', 'are'],
        ['You are my friend.', 'Tú eres mi amigo.', 'are', 'am'],
        ['We are students.', 'Somos estudiantes.', 'are', 'is'],
        ['He is from Peru.', 'Él es de Perú.', 'is', 'am'],
        ['They are at home.', 'Ellos están en casa.', 'are', 'is'],
        ['I am happy.', 'Estoy feliz.', 'am', 'are'],
        ['It is a book.', 'Es un libro.', 'is', 'are'],
      ],
    },
    {
      title: 'Pronombres personales',
      intro:
        'I es yo; you es tú o ustedes; he y she son él y ella. We es nosotros y they es ellos. El pronombre determina la forma de be.',
      sentences: [
        ['He is my brother.', 'Él es mi hermano.', 'He', 'They'],
        ['She is an engineer.', 'Ella es ingeniera.', 'She', 'We'],
        ['They are neighbors.', 'Ellos son vecinos.', 'They', 'He'],
        ['We are a team.', 'Somos un equipo.', 'We', 'She'],
        ['I am a nurse.', 'Soy enfermero.', 'I', 'They'],
        ['You are welcome here.', 'Eres bienvenido aquí.', 'You', 'He'],
        ['It is a small town.', 'Es un pueblo pequeño.', 'It', 'They'],
        ['We are from Mexico.', 'Somos de México.', 'We', 'I'],
      ],
    },
    {
      title: 'Preguntas con be',
      intro:
        'Para preguntar con be, coloca am/is/are antes del sujeto: Are you ready? Responde de forma breve: Yes, I am. No necesitas do.',
      sentences: [
        ['Are you a student?', '¿Eres estudiante?', 'Are', 'Is'],
        ['Is she your sister?', '¿Ella es tu hermana?', 'Is', 'Are'],
        ['Am I in the right room?', '¿Estoy en la sala correcta?', 'Am', 'Are'],
        ['Are they ready?', '¿Están listos?', 'Are', 'Is'],
        ['Is he at work?', '¿Él está en el trabajo?', 'Is', 'Am'],
        ['Are we late?', '¿Llegamos tarde?', 'Are', 'Is'],
        ['Is it your bag?', '¿Es tu bolso?', 'Is', 'Are'],
        ['Are you from Chile?', '¿Eres de Chile?', 'Are', 'Am'],
      ],
    },
    {
      title: 'Presentarte con confianza',
      intro:
        'Combina tu nombre, origen y ocupación en frases breves. Una presentación clara puede ser sencilla. La práctica de voz al final es opcional.',
      sentences: [
        ['My name is Luis.', 'Mi nombre es Luis.', 'is', 'are'],
        ['I am from Colombia.', 'Soy de Colombia.', 'am', 'is'],
        ['I am a designer.', 'Soy diseñador.', 'am', 'are'],
        ['This is my friend Sara.', 'Esta es mi amiga Sara.', 'is', 'are'],
        ['We are new here.', 'Somos nuevos aquí.', 'are', 'am'],
        ['Nice to meet you.', 'Mucho gusto.', 'meet', 'meeting'],
        ['My sister is a doctor.', 'Mi hermana es doctora.', 'is', 'am'],
        ['Our names are Eva and Leo.', 'Nuestros nombres son Eva y Leo.', 'are', 'is'],
      ],
    },
  ],
  [
    {
      title: 'Present simple',
      intro:
        'El presente simple expresa hábitos. Con I/you/we/they usa el verbo base: I work. Con he/she/it, normalmente agrega -s: She works.',
      sentences: [
        ['I work in a library.', 'Trabajo en una biblioteca.', 'work', 'works'],
        ['We study English every day.', 'Estudiamos inglés todos los días.', 'study', 'studies'],
        ['They live near the park.', 'Viven cerca del parque.', 'live', 'lives'],
        ['You walk to school.', 'Caminas a la escuela.', 'walk', 'walks'],
        ['I drink water at lunch.', 'Bebo agua en el almuerzo.', 'drink', 'drinks'],
        ['We cook dinner at home.', 'Cocinamos la cena en casa.', 'cook', 'cooks'],
        ['They play soccer on Saturdays.', 'Juegan fútbol los sábados.', 'play', 'plays'],
        ['I read before bed.', 'Leo antes de dormir.', 'read', 'reads'],
      ],
    },
    {
      title: 'Tercera persona -s',
      intro:
        'Con he/she/it añade -s. Usa -es tras -ch, -sh, -s y -o: watches, goes. Una consonante + y cambia a -ies: study → studies.',
      sentences: [
        ['She works at a hospital.', 'Ella trabaja en un hospital.', 'works', 'work'],
        ['He watches the news.', 'Él mira las noticias.', 'watches', 'watch'],
        ['My brother studies math.', 'Mi hermano estudia matemáticas.', 'studies', 'study'],
        ['The bus goes downtown.', 'El autobús va al centro.', 'goes', 'go'],
        ['Ana teaches English.', 'Ana enseña inglés.', 'teaches', 'teach'],
        ['My cat sleeps on the sofa.', 'Mi gato duerme en el sofá.', 'sleeps', 'sleep'],
        ['He has breakfast at seven.', 'Él desayuna a las siete.', 'has', 'have'],
        ['She carries a blue bag.', 'Ella lleva un bolso azul.', 'carries', 'carry'],
      ],
    },
    {
      title: 'Adverbios de frecuencia',
      intro:
        'Always, usually, often, sometimes y never expresan frecuencia. Suelen ir antes del verbo principal, pero después de be: She is always kind.',
      sentences: [
        ['I always drink tea in the morning.', 'Siempre bebo té por la mañana.', 'always', 'every'],
        ['She usually takes the bus.', 'Ella normalmente toma el autobús.', 'takes', 'take'],
        [
          'We often visit our family.',
          'Visitamos a nuestra familia con frecuencia.',
          'visit',
          'visits',
        ],
        ['He never eats meat.', 'Él nunca come carne.', 'eats', 'eat'],
        ['They sometimes work on Sundays.', 'A veces trabajan los domingos.', 'work', 'works'],
        ['She is always on time.', 'Ella siempre llega a tiempo.', 'is', 'are'],
        ['I usually get up early.', 'Normalmente me levanto temprano.', 'get', 'gets'],
        [
          'My parents rarely watch television.',
          'Mis padres rara vez ven televisión.',
          'watch',
          'watches',
        ],
      ],
    },
    {
      title: 'Contar tu rutina',
      intro:
        'Organiza tu día con in the morning, after work y at night. Usa presente simple para hábitos, aunque no estén sucediendo en este momento.',
      sentences: [
        ['I get up at six.', 'Me levanto a las seis.', 'get', 'gets'],
        ['She starts work at eight.', 'Ella empieza a trabajar a las ocho.', 'starts', 'start'],
        ['We have lunch at noon.', 'Almorzamos al mediodía.', 'have', 'has'],
        ['He goes home after work.', 'Él vuelve a casa después del trabajo.', 'goes', 'go'],
        ['I exercise in the evening.', 'Hago ejercicio por la tarde.', 'exercise', 'exercises'],
        ['They do their homework at night.', 'Hacen su tarea por la noche.', 'do', 'does'],
        ['My family eats together.', 'Mi familia come junta.', 'eats', 'eat'],
        [
          'She brushes her teeth before bed.',
          'Ella se cepilla los dientes antes de dormir.',
          'brushes',
          'brush',
        ],
      ],
    },
  ],
  [
    {
      title: 'Do y does',
      intro:
        'Usa Do con I/you/we/they y Does con he/she/it para preguntar por hábitos. Después de does, el verbo vuelve a su forma base.',
      sentences: [
        ['Do you like music?', '¿Te gusta la música?', 'Do', 'Does'],
        ['Does she work here?', '¿Ella trabaja aquí?', 'Does', 'Do'],
        ['Do they speak English?', '¿Ellos hablan inglés?', 'Do', 'Does'],
        ['Does he play the guitar?', '¿Él toca la guitarra?', 'play', 'plays'],
        ['Do we need tickets?', '¿Necesitamos boletos?', 'Do', 'Does'],
        ['Does your sister study here?', '¿Tu hermana estudia aquí?', 'study', 'studies'],
        ['Do you have a pen?', '¿Tienes un bolígrafo?', 'have', 'has'],
        ['Does this train stop here?', '¿Este tren se detiene aquí?', 'stop', 'stops'],
      ],
    },
    {
      title: 'Preguntas de información',
      intro:
        'Coloca where, when, what, why o how antes de do/does: Where do you live? Con what time puedes preguntar una hora.',
      sentences: [
        ['Where do you live?', '¿Dónde vives?', 'do', 'does'],
        ['What does she teach?', '¿Qué enseña ella?', 'does', 'do'],
        ['When do they start?', '¿Cuándo empiezan?', 'do', 'does'],
        ['Why does he walk to work?', '¿Por qué camina él al trabajo?', 'does', 'do'],
        ['How do you get home?', '¿Cómo llegas a casa?', 'do', 'does'],
        ['What time does the store open?', '¿A qué hora abre la tienda?', 'open', 'opens'],
        ['Where does your uncle work?', '¿Dónde trabaja tu tío?', 'work', 'works'],
        ['What do we need?', '¿Qué necesitamos?', 'do', 'does'],
      ],
    },
    {
      title: 'Negaciones',
      intro:
        'Usa do not (don’t) o does not (doesn’t) + verbo base. En He doesn’t work, la -s ya está en does y no se repite en work.',
      sentences: [
        ['I do not drink coffee.', 'No bebo café.', 'do', 'does'],
        ['She does not drive.', 'Ella no conduce.', 'does', 'do'],
        ['They do not work on Sundays.', 'No trabajan los domingos.', 'work', 'works'],
        ['He does not eat fish.', 'Él no come pescado.', 'eat', 'eats'],
        ['We do not need help.', 'No necesitamos ayuda.', 'do', 'does'],
        ['My dog does not like rain.', 'A mi perro no le gusta la lluvia.', 'like', 'likes'],
        ['You do not have to wait.', 'No tienes que esperar.', 'have', 'has'],
        ['The museum does not open on Mondays.', 'El museo no abre los lunes.', 'open', 'opens'],
      ],
    },
    {
      title: 'Una entrevista básica',
      intro:
        'En una conversación breve, pregunta por trabajo, horarios e intereses. Escucha qué información pide cada palabra interrogativa.',
      sentences: [
        ['What do you do?', '¿A qué te dedicas?', 'do', 'does'],
        ['Where does your team work?', '¿Dónde trabaja tu equipo?', 'does', 'do'],
        ['Do you enjoy your job?', '¿Disfrutas tu trabajo?', 'Do', 'Does'],
        ['I work with children.', 'Trabajo con niños.', 'work', 'works'],
        ['She speaks two languages.', 'Ella habla dos idiomas.', 'speaks', 'speak'],
        ['What time do you finish?', '¿A qué hora terminas?', 'do', 'does'],
        ['He does not work at night.', 'Él no trabaja de noche.', 'work', 'works'],
        ['We help people every day.', 'Ayudamos a las personas todos los días.', 'help', 'helps'],
      ],
    },
  ],
  [
    {
      title: 'Pasado regular',
      intro:
        'Para acciones terminadas, muchos verbos añaden -ed: work → worked. Con verbos que terminan en e añade -d; study cambia a studied.',
      sentences: [
        ['I worked yesterday.', 'Trabajé ayer.', 'worked', 'work'],
        ['She visited her aunt.', 'Ella visitó a su tía.', 'visited', 'visits'],
        ['We watched a movie last night.', 'Vimos una película anoche.', 'watched', 'watch'],
        ['He studied on Saturday.', 'Él estudió el sábado.', 'studied', 'study'],
        ['They played in the park.', 'Ellos jugaron en el parque.', 'played', 'plays'],
        ['I cleaned my room.', 'Limpié mi habitación.', 'cleaned', 'clean'],
        ['The train arrived at noon.', 'El tren llegó al mediodía.', 'arrived', 'arrive'],
        ['We danced at the party.', 'Bailamos en la fiesta.', 'danced', 'dance'],
      ],
    },
    {
      title: 'Pasado irregular',
      intro:
        'Algunos verbos cambian de forma: go → went, eat → ate, have → had. Estas formas sirven con todos los sujetos en pasado afirmativo.',
      sentences: [
        ['I went to the market.', 'Fui al mercado.', 'went', 'goed'],
        ['She ate breakfast early.', 'Ella desayunó temprano.', 'ate', 'eated'],
        ['We had a good time.', 'La pasamos bien.', 'had', 'haved'],
        ['He bought a new phone.', 'Él compró un teléfono nuevo.', 'bought', 'buyed'],
        ['They saw a rainbow.', 'Ellos vieron un arcoíris.', 'saw', 'seed'],
        ['I took the bus yesterday.', 'Tomé el autobús ayer.', 'took', 'taked'],
        ['She wrote a letter.', 'Ella escribió una carta.', 'wrote', 'writed'],
        ['We made dinner together.', 'Preparamos la cena juntos.', 'made', 'maked'],
      ],
    },
    {
      title: 'Did y did not',
      intro:
        'Para preguntar o negar en pasado usa did o did not + verbo base: Did you go? I did not go. No combines did con went.',
      sentences: [
        ['Did you call your mother?', '¿Llamaste a tu madre?', 'Did', 'Do'],
        ['She did not go to work.', 'Ella no fue al trabajo.', 'go', 'went'],
        ['Did he finish the report?', '¿Él terminó el informe?', 'finish', 'finished'],
        ['We did not watch the game.', 'No vimos el partido.', 'watch', 'watched'],
        ['Where did they stay?', '¿Dónde se alojaron?', 'did', 'do'],
        ['I did not buy anything.', 'No compré nada.', 'buy', 'bought'],
        ['Did you see the message?', '¿Viste el mensaje?', 'see', 'saw'],
        ['He did not eat lunch.', 'Él no almorzó.', 'eat', 'ate'],
      ],
    },
    {
      title: 'Contar una historia breve',
      intro:
        'Cuenta eventos terminados con pasado simple. Usa first, then y finally para mostrar el orden de lo que pasó.',
      sentences: [
        ['First, we visited the museum.', 'Primero, visitamos el museo.', 'visited', 'visit'],
        ['Then, we ate at a small cafe.', 'Luego, comimos en un café pequeño.', 'ate', 'eat'],
        ['It rained in the afternoon.', 'Llovió por la tarde.', 'rained', 'rains'],
        ['We took a taxi home.', 'Tomamos un taxi a casa.', 'took', 'take'],
        ['I lost my keys yesterday.', 'Perdí mis llaves ayer.', 'lost', 'lose'],
        ['My friend helped me.', 'Mi amigo me ayudó.', 'helped', 'helps'],
        [
          'Finally, I found them in my bag.',
          'Finalmente, las encontré en mi bolso.',
          'found',
          'find',
        ],
        ['We were happy at the end.', 'Al final estábamos felices.', 'were', 'are'],
      ],
    },
  ],
  [
    {
      title: 'Present continuous',
      intro:
        'Para una acción en curso usa am/is/are + verbo con -ing: I am reading. No olvides el verbo be.',
      sentences: [
        ['I am reading a book.', 'Estoy leyendo un libro.', 'am', 'is'],
        ['She is cooking dinner.', 'Ella está cocinando la cena.', 'cooking', 'cook'],
        ['They are playing outside.', 'Ellos están jugando afuera.', 'are', 'is'],
        ['We are learning English.', 'Estamos aprendiendo inglés.', 'learning', 'learn'],
        ['He is waiting for the bus.', 'Él está esperando el autobús.', 'is', 'are'],
        ['You are speaking clearly.', 'Estás hablando con claridad.', 'speaking', 'speak'],
        ['The baby is sleeping.', 'El bebé está durmiendo.', 'sleeping', 'sleeps'],
        ['I am writing an email.', 'Estoy escribiendo un correo.', 'writing', 'write'],
      ],
    },
    {
      title: 'Hábitos y acciones actuales',
      intro:
        'El presente simple describe hábitos; el continuo describe lo que pasa ahora. Every day suele indicar hábito y right now, una acción en curso.',
      sentences: [
        ['She works every Monday.', 'Ella trabaja todos los lunes.', 'works', 'is working'],
        [
          'She is working right now.',
          'Ella está trabajando en este momento.',
          'is working',
          'works',
        ],
        [
          'We usually walk to school.',
          'Normalmente caminamos a la escuela.',
          'walk',
          'are walking',
        ],
        ['We are taking a taxi today.', 'Hoy estamos tomando un taxi.', 'are taking', 'take'],
        ['He drinks tea every morning.', 'Él bebe té todas las mañanas.', 'drinks', 'is drinking'],
        ['He is drinking water now.', 'Él está bebiendo agua ahora.', 'is drinking', 'drinks'],
        ['They play soccer on Fridays.', 'Ellos juegan fútbol los viernes.', 'play', 'are playing'],
        [
          'They are watching a movie at the moment.',
          'Ellos están viendo una película en este momento.',
          'are watching',
          'watch',
        ],
      ],
    },
    {
      title: 'Verbos y contexto',
      intro:
        'Algunos verbos como know, want y like suelen expresar estados y usan presente simple. Observa el significado, no solo una palabra de tiempo.',
      sentences: [
        ['I know the answer.', 'Sé la respuesta.', 'know', 'am knowing'],
        ['She wants a glass of water.', 'Ella quiere un vaso de agua.', 'wants', 'is wanting'],
        ['We like this song.', 'Nos gusta esta canción.', 'like', 'are liking'],
        ['He is looking for his keys.', 'Él está buscando sus llaves.', 'is looking', 'look'],
        ['They need more time.', 'Necesitan más tiempo.', 'need', 'are needing'],
        ['I am listening to you.', 'Te estoy escuchando.', 'am listening', 'listen'],
        ['The soup smells good.', 'La sopa huele bien.', 'smells', 'is smelling'],
        [
          'She is talking to a customer.',
          'Ella está hablando con un cliente.',
          'is talking',
          'talk',
        ],
      ],
    },
    {
      title: 'Describir una escena',
      intro:
        'Describe lo que ves con be + -ing. Para preguntar, invierte be y el sujeto: What are they doing?',
      sentences: [
        ['A woman is crossing the street.', 'Una mujer está cruzando la calle.', 'is', 'are'],
        ['Two children are riding bikes.', 'Dos niños están montando bicicleta.', 'are', 'is'],
        ['A man is carrying a box.', 'Un hombre está cargando una caja.', 'carrying', 'carry'],
        ['The birds are flying.', 'Los pájaros están volando.', 'flying', 'fly'],
        ['Is the driver waiting?', '¿El conductor está esperando?', 'Is', 'Are'],
        ['What are they doing?', '¿Qué están haciendo?', 'are', 'is'],
        ['The dog is not running.', 'El perro no está corriendo.', 'running', 'run'],
        [
          'We are sitting near the window.',
          'Estamos sentados cerca de la ventana.',
          'sitting',
          'sit',
        ],
      ],
    },
  ],
  [
    {
      title: 'Planes con going to',
      intro:
        'Usa am/is/are going to + verbo base para un plan decidido antes de hablar: I am going to travel.',
      sentences: [
        ['I am going to travel tomorrow.', 'Voy a viajar mañana.', 'am', 'is'],
        ['She is going to study medicine.', 'Ella va a estudiar medicina.', 'study', 'studies'],
        ['We are going to visit our cousins.', 'Vamos a visitar a nuestros primos.', 'are', 'is'],
        ['He is going to cook tonight.', 'Él va a cocinar esta noche.', 'cook', 'cooks'],
        ['They are going to buy tickets.', 'Ellos van a comprar boletos.', 'buy', 'bought'],
        ['You are going to enjoy the trip.', 'Vas a disfrutar el viaje.', 'are', 'is'],
        ['It is going to rain.', 'Va a llover.', 'rain', 'rains'],
        ['I am going to learn to swim.', 'Voy a aprender a nadar.', 'learn', 'learned'],
      ],
    },
    {
      title: 'Decisiones con will',
      intro:
        'Usa will + verbo base para una decisión en el momento, una oferta o una predicción. Will no cambia con el sujeto.',
      sentences: [
        ['I will help you.', 'Te ayudaré.', 'will', 'am'],
        ['She will call later.', 'Ella llamará más tarde.', 'call', 'calls'],
        ['We will be there at nine.', 'Estaremos allí a las nueve.', 'be', 'are'],
        ['He will carry your bag.', 'Él llevará tu bolso.', 'carry', 'carries'],
        ['I think it will be sunny.', 'Creo que estará soleado.', 'will', 'is'],
        ['They will arrive soon.', 'Ellos llegarán pronto.', 'arrive', 'arrives'],
        ['I will open the door.', 'Abriré la puerta.', 'open', 'opened'],
        ['You will feel better tomorrow.', 'Te sentirás mejor mañana.', 'feel', 'feels'],
      ],
    },
    {
      title: 'Preguntas sobre el futuro',
      intro:
        'Con will, coloca will antes del sujeto. Con going to, mueve be: Are you going to travel? Para negar will, puedes usar will not o won’t.',
      sentences: [
        ['Will you join us?', '¿Te unirás a nosotros?', 'Will', 'Do'],
        ['Are they going to move?', '¿Ellos se van a mudar?', 'Are', 'Is'],
        ['What will she do?', '¿Qué hará ella?', 'do', 'does'],
        ['Where are you going to stay?', '¿Dónde te vas a alojar?', 'are', 'is'],
        ['He will not be late.', 'Él no llegará tarde.', 'be', 'is'],
        ['We are not going to drive.', 'No vamos a conducir.', 'drive', 'driving'],
        ['Will the store be open?', '¿La tienda estará abierta?', 'be', 'is'],
        [
          'Is she going to apply for the job?',
          '¿Ella va a postularse al trabajo?',
          'apply',
          'applies',
        ],
      ],
    },
    {
      title: 'Planear un viaje',
      intro:
        'Combina planes, reservas y preguntas para organizar un viaje. Going to explica tus planes; will puede servir para ofrecer ayuda.',
      sentences: [
        ['We are going to stay for three days.', 'Vamos a quedarnos tres días.', 'stay', 'staying'],
        ['I will book the hotel.', 'Reservaré el hotel.', 'book', 'books'],
        ['Our flight will leave at noon.', 'Nuestro vuelo saldrá al mediodía.', 'leave', 'leaves'],
        [
          'Are you going to pack tonight?',
          '¿Vas a preparar tu maleta esta noche?',
          'pack',
          'packed',
        ],
        ['She is going to bring a map.', 'Ella va a llevar un mapa.', 'bring', 'brings'],
        ['We will not rent a car.', 'No alquilaremos un auto.', 'rent', 'rented'],
        ['What will the weather be like?', '¿Cómo estará el clima?', 'be', 'is'],
        ['They are going to visit the beach.', 'Ellos van a visitar la playa.', 'are', 'is'],
      ],
    },
  ],
  [
    {
      title: 'Have y has + participio',
      intro:
        'El presente perfecto usa have/has + participio. Usa has con he/she/it y have con los demás sujetos. No es lo mismo que pasado simple.',
      sentences: [
        ['I have visited Brazil.', 'He visitado Brasil.', 'have', 'has'],
        ['She has finished her homework.', 'Ella ha terminado su tarea.', 'has', 'have'],
        ['We have eaten lunch.', 'Hemos almorzado.', 'eaten', 'ate'],
        ['He has written a book.', 'Él ha escrito un libro.', 'written', 'wrote'],
        ['They have seen this movie.', 'Ellos han visto esta película.', 'seen', 'saw'],
        ['You have done a good job.', 'Has hecho un buen trabajo.', 'done', 'did'],
        ['My brother has lost his keys.', 'Mi hermano ha perdido sus llaves.', 'has', 'have'],
        ['I have learned a new word.', 'He aprendido una palabra nueva.', 'learned', 'learn'],
      ],
    },
    {
      title: 'Experiencias con ever y never',
      intro:
        'Pregunta por experiencias con Have you ever...? Responde con have/has + participio. Never ya tiene sentido negativo: I have never flown.',
      sentences: [
        ['Have you ever tried sushi?', '¿Alguna vez has probado sushi?', 'Have', 'Has'],
        ['She has never traveled abroad.', 'Ella nunca ha viajado al extranjero.', 'has', 'have'],
        ['We have been to that museum.', 'Hemos ido a ese museo.', 'been', 'went'],
        ['Has he ever ridden a horse?', '¿Alguna vez ha montado a caballo?', 'ridden', 'rode'],
        ['I have never seen snow.', 'Nunca he visto nieve.', 'seen', 'saw'],
        ['They have met the new manager.', 'Ellos han conocido al nuevo gerente.', 'met', 'meet'],
        ['Have you ever sung in public?', '¿Alguna vez has cantado en público?', 'sung', 'sang'],
        ['My sister has won a prize.', 'Mi hermana ha ganado un premio.', 'won', 'win'],
      ],
    },
    {
      title: 'Pasado y presente perfecto',
      intro:
        'Usa pasado simple con un momento terminado, como yesterday o in 2020. El presente perfecto conecta una experiencia o resultado con el presente sin precisar ese momento.',
      sentences: [
        ['I visited Lima last year.', 'Visité Lima el año pasado.', 'visited', 'have visited'],
        [
          'I have visited Lima three times.',
          'He visitado Lima tres veces.',
          'have visited',
          'has visited',
        ],
        [
          'She finished the report yesterday.',
          'Ella terminó el informe ayer.',
          'finished',
          'has finished',
        ],
        ['She has already finished the report.', 'Ella ya ha terminado el informe.', 'has', 'have'],
        ['We went to the beach on Sunday.', 'Fuimos a la playa el domingo.', 'went', 'have gone'],
        ['We have never been to Canada.', 'Nunca hemos ido a Canadá.', 'been', 'went'],
        ['He bought this car in 2021.', 'Él compró este auto en 2021.', 'bought', 'has bought'],
        ['Have you seen my phone?', '¿Has visto mi teléfono?', 'seen', 'saw'],
      ],
    },
    {
      title: 'Contar experiencias',
      intro:
        'Presenta una experiencia con presente perfecto y agrega detalles terminados con pasado simple. Yet se usa a menudo en preguntas y negaciones.',
      sentences: [
        ['I have worked in a restaurant.', 'He trabajado en un restaurante.', 'have', 'has'],
        ['I started there in 2022.', 'Empecé allí en 2022.', 'started', 'have started'],
        ['She has just arrived.', 'Ella acaba de llegar.', 'has', 'have'],
        ['Have they finished yet?', '¿Ya han terminado?', 'Have', 'Has'],
        ['We have not decided yet.', 'Todavía no hemos decidido.', 'decided', 'decide'],
        ['He has lived here for two years.', 'Él ha vivido aquí durante dos años.', 'for', 'since'],
        ['I have known her since 2019.', 'La conozco desde 2019.', 'since', 'for'],
        ['It was a useful experience.', 'Fue una experiencia útil.', 'was', 'is'],
      ],
    },
  ],
  [
    {
      title: 'En el aeropuerto',
      intro:
        'Usa frases corteses para pedir información: Where is...? Could you help me? Ten a mano palabras como gate, passport y boarding pass.',
      sentences: [
        ['Where is gate twelve?', '¿Dónde está la puerta doce?', 'is', 'are'],
        ['I have a reservation.', 'Tengo una reserva.', 'have', 'has'],
        ['Here is my passport.', 'Aquí está mi pasaporte.', 'is', 'are'],
        ['Could you help me?', '¿Podría ayudarme?', 'help', 'helps'],
        ['What time does boarding start?', '¿A qué hora empieza el abordaje?', 'start', 'starts'],
        ['I would like a window seat.', 'Quisiera un asiento junto a la ventana.', 'would', 'am'],
        ['Is this the line for security?', '¿Esta es la fila para seguridad?', 'Is', 'Are'],
        ['My flight is delayed.', 'Mi vuelo está retrasado.', 'is', 'are'],
      ],
    },
    {
      title: 'En el trabajo',
      intro:
        'Presenta tu experiencia con claridad y pide que repitan cuando lo necesites. Could you repeat that? es una herramienta útil, no una señal de fracaso.',
      sentences: [
        [
          'I have experience in customer service.',
          'Tengo experiencia en atención al cliente.',
          'have',
          'has',
        ],
        ['I work well with a team.', 'Trabajo bien en equipo.', 'work', 'works'],
        ['Could you repeat that, please?', '¿Podría repetir eso, por favor?', 'repeat', 'repeats'],
        ['I am available on Monday.', 'Estoy disponible el lunes.', 'am', 'is'],
        ['She is responsible for the schedule.', 'Ella es responsable del horario.', 'is', 'are'],
        ['We need to finish this task.', 'Necesitamos terminar esta tarea.', 'finish', 'finishing'],
        ['When does the meeting start?', '¿Cuándo empieza la reunión?', 'start', 'starts'],
        ['Thank you for your time.', 'Gracias por su tiempo.', 'your', 'you'],
      ],
    },
    {
      title: 'Resolver un problema',
      intro:
        'Explica el problema, pide una solución y confirma la información. Usa un tono cortés: Could I...? I need help with...',
      sentences: [
        ['I need help with my ticket.', 'Necesito ayuda con mi boleto.', 'need', 'needs'],
        ['There is a mistake in my name.', 'Hay un error en mi nombre.', 'is', 'are'],
        ['Could I change my reservation?', '¿Podría cambiar mi reserva?', 'change', 'changed'],
        ['My bag has not arrived.', 'Mi bolso no ha llegado.', 'has', 'have'],
        ['Where can I get help?', '¿Dónde puedo conseguir ayuda?', 'get', 'gets'],
        ['The internet is not working.', 'El internet no está funcionando.', 'working', 'work'],
        ['Can you show me the address?', '¿Puede mostrarme la dirección?', 'show', 'shows'],
        ['I understand now. Thank you.', 'Ahora entiendo. Gracias.', 'understand', 'understands'],
      ],
    },
    {
      title: 'Tu misión final',
      intro:
        'Integra lo aprendido para hablar de ti, de tu experiencia y de tus planes. Puedes escribir antes de practicar en voz alta; la voz es opcional.',
      sentences: [
        ['I am looking for a new job.', 'Estoy buscando un trabajo nuevo.', 'looking', 'look'],
        ['I worked in a hotel last year.', 'Trabajé en un hotel el año pasado.', 'worked', 'work'],
        ['I have learned a lot.', 'He aprendido mucho.', 'have', 'has'],
        ['I am going to study more.', 'Voy a estudiar más.', 'study', 'studies'],
        ['Do you need any more information?', '¿Necesita más información?', 'Do', 'Does'],
        ['I can start next week.', 'Puedo empezar la próxima semana.', 'start', 'starts'],
        ['We will contact you soon.', 'Nos pondremos en contacto con usted pronto.', 'will', 'are'],
        ['It was nice to meet you.', 'Fue un gusto conocerle.', 'was', 'is'],
      ],
    },
  ],
];
const unitDefinitions = [
  [
    'Say hello',
    'Primeras palabras',
    'Preséntate y habla de quién eres',
    'A1',
    'grammar.be',
    'grammar.pronouns',
  ],
  [
    'Daily routines',
    'Tu día a día',
    'Habla de tus hábitos y rutinas',
    'A1',
    'grammar.present_simple',
    'grammar.third_person_s',
  ],
  [
    'Ask & answer',
    'Pregunta y conecta',
    'Haz preguntas y expresa negaciones',
    'A1',
    'grammar.questions',
    'grammar.negation',
  ],
  [
    'Yesterday',
    'Historias de ayer',
    'Cuenta lo que pasó',
    'A1',
    'grammar.past_regular',
    'grammar.past_irregular',
  ],
  [
    'Happening now',
    'Aquí y ahora',
    'Distingue hábitos y acciones actuales',
    'A1',
    'grammar.present_continuous',
    'grammar.tense_choice',
  ],
  [
    'Future plans',
    'Lo que viene',
    'Comparte tus planes y decisiones',
    'A2',
    'grammar.going_to',
    'grammar.will',
  ],
  [
    'Life experiences',
    'Tus experiencias',
    'Conecta el pasado con el presente',
    'A2',
    'grammar.present_perfect',
    'grammar.past_vs_perfect',
  ],
  [
    'Real-life missions',
    'Inglés en la vida real',
    'Viaja y trabaja con más confianza',
    'A2',
    'communication.travel',
    'communication.work',
  ],
] as const;
export const lessons: Record<string, PrivateLesson> = {};
export const units: Unit[] = unitDefinitions.map((definition, unitIndex) => {
  const [title, titleEs, description, cefr, skillA, skillB] = definition;
  const id = `u${String(unitIndex + 1).padStart(2, '0')}`;
  const summaries = lessonSeeds[unitIndex]!.map((seed, lessonIndex) => {
    const lessonId = `${id}_l${String(lessonIndex + 1).padStart(2, '0')}`;
    const skills = [skillA, skillB];
    const exercises: PrivateExercise[] = seed.sentences.map(([en, es, focus, wrong], index) => {
      const type: ExerciseType = (
        [
          'single_choice',
          'cloze',
          'reorder',
          'correction',
          'single_choice',
          'cloze',
          'reorder',
          'correction',
        ] as const
      )[index]!;
      const base: PrivateExercise = {
        id: `${lessonId}_e${String(index + 1).padStart(2, '0')}`,
        type,
        promptEs: '',
        skillId: skills[index % 2]!,
        feedbackEs: `${seed.intro} La oración es: “${en}” (${es})`,
        acceptedAnswers: [],
        difficulty: unitIndex + 1,
      };
      if (type === 'single_choice') {
        base.promptEs = 'Elige la palabra o expresión que completa la oración.';
        base.sentence = en.replace(new RegExp(`\\b${focus}\\b`), '____');
        const answerPosition = (index + lessonIndex + unitIndex) % 2;
        base.options = [
          { id: 'a', text: answerPosition === 0 ? focus : wrong },
          { id: 'b', text: answerPosition === 1 ? focus : wrong },
        ];
        base.correctOptionId = answerPosition === 0 ? 'a' : 'b';
        base.acceptedAnswers = [focus];
      } else if (type === 'cloze') {
        base.promptEs = 'Completa la oración. Escribe solo la parte que falta.';
        base.sentence = en.replace(new RegExp(`\\b${focus}\\b`), '____');
        base.acceptedAnswers = [focus];
      } else if (type === 'reorder') {
        base.promptEs = 'Ordena las palabras para formar la oración.';
        const tokens = en.split(' ');
        base.tokens = [
          ...tokens.slice(Math.ceil(tokens.length / 2)),
          ...tokens.slice(0, Math.ceil(tokens.length / 2)),
        ];
        base.acceptedAnswers = [en];
      } else {
        base.promptEs = 'Corrige la oración y escríbela completa.';
        base.sentence = en.replace(new RegExp(`\\b${focus}\\b`), wrong);
        base.acceptedAnswers = [en];
      }
      return base;
    });
    // Productive recall follows recognition, using no English answer in the prompt.
    for (const [extraIndex, seedIndex] of [0, 5].entries()) {
      const [en, es] = seed.sentences[seedIndex]!;
      exercises.push({
        id: `${lessonId}_e${extraIndex + 9}`,
        type: 'short_text',
        promptEs: `Escribe en inglés: «${es}»`,
        skillId: skills[extraIndex % 2]!,
        feedbackEs: `Una forma de expresarlo es: “${en}”. ${seed.intro}`,
        acceptedAnswers: [en],
        difficulty: unitIndex + 1,
      });
    }
    lessons[lessonId] = {
      id: lessonId,
      unitId: id,
      title: seed.title,
      introEs: seed.intro,
      examples: seed.sentences.slice(0, 2).map(([en, es]) => ({ en, es })),
      speakingText: seed.sentences[0]![0],
      exercises,
      estimatedMinutes: 7,
    };
    return { id: lessonId, title: seed.title, estimatedMinutes: 7, skills, seq: lessonIndex + 1 };
  });
  return { id, title, titleEs, description, cefr, lessons: summaries };
});
export function publicExercise(exercise: PrivateExercise) {
  const {
    acceptedAnswers: _answers,
    correctOptionId: _option,
    feedbackEs: _feedback,
    ...publicData
  } = exercise;
  return publicData;
}
export { challengePools, challengePools as challengeQuestions } from './challenges.ts';

export interface SpeechDrill {
  id: string;
  category: string;
  titleEs: string;
  textEn: string;
  tipEs: string;
}
const speechGroups = [
  {
    category: 'short_long_vowels',
    titleEs: 'Vocales: /ɪ/ y /iː/',
    tipEs: 'Escucha el contraste entre una vocal breve y una más larga. Tu acento no es un error.',
    texts: [
      'The ship is near the sheep.',
      'Please sit in this seat.',
      'I live here, but I leave tomorrow.',
      'A little bit of a steady beat.',
      'Fill the glass and feel the water.',
    ],
  },
  {
    category: 'b_v',
    titleEs: 'Sonidos /b/ y /v/',
    tipEs:
      'Para /v/, acerca los dientes superiores al labio inferior. Compara con el cierre de ambos labios en /b/.',
    texts: [
      'This berry is very sweet.',
      'The best vest is blue.',
      'The van is next to the bank.',
      'We vote near the boat.',
      'The blue bow is very bright.',
    ],
  },
  {
    category: 'th_voiceless',
    titleEs: 'El sonido /θ/',
    tipEs:
      'Deja pasar el aire suavemente entre la lengua y los dientes en think. Practica sin presión.',
    texts: [
      'I think we can do it.',
      'There are three books.',
      'Thank you for your help.',
      'The paper is very thin.',
      'The bath is warm.',
    ],
  },
  {
    category: 'th_voiced',
    titleEs: 'El sonido /ð/',
    tipEs:
      'En this, deja vibrar la voz suavemente. No se evalúa tu acento; aquí solo puedes escuchar y comparar.',
    texts: [
      'This is my notebook.',
      'That is a good idea.',
      'Those are my friends.',
      'My mother is a teacher.',
      'The weather is nice today.',
    ],
  },
  {
    category: 's_clusters',
    titleEs: 'Palabras que empiezan con s',
    tipEs: 'Escucha cómo la s se une con la consonante siguiente. No hace falta hablar rápido.',
    texts: [
      'The school opens at eight.',
      'We live on this street.',
      'I study after work.',
      'Please speak slowly.',
      'Spring is my favorite season.',
    ],
  },
  {
    category: 'final_consonants',
    titleEs: 'Consonantes al final',
    tipEs:
      'Escucha la terminación de la palabra. Conserva los sonidos finales sin añadir una vocal extra.',
    texts: [
      'I worked at home yesterday.',
      'She asked a question.',
      'They helped their neighbor.',
      'We need some milk.',
      'The next stop is downtown.',
    ],
  },
  {
    category: 'sh_ch',
    titleEs: 'Sonidos /ʃ/ y /tʃ/',
    tipEs:
      'Compara el aire continuo de sh con el inicio breve de ch. Escucha y vuelve a intentarlo cuando quieras.',
    texts: [
      'The ship has a small chip.',
      'We shop before we chop vegetables.',
      'The sheep is not cheap.',
      'Wash your hands and watch the water.',
      'Please share this chair.',
    ],
  },
  {
    category: 'stress_schwa',
    titleEs: 'Ritmo y acento de palabras',
    tipEs:
      'Escucha qué sílaba recibe más fuerza. Las demás pueden sonar más suaves; no todas necesitan igual énfasis.',
    texts: [
      'Tell me about your day.',
      'Today is a good day.',
      'The hotel is near the station.',
      'I would like a banana.',
      'Your ideas are important.',
    ],
  },
] as const;
export const speechDrills: SpeechDrill[] = speechGroups.flatMap((group, groupIndex) =>
  group.texts.map((textEn, index) => ({
    id: `speech_${groupIndex + 1}_${index + 1}`,
    category: group.category,
    titleEs: group.titleEs,
    textEn,
    tipEs: group.tipEs,
  })),
);

function placement(
  id: number,
  sentence: string,
  answer: string,
  wrong: string,
  skillId: string,
  feedbackEs: string,
): PrivateExercise {
  const options =
    id % 2
      ? [
          { id: 'a', text: wrong },
          { id: 'b', text: answer },
        ]
      : [
          { id: 'a', text: answer },
          { id: 'b', text: wrong },
        ];
  return {
    id: `placement_${String(id).padStart(2, '0')}`,
    type: 'single_choice',
    promptEs: 'Elige la opción que completa la oración. Puedes tomarte el tiempo que necesites.',
    sentence,
    options,
    skillId,
    feedbackEs,
    acceptedAnswers: [answer],
    correctOptionId: id % 2 ? 'b' : 'a',
    difficulty: Math.ceil(id / 2),
  };
}
export const placementQuestions: PrivateExercise[] = [
  placement(1, 'I ____ a student.', 'am', 'is', 'grammar.be', 'Con I se usa am: I am a student.'),
  placement(
    2,
    '____ she your sister?',
    'Is',
    'Are',
    'grammar.be',
    'En preguntas con she, usa Is antes del sujeto.',
  ),
  placement(
    3,
    'My father ____ in a bank.',
    'works',
    'work',
    'grammar.third_person_s',
    'Con he/she y nombres singulares, agrega -s al verbo.',
  ),
  placement(
    4,
    '____ you like music?',
    'Do',
    'Does',
    'grammar.questions',
    'Con you se usa Do en preguntas de presente simple.',
  ),
  placement(
    5,
    'He does not ____ coffee.',
    'drink',
    'drinks',
    'grammar.negation',
    'Después de does not, usa el verbo base.',
  ),
  placement(
    6,
    'We ____ the museum yesterday.',
    'visited',
    'visit',
    'grammar.past_regular',
    'Yesterday indica un momento pasado terminado: visited.',
  ),
  placement(
    7,
    'She ____ to the market last Saturday.',
    'went',
    'goed',
    'grammar.past_irregular',
    'El pasado de go es went.',
  ),
  placement(
    8,
    'They are ____ dinner right now.',
    'cooking',
    'cook',
    'grammar.present_continuous',
    'El presente continuo combina be con verbo en -ing.',
  ),
  placement(
    9,
    'I am going to ____ tomorrow.',
    'travel',
    'traveling',
    'grammar.going_to',
    'Going to lleva después el verbo base.',
  ),
  placement(
    10,
    'He will ____ you later.',
    'call',
    'calls',
    'grammar.will',
    'Will lleva el verbo base, sin -s.',
  ),
  placement(
    11,
    'Have you ever ____ snow?',
    'seen',
    'saw',
    'grammar.present_perfect',
    'Después de have se usa participio: seen.',
  ),
  placement(
    12,
    'I ____ my homework yesterday.',
    'finished',
    'have finished',
    'grammar.past_vs_perfect',
    'Con un momento terminado como yesterday se usa pasado simple.',
  ),
];
export interface MissionStep {
  id: string;
  speaker: string;
  promptEn: string;
  hintEs: string;
  options: { id: string; text: string; nextStepId?: string }[];
}
export interface Mission {
  id: string;
  titleEs: string;
  descriptionEs: string;
  steps: MissionStep[];
}
export const missions: Mission[] = [
  {
    id: 'airport',
    titleEs: 'Tu vuelo empieza aquí',
    descriptionEs:
      'Practica una conversación en el aeropuerto. Elige cómo responder y avanza sin límite de tiempo.',
    steps: [
      {
        id: 'welcome',
        speaker: 'Agente',
        promptEn: 'Good morning. Where are you flying today?',
        hintEs: 'Saluda e indica tu destino.',
        options: [
          { id: 'a', text: 'Good morning. I am flying to Miami.', nextStepId: 'passport' },
          { id: 'b', text: 'Hello. My flight is to Miami.', nextStepId: 'passport' },
        ],
      },
      {
        id: 'passport',
        speaker: 'Agente',
        promptEn: 'May I see your passport, please?',
        hintEs: 'Puedes entregar tu pasaporte con una frase cortés.',
        options: [
          { id: 'a', text: 'Of course. Here is my passport.', nextStepId: 'seat' },
          { id: 'b', text: 'Yes, here you are.', nextStepId: 'seat' },
        ],
      },
      {
        id: 'seat',
        speaker: 'Agente',
        promptEn: 'Would you like a window seat or an aisle seat?',
        hintEs: 'Window es ventana; aisle es pasillo.',
        options: [
          { id: 'a', text: 'I would like a window seat, please.', nextStepId: 'gate' },
          { id: 'b', text: 'An aisle seat, please.', nextStepId: 'gate' },
        ],
      },
      {
        id: 'gate',
        speaker: 'Agente',
        promptEn: 'Your flight leaves from gate twelve at two. Do you have any questions?',
        hintEs: 'Confirma la puerta o pregunta cuándo empieza el abordaje.',
        options: [
          { id: 'a', text: 'What time does boarding start?', nextStepId: 'boarding' },
          { id: 'b', text: 'Gate twelve. Thank you for your help.', nextStepId: 'goodbye' },
        ],
      },
      {
        id: 'boarding',
        speaker: 'Agente',
        promptEn: 'Boarding starts at one thirty.',
        hintEs: 'Agradece la información. Ya tienes lo necesario para tu vuelo.',
        options: [
          { id: 'a', text: 'Thank you. Have a nice day.', nextStepId: 'goodbye' },
          { id: 'b', text: 'Great, thank you for your help.', nextStepId: 'goodbye' },
        ],
      },
      {
        id: 'goodbye',
        speaker: 'Agente',
        promptEn: 'You are welcome. Have a good flight!',
        hintEs: '¡Misión completada! Pediste información y confirmaste los detalles de tu viaje.',
        options: [],
      },
    ],
  },
  {
    id: 'job',
    titleEs: 'Tu próxima oportunidad',
    descriptionEs:
      'Preséntate en una entrevista breve. Puedes pedir que repitan y elegir respuestas que te ayuden a practicar.',
    steps: [
      {
        id: 'welcome',
        speaker: 'Entrevistadora',
        promptEn: 'Welcome. Please tell me a little about yourself.',
        hintEs: 'Comparte una presentación breve.',
        options: [
          {
            id: 'a',
            text: 'Thank you. I am a student and I enjoy helping people.',
            nextStepId: 'experience',
          },
          {
            id: 'b',
            text: 'Thank you. I am a designer, and I work well with a team.',
            nextStepId: 'experience',
          },
        ],
      },
      {
        id: 'experience',
        speaker: 'Entrevistadora',
        promptEn: 'What experience do you have?',
        hintEs: 'Cuenta una experiencia relevante. También puedes pedir que repitan.',
        options: [
          { id: 'a', text: 'I have worked in customer service.', nextStepId: 'strength' },
          { id: 'b', text: 'Could you repeat that, please?', nextStepId: 'repeat' },
        ],
      },
      {
        id: 'repeat',
        speaker: 'Entrevistadora',
        promptEn: 'Of course. Have you worked with customers before?',
        hintEs: 'Pedir una aclaración es parte de comunicarse bien.',
        options: [
          { id: 'a', text: 'Yes. I helped customers in a small store.', nextStepId: 'strength' },
          { id: 'b', text: 'Not yet, but I am ready to learn.', nextStepId: 'strength' },
        ],
      },
      {
        id: 'strength',
        speaker: 'Entrevistadora',
        promptEn: 'What is one of your strengths?',
        hintEs: 'Menciona una habilidad de forma sencilla.',
        options: [
          { id: 'a', text: 'I listen carefully and I learn quickly.', nextStepId: 'availability' },
          { id: 'b', text: 'I am organized and I enjoy teamwork.', nextStepId: 'availability' },
        ],
      },
      {
        id: 'availability',
        speaker: 'Entrevistadora',
        promptEn: 'When can you start?',
        hintEs: 'Expresa tu disponibilidad.',
        options: [
          { id: 'a', text: 'I can start next Monday.', nextStepId: 'goodbye' },
          { id: 'b', text: 'I am available next week.', nextStepId: 'goodbye' },
        ],
      },
      {
        id: 'goodbye',
        speaker: 'Entrevistadora',
        promptEn: 'Thank you for your time. We will contact you soon.',
        hintEs: '¡Misión completada! Te presentaste y explicaste tu experiencia y disponibilidad.',
        options: [],
      },
    ],
  },
];

/** Provisional game rules from the supplied specification; calibration is pending. */
export const challengeLevels = [
  {
    level: 1,
    name_es: 'Primeros pasos',
    hearts: 5,
    grammar_rush_total_seconds: 180,
    grammar_rush_questions: 10,
    difficulty_tier: 'intro',
    reading_clock_multiplier: 1.7,
    cloze_clock_multiplier: 1.5,
  },
  {
    level: 2,
    name_es: 'Explorador',
    hearts: 5,
    grammar_rush_total_seconds: 160,
    grammar_rush_questions: 10,
    difficulty_tier: 'intro',
    reading_clock_multiplier: 1.642,
    cloze_clock_multiplier: 1.458,
  },
  {
    level: 3,
    name_es: 'Aprendiz',
    hearts: 4,
    grammar_rush_total_seconds: 150,
    grammar_rush_questions: 10,
    difficulty_tier: 'intro',
    reading_clock_multiplier: 1.583,
    cloze_clock_multiplier: 1.417,
  },
  {
    level: 4,
    name_es: 'Aventurero',
    hearts: 4,
    grammar_rush_total_seconds: 140,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.525,
    cloze_clock_multiplier: 1.375,
  },
  {
    level: 5,
    name_es: 'Competidor',
    hearts: 4,
    grammar_rush_total_seconds: 130,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.467,
    cloze_clock_multiplier: 1.333,
  },
  {
    level: 6,
    name_es: 'Experto',
    hearts: 3,
    grammar_rush_total_seconds: 120,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.408,
    cloze_clock_multiplier: 1.292,
  },
  {
    level: 7,
    name_es: 'Maestro',
    hearts: 3,
    grammar_rush_total_seconds: 110,
    grammar_rush_questions: 10,
    difficulty_tier: 'intermediate',
    reading_clock_multiplier: 1.35,
    cloze_clock_multiplier: 1.25,
  },
  {
    level: 8,
    name_es: 'Veterano',
    hearts: 3,
    grammar_rush_total_seconds: 100,
    grammar_rush_questions: 10,
    difficulty_tier: 'advanced',
    reading_clock_multiplier: 1.292,
    cloze_clock_multiplier: 1.208,
  },
  {
    level: 9,
    name_es: 'Élite',
    hearts: 2,
    grammar_rush_total_seconds: 95,
    grammar_rush_questions: 10,
    difficulty_tier: 'advanced',
    reading_clock_multiplier: 1.233,
    cloze_clock_multiplier: 1.167,
  },
  {
    level: 10,
    name_es: 'Campeón',
    hearts: 2,
    grammar_rush_total_seconds: 90,
    grammar_rush_questions: 10,
    difficulty_tier: 'advanced',
    reading_clock_multiplier: 1.175,
    cloze_clock_multiplier: 1.125,
  },
  {
    level: 11,
    name_es: 'Leyenda',
    hearts: 2,
    grammar_rush_total_seconds: 75,
    grammar_rush_questions: 10,
    difficulty_tier: 'extreme',
    reading_clock_multiplier: 1.117,
    cloze_clock_multiplier: 1.083,
  },
  {
    level: 12,
    name_es: 'Imparable',
    hearts: 1,
    grammar_rush_total_seconds: 65,
    grammar_rush_questions: 10,
    difficulty_tier: 'extreme',
    reading_clock_multiplier: 1.058,
    cloze_clock_multiplier: 1.042,
  },
  {
    level: 13,
    name_es: 'Invencible',
    hearts: 1,
    grammar_rush_total_seconds: 55,
    grammar_rush_questions: 10,
    difficulty_tier: 'extreme',
    reading_clock_multiplier: 1.0,
    cloze_clock_multiplier: 1.0,
  },
] as const;
