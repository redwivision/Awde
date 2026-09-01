import { TopicUnit } from '../types';

export const DEFAULT_UNITS: TopicUnit[] = [
  {
    id: 'unit_physics_thermo',
    title: 'Thermodynamics & Heat Transfer',
    titleAmharic: 'ቴርሞዳይናሚክስ እና የሙቀት ዝውውር',
    subject: 'Physics',
    subjectAmharic: 'ፊዚክስ',
    gradeOrLevel: 'Grade 11 National Curriculum',
    textbookSource: 'Ethiopian Ministry of Education Grade 11 Physics Textbook (Unit 4)',
    chapter: 'Unit 4: Thermal Physics & Energy Conservation',
    description: 'Master the principles of thermal equilibrium, heat engines, and the three modes of heat transfer through everyday Ethiopian thermal phenomena.',
    descriptionAmharic: 'የሙቀት ሚዛን፣ የሙቀት ሞተሮች እና ሶስቱ የሙቀት ማስተላለፊያ መንገዶችን በዕለት ተዕለት የኢትዮጵያ ተሞክሮዎች በስፋት ይረዱ።',
    overallMastery: 42,
    createdAt: '2026-08-25',
    nodes: [
      {
        id: 'node_thermo_01',
        label: 'Thermal Equilibrium & Zeroth Law',
        labelAmharic: 'የሙቀት ሚዛን እና ዜሮተኛው ሕግ',
        category: 'Foundation',
        depthLevel: 1,
        masteryScore: 85,
        masteryStatus: 'mastered',
        summary: 'If system A is in thermal equilibrium with B, and B with C, then A and C are in equilibrium. Temperature is the physical quantity that determines whether systems are in equilibrium.',
        summaryAmharic: 'ሁለት አካላት ከሶስተኛ አካል ጋር በተናጠል በሙቀት ሚዛን ላይ ከሆኑ፣ እርስ በርሳቸውም በሙቀት ሚዛን ላይ ናቸው። የሙቀት መጠን (Temperature) የዚህ ሚዛን መለኪያ ነው።',
        keyFormulasOrRules: [
          'T_A = T_B and T_B = T_C => T_A = T_C',
          'Net heat exchange Q_net = 0 at thermal equilibrium'
        ],
        commonMisconceptions: [
          'Confusing heat (energy in transit) with temperature (average kinetic energy of particles).',
          'Thinking two objects of different masses at the same temperature have the same thermal energy.'
        ],
        misconceptionsAmharic: [
          'ሙቀትን (Heat) እና የሙቀት መጠንን (Temperature) አንድ አድርጎ መቁጠር።',
          'የተለያየ ክብደት ያላቸው እቃዎች እኩል ቴምፕሬቸር ቢኖራቸውም እኩል ውስጣዊ ጉልበት አላቸው ብሎ ማሰብ።'
        ],
        localizedAnalogy: {
          title: 'The Jebena Buna (Coffee) Thermometer',
          titleAmharic: 'የጀበና ቡና እና የሲኒ ሙቀት ማነጻጸሪያ',
          context: 'Pouring fresh boiling coffee from a clay Jebena into a ceramic Sini cup.',
          contextAmharic: 'ትኩስ ቡና ከሸክላ ጀበና ወደ ሲኒ ሲቀዳ የሚፈጠር የሙቀት ልውውጥ።',
          culturalElement: 'Jebena Buna Ceremony (የቡና ስነ-ስርዓት)',
          explanation: 'When hot coffee sits in the sini on a cold morning, heat flows until the coffee and cup reach the exact same temperature as the room. Neither gives nor takes net heat anymore — perfectly balanced equilibrium.',
          explanationAmharic: 'ትኩስ ቡና በሲኒ ተቀምጦ ሲቀዘቅዝ፣ የቡናው፣ የሲኒው እና የክፍሉ ሙቀት እኩል እስኪሆን ድረስ ሙቀት ይሸጋገራል። እኩል ሲሆኑ ልውውጡ ይቆማል፤ ይሄ የሙቀት ሚዛን ይባላል።'
        },
        prerequisites: [],
        x: 220,
        y: 120
      },
      {
        id: 'node_thermo_02',
        label: 'First Law of Thermodynamics (Energy Conservation)',
        labelAmharic: 'የቴርሞዳይናሚክስ አንደኛ ሕግ (የጉልበት ጥበቃ)',
        category: 'Core Law',
        depthLevel: 1,
        masteryScore: 60,
        masteryStatus: 'feynman_tested',
        summary: 'The change in internal energy (ΔU) of a closed system equals the heat added to the system (Q) minus the work done by the system on its surroundings (W).',
        summaryAmharic: 'የአንድ ሥርዓት ውስጣዊ ጉልበት ለውጥ (ΔU) ከተሰጠው ሙቀት (Q) ሲቀነስ ሥርዓቱ የሰራው ሥራ (W) ጋር እኩል ነው። ጉልበት አይፈጠርም አይጠፋምም!',
        keyFormulasOrRules: [
          'ΔU = Q - W (or ΔU = Q + W_on)',
          'W = P * ΔV (Isobaric work done during gas expansion)'
        ],
        commonMisconceptions: [
          'Believing work done by a gas creates free energy from nothing.',
          'Ignoring the negative sign when work is done ON the system rather than BY the system.'
        ],
        misconceptionsAmharic: [
          'አንድ ጋዝ ሲሰፋ ሥራ ሲሰራ ጉልበት ከአየር እንደሚፈጠር ማመን።',
          'በሥርዓቱ ላይ ሥራ ሲሰራ እና ሥርዓቱ ራሱ ሥራ ሲሰራ ምልክቶቻቸውን (+/-) ማምታታት።'
        ],
        localizedAnalogy: {
          title: 'Equb Money Pool & Spending Analogy',
          titleAmharic: 'የእቁብ ቁጠባ እና የወጪ ሂሳብ',
          context: 'An Ethiopian Equb savings balance compared to internal thermodynamic energy.',
          contextAmharic: 'የእቁብ ቁጠባ ሂሳብ ከውስጣዊ ጉልበት (Internal Energy) ጋር ማነጻጸር።',
          culturalElement: 'Equb Traditional Finance (እቁብ)',
          explanation: 'Your bank balance change (ΔU) equals deposits (Heat Q added) minus purchases made (Work W done). You cannot spend energy your pocket never received unless your core savings drop!',
          explanationAmharic: 'የእቁብ ገንዘብህ ለውጥ (ΔU) ማለት ያስገባኸው ክፍያ (Q) ሲቀነስ ለግዢ ያወጣኸው (W) ነው። ያልገባ ገንዘብ ልታወጣ አትችልም፤ ኪስህ ከቀነሰ የቆጠብከው ይቀንሳል።'
        },
        prerequisites: ['node_thermo_01'],
        x: 480,
        y: 120
      },
      {
        id: 'node_thermo_03',
        label: 'Conduction, Convection & Radiation',
        labelAmharic: 'ኮንዳክሽን፣ ኮንቬክሽን እና ራዲየሽን (የሙቀት ዝውውር መንገዶች)',
        category: 'Mechanism',
        depthLevel: 2,
        masteryScore: 40,
        masteryStatus: 'learning',
        summary: 'Conduction occurs via direct molecular vibration in solids; Convection through bulk fluid/gas circulation currents; Radiation via electromagnetic waves requiring no physical medium.',
        summaryAmharic: 'ኮንዳክሽን በጠንካራ አካላት ሞለኪውሎች ንክኪ፣ ኮንቬክሽን በፈሳሾች/አየር ዝውውር ሞገዶች፣ ራዲየሽን ደግሞ ያለ ምንም ማስተላለፊያ ቁስ በብርሃን/ኤሌክትሮማግኔቲክ ሞገድ ይጓዛል።',
        keyFormulasOrRules: [
          'Conduction: q = -k * A * (dT/dx) (Fourier\'s Law)',
          'Radiation: P = ε * σ * A * T^4 (Stefan-Boltzmann Law)'
        ],
        commonMisconceptions: [
          'Assuming hot air falls or staying near radiant ember fire is convection.',
          'Thinking metals feel cold because they are at lower temperature, rather than because they are rapid conductors.'
        ],
        misconceptionsAmharic: [
          'የብረት ማብሰያ ሲነካ የሚቀዘቅዘው ቴምፕሬቸሩ ዝቅተኛ ስለሆነ ነው ብሎ ማሰብ (ይልቁንም ፈጣን ሙቀት አስተላላፊ ስለሆነ ነው)።'
        ],
        localizedAnalogy: {
          title: 'The Injera Mitad Baking Heat Trio',
          titleAmharic: 'የእንጀራ ምጣድ እና የእሳት ሙቀት ሦስትዮሽ',
          context: 'Baking injera on a clay Mitad over hot embers in an Ethiopian kitchen.',
          contextAmharic: 'በሸክላ ምጣድ ላይ እንጀራ ሲጋገር የሚከሰቱ ሶስቱ የሙቀት መንገዶች።',
          culturalElement: 'Injera Mitad Cooking (የእንጀራ ምጣድ)',
          explanation: 'Conduction: heat moves through the clay Mitad base directly into the batter. Convection: steam rises upwards lifting the Akebalo lid. Radiation: your hands feel the glowing red ember heat from a distance without touching the fire!',
          explanationAmharic: 'ኮንዳክሽን፡ ከከሰሉ ሙቀቱ በቀጥታ በምጣዱ ሸክላ በኩል ሊጡን ያበስላል። ኮንቬክሽን፡ ትኩስ እንፋሎት ወደ ላይ ወጥቶ አክባሎውን ይገፋል። ራዲየሽን፡ እጅህን ከምጣዱ አጠገብ ሳታስነካው የሚሰማህ የፍም ወላፈን ነው።'
        },
        prerequisites: ['node_thermo_01'],
        x: 220,
        y: 280
      },
      {
        id: 'node_thermo_04',
        label: 'Second Law of Thermodynamics & Entropy',
        labelAmharic: 'የቴርሞዳይናሚክስ ሁለተኛ ሕግ እና ኢንትሮፒ (የስርዓት አልበኝነት)',
        category: 'Core Law',
        depthLevel: 2,
        masteryScore: 10,
        masteryStatus: 'unstudied',
        summary: 'Heat cannot spontaneously flow from a colder to hotter body. In any spontaneous cyclic process, the total entropy (disorder) of an isolated universe always increases (ΔS >= 0).',
        summaryAmharic: 'ሙቀት በራሱ ጊዜ ከቀዝቃዛ ወደ ሞቃት አካል አይፈስም። በማንኛውም የተፈጥሮ ሂደት የዓለማችን አጠቃላይ ኢንትሮፒ (ግርግር/ስርዓት-አልበኝነት) ሁልጊዜ ይጨምራል።',
        keyFormulasOrRules: [
          'ΔS = Q_rev / T',
          'Carnot Efficiency η_max = 1 - (T_cold / T_hot)',
          'No heat engine can be 100% efficient.'
        ],
        commonMisconceptions: [
          'Believing living organisms violate the 2nd law because they create biological order (they dump greater entropy into the surrounding environment).',
          'Thinking entropy is only about physical messiness rather than energy dispersal probability.'
        ],
        misconceptionsAmharic: [
          'ማቀዝቀዣ (Refrigerator) ሙቀትን ከቀዝቃዛ ወደ ሞቃት የሚያወጣው የሁለተኛውን ሕግ ጥሶ ነው ብሎ ማሰብ (የውጭ ኤሌክትሪክ ሥራ ይጠቀማል)።'
        ],
        localizedAnalogy: {
          title: 'The Merkato Spilled Spice Basket',
          titleAmharic: 'በመርካቶ ገበያ የተደፋ የበርበሬ/ቅመም ቅርጫት',
          context: 'A basket of finely powdered Berbere spice accidentally dropping in a crowded Merkato market lane.',
          contextAmharic: 'በመርካቶ ገበያ መሃል የተደፋ የቅመም ቅርጫት እና የስርጭት ሁኔታ።',
          culturalElement: 'Merkato Open Air Market (መርካቶ)',
          explanation: 'When a basket of berbere spills in Merkato, the fine red dust spreads effortlessly across the stones (high entropy). You can never expect the dust to spontaneously gather itself back into a neat cylinder without massive external effort!',
          explanationAmharic: 'መርካቶ መሃል የበርበሬ ቅርጫት ቢደፋ ዱቄቱ በየቦታው ይበተናል (ኢንትሮፒ ጨመረ)። በራሱ ጊዜ ተመልሶ ወደ ቅርጫቱ አይገባም፤ መልሶ ለመሰብሰብ ከፍተኛ ጉልበት ይጠይቃል። ተፈጥሮ ወደ መበተን ታዘነብላለች።'
        },
        prerequisites: ['node_thermo_02', 'node_thermo_03'],
        x: 480,
        y: 280
      },
      {
        id: 'node_thermo_05',
        label: 'Heat Engines & Carnot Cycle Efficiency',
        labelAmharic: 'የሙቀት ሞተሮች እና የካርኖት ዑደት ብቃት',
        category: 'Real-World App',
        depthLevel: 3,
        masteryScore: 0,
        masteryStatus: 'unstudied',
        summary: 'A heat engine absorbs heat from a hot reservoir (Q_H), converts part into mechanical work (W), and exhausts waste heat to a cold sink (Q_C). The Carnot cycle defines the theoretical upper limit of efficiency.',
        summaryAmharic: 'የሙቀት ሞተር ከሞቃት ምንጭ ሙቀት ወስዶ፣ ከፊሉን ወደ ጠቃሚ ሥራ በመቀየር፣ የተረፈውን ወደ ቀዝቃዛ ቦታ ያወጣል። የካርኖት ዑደት ከፍተኛውን የብቃት ወሰን ይወስናል።',
        keyFormulasOrRules: [
          'Efficiency η = W / Q_H = (Q_H - Q_C) / Q_H = 1 - (Q_C / Q_H)',
          'Carnot η_max = 1 - (T_C / T_H) where temperatures must be in Kelvin'
        ],
        commonMisconceptions: [
          'Using Celsius instead of Kelvin in the Carnot efficiency formula leads to catastrophic calculation errors.',
          'Believing friction reduction alone can bring efficiency to 100% (the 2nd law fundamentally forbids zero waste heat).'
        ],
        misconceptionsAmharic: [
          'በካርኖት ቀመር ላይ በሴልሺየስ (Celsius) ማስላት ትልቅ ስህተት ነው፤ ግዴታ በኬልቪን (Kelvin) መሆን አለበት።'
        ],
        localizedAnalogy: {
          title: 'Ethio-Djibouti Railway Steam vs Diesel Engine',
          titleAmharic: 'የምድር ባቡር ሞተር እና የኃይል ብቃት',
          context: 'Comparing historical steam engines climbing the Rift Valley escarpment with thermodynamic cycle limits.',
          contextAmharic: 'የባቡር ሞተር ጉልበት እና ሙቀት ማመንጨት።',
          culturalElement: 'Ethio-Djibouti Railway (የኢትዮ-ጅቡቲ ባቡር)',
          explanation: 'No train engine can turn all coal/fuel heat into forward pulling motion. Exhaust steam must be vented into the cooler atmosphere. The greater the temperature difference between burning chamber and outside mountain air, the more punch the train packs.',
          explanationAmharic: 'ምንም አይነት የባቡር ሞተር ያገኘውን ሙቀት 100% ወደ መጎተት ሥራ መቀየር አይችልም። የተወሰነው በጭስ ማውጫ መውጣት አለበት።'
        },
        prerequisites: ['node_thermo_04'],
        x: 740,
        y: 200
      }
    ],
    connections: [
      {
        id: 'conn_1_2',
        from: 'node_thermo_01',
        to: 'node_thermo_02',
        label: 'Establishes temperature baseline for internal energy',
        labelAmharic: 'ለውስጣዊ ጉልበት የቴምፕሬቸር መነሻ ያስቀምጣል',
        relationType: 'depends_on'
      },
      {
        id: 'conn_1_3',
        from: 'node_thermo_01',
        to: 'node_thermo_03',
        label: 'Drives heat transfer mechanisms via gradient',
        labelAmharic: 'በሙቀት ልዩነት አማካኝነት ዝውውርን ይፈጥራል',
        relationType: 'causes'
      },
      {
        id: 'conn_2_4',
        from: 'node_thermo_02',
        to: 'node_thermo_04',
        label: 'Limits directionality of energy conservation',
        labelAmharic: 'የጉልበት ጥበቃ አቅጣጫን ይወስናል',
        relationType: 'depends_on'
      },
      {
        id: 'conn_3_4',
        from: 'node_thermo_03',
        to: 'node_thermo_04',
        label: 'Irreversible heat flow increases system entropy',
        labelAmharic: 'የማይመለስ ሙቀት ፍሰት ኢንትሮፒን ይጨምራል',
        relationType: 'causes'
      },
      {
        id: 'conn_4_5',
        from: 'node_thermo_04',
        to: 'node_thermo_05',
        label: 'Determines maximum theoretical engine efficiency',
        labelAmharic: 'የሞተር ከፍተኛ ብቃት ወሰንን ይወስናል',
        relationType: 'transforms_into'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_th_01',
        nodeId: 'node_thermo_01',
        nodeLabel: 'Zeroth Law & Equilibrium',
        question: 'Two isolated metal pots of different sizes are placed inside an insulated traditional messob. After 2 hours, what can be stated with certainty?',
        questionAmharic: 'ሁለት የተለያየ መጠን ያላቸው የብረት ድስቶች በአንድ መሶብ ውስጥ ተቀምጠው ከ2 ሰዓት በኋላ፣ ስለ ሁለቱ ድስቶች በእርግጠኝነት ምን ማለት ይቻላል?',
        type: 'mcq',
        options: [
          'They have identical thermal energy content',
          'They have reached the same temperature and are in thermal equilibrium',
          'The larger pot has absorbed all heat from the smaller pot',
          'Heat will continue to circulate perpetually'
        ],
        optionsAmharic: [
          'እኩል ውስጣዊ የሙቀት ጉልበት አላቸው',
          'ተመሳሳይ ቴምፕሬቸር ደርሰው በሙቀት ሚዛን ላይ ናቸው',
          'ትልቁ ድስት ከትንሹ ድስት ሙቀቱን በሙሉ ወስዷል',
          'ሙቀቱ ያለማቋረጥ እርስ በርሱ ይሽከረከራል'
        ],
        correctIndex: 1,
        explanation: 'According to the Zeroth Law, heat transfers between the objects until temperature equalizes, reaching thermal equilibrium where net heat transfer is zero.',
        explanationAmharic: 'በዜሮተኛው ሕግ መሠረት፣ የሙቀት መጠናቸው (temperature) እኩል እስኪሆን ድረስ ይለዋወጣሉ፤ እኩል ሲሆኑ ደግሞ የሙቀት ሚዛን ይፈጠራል።',
        difficulty: 'easy'
      },
      {
        id: 'quiz_th_02',
        nodeId: 'node_thermo_02',
        nodeLabel: 'First Law of Thermodynamics',
        question: 'A gas cylinder absorbs 500 Joules of heat from a burner while expanding and doing 200 Joules of mechanical work on a piston. What is the change in internal energy (ΔU)?',
        questionAmharic: 'አንድ የጋዝ ሲሊንደር 500 ጁል ሙቀት ወስዶ ፒስተኑን በመግፋት 200 ጁል ሥራ ቢሰራ፣ የውስጣዊ ጉልበት ለውጡ (ΔU) ስንት ነው?',
        type: 'mcq',
        options: ['+700 J', '+300 J', '-300 J', '+2.5 J'],
        optionsAmharic: ['+700 ጁል', '+300 ጁል', '-300 ጁል', '+2.5 ጁል'],
        correctIndex: 1,
        explanation: 'By the First Law: ΔU = Q - W = 500 J - 200 J = +300 J. The internal energy increased by 300 Joules.',
        explanationAmharic: 'በአንደኛው ሕግ፡ ΔU = Q - W = 500 - 200 = +300 ጁል። ውስጣዊ ጉልበቱ በ300 ጁል ጨምሯል።',
        difficulty: 'medium'
      },
      {
        id: 'quiz_th_03',
        nodeId: 'node_thermo_05',
        nodeLabel: 'Carnot Engine Efficiency',
        question: 'A theoretical heat engine operates between a hot reservoir at 600 K and a cold exhaust at 300 K. What is the maximum possible theoretical efficiency of this engine?',
        questionAmharic: 'አንድ የሙቀት ሞተር በ600 ኬልቪን ሙቀት ምንጭ እና በ300 ኬልቪን ቀዝቃዛ ቦታ መካከል ቢሰራ፣ ከፍተኛው ሊኖረው የሚችለው የካርኖት ብቃት (efficiency) ስንት ነው?',
        type: 'mcq',
        options: ['100%', '75%', '50%', '33.3%'],
        optionsAmharic: ['100%', '75%', '50%', '33.3%'],
        correctIndex: 2,
        explanation: 'Carnot efficiency η = 1 - (T_C / T_H) = 1 - (300 / 600) = 1 - 0.5 = 0.5 or 50%.',
        explanationAmharic: 'የካርኖት ብቃት η = 1 - (T_C / T_H) = 1 - (300 / 600) = 1 - 0.5 = 50% ነው።',
        difficulty: 'hard'
      }
    ],
    flashcards: [
      {
        id: 'fc_th_01',
        nodeId: 'node_thermo_01',
        front: 'What fundamental quantity is conserved by the First Law of Thermodynamics?',
        frontAmharic: 'በቴርሞዳይናሚክስ አንደኛ ሕግ የሚጠበቀው መሠረታዊ ነገር ምንድን ነው?',
        back: 'Total energy. Energy cannot be created or destroyed, only transformed between heat, work, and internal energy.',
        backAmharic: 'አጠቃላይ ጉልበት (Energy)። ጉልበት አይፈጠርም አይጠፋምም፤ ከአንዱ መልክ ወደ ሌላው ይቀየራል ብቻ።',
        boxLevel: 3,
        nextReviewDate: '2026-09-03'
      },
      {
        id: 'fc_th_02',
        nodeId: 'node_thermo_03',
        front: 'Why does solar energy reach the Earth from the Sun exclusively through radiation?',
        frontAmharic: 'የፀሐይ ሙቀት ወደ ምድር የሚደርሰው በራዲየሽን ብቻ ለምንድን ነው?',
        back: 'Space is a vacuum. Conduction and convection require matter/particles to transfer heat, whereas electromagnetic radiation propagates through a vacuum.',
        backAmharic: 'ህዋ (Space) ባዶ (Vacuum) ስለሆነ ነው። ኮንዳክሽን እና ኮንቬክሽን ቁስ/ሞለኪውል ሲፈልጉ፣ ራዲየሽን ግን ያለ ቁስ በብርሃን ሞገድ መጓዝ ይችላል።',
        boxLevel: 2,
        nextReviewDate: '2026-09-02'
      }
    ]
  },
  {
    id: 'unit_bio_cell_resp',
    title: 'Cellular Respiration & Bioenergetics',
    titleAmharic: 'የህዋስ አተነፋፈስ እና የባዮሎጂካል ጉልበት አመንጪ ሂደት',
    subject: 'Biology',
    subjectAmharic: 'ባዮሎጂ',
    gradeOrLevel: 'Grade 12 National Curriculum',
    textbookSource: 'Ethiopian Ministry of Education Grade 12 Biology (Unit 2: Cellular Metabolism)',
    chapter: 'Unit 2: Glycolysis, Krebs Cycle & Oxidative Phosphorylation',
    description: 'Deconstruct how living cells break down glucose to forge ATP through step-by-step metabolic pathways with Ethiopian fermentation parallels.',
    descriptionAmharic: 'ህዋሳት ግሉኮስን አፈራርሰው እንዴት ATP እንደሚያመርቱ በግልጽ በስዕላዊ ማይንድ-ማፕ ይረዱ።',
    overallMastery: 28,
    createdAt: '2026-08-28',
    nodes: [
      {
        id: 'node_bio_01',
        label: 'Glycolysis in Cytoplasm',
        labelAmharic: 'ግላይኮላይሲስ (በሳይቶፕላዝም ውስጥ)',
        category: 'Foundation',
        depthLevel: 1,
        masteryScore: 70,
        masteryStatus: 'learning',
        summary: 'Anaerobic breakdown of 1 glucose molecule (6-carbon) into 2 pyruvate molecules (3-carbon), yielding a net gain of 2 ATP and 2 NADH without requiring oxygen.',
        summaryAmharic: 'አንድ ባለ 6 ካርቦን ግሉኮስ ያለ ኦክስጅን እርዳታ ወደ ሁለት ባለ 3 ካርቦን ፓይሩቬት ሲሰበር 2 ATP እና 2 NADH የሚያስገኝ መነሻ ሂደት።',
        keyFormulasOrRules: [
          'Glucose + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 ATP + 2 H2O',
          'Net ATP yield = 2 (Invests 2 ATP, generates 4 ATP)'
        ],
        commonMisconceptions: [
          'Thinking glycolysis requires mitochondria (it happens entirely in cytoplasm).',
          'Believing oxygen is required for glycolysis.'
        ],
        misconceptionsAmharic: [
          'ግላይኮላይሲስ ኦክስጅን ይፈልጋል ወይም በማይቶኮንድሪያ ውስጥ ነው የሚካሄደው ብሎ ማሰብ (በሳይቶፕላዝም ውስጥ ነው የሚካሄደው)።'
        ],
        localizedAnalogy: {
          title: 'Tella/Tej Yeast Dough Starter',
          titleAmharic: 'የጠላ እርሾ እና የጥንስ መፍላት ሂደት',
          context: 'The initial sugar fermentation stage when preparing traditional Ethiopian Tella.',
          contextAmharic: 'የጠላ ጥንስ ሲቦካ ያለ አየር የሚደረግ መፍላት።',
          culturalElement: 'Tella Fermentation (የጠላ ጥንስ)',
          explanation: 'Just like yeast starts breaking down barley starch in a sealed clay Gan pot without needing fresh air, glycolysis kicks off by splitting raw sugar right inside the cell soup.',
          explanationAmharic: 'በተዘጋ ጋን ውስጥ የጠላ ጥንስ ያለ አየር መፍላት እንደሚጀምር ሁሉ፣ ግላይኮላይሲስም በህዋሱ ሳይቶፕላዝም ውስጥ ያለ ኦክስጅን ግሉኮስን ይሰብራል።'
        },
        prerequisites: [],
        x: 220,
        y: 120
      },
      {
        id: 'node_bio_02',
        label: 'Link Reaction & Krebs (Citric Acid) Cycle',
        labelAmharic: 'ክሬብስ ዑደት (በማይቶኮንድሪያል ማትሪክስ ውስጥ)',
        category: 'Mechanism',
        depthLevel: 2,
        masteryScore: 35,
        masteryStatus: 'learning',
        summary: 'Pyruvate enters the mitochondrial matrix, converts to Acetyl-CoA, and undergoes an 8-step cyclical oxidation releasing CO2 and harvesting high-energy electrons onto NADH and FADH2.',
        summaryAmharic: 'ፓይሩቬት ወደ ማይቶኮንድሪያ በመግባት ወደ አሴታይል-ኮኤ ይቀየራል፤ ዑደቱ CO2 እያወጣ ከፍተኛ ጉልበት ያላቸውን ኤሌክትሮኖች በNADH እና FADH2 ላይ ያከማቻል።',
        keyFormulasOrRules: [
          'Per Glucose (2 cycles): 2 ATP, 6 NADH, 2 FADH2, 4 CO2 released',
          'Oxaloacetate (4C) combines with Acetyl-CoA (2C) to form Citrate (6C)'
        ],
        commonMisconceptions: [
          'Thinking Krebs cycle produces the majority of ATP directly (it mainly charges electron carrier batteries).',
          'Forgetting that 1 glucose equals TWO turns of the Krebs cycle.'
        ],
        misconceptionsAmharic: [
          'ክሬብስ ዑደት ብዙ ATP በቀጥታ ያመርታል ብሎ ማሰብ (ይልቁንም የኤሌክትሮን ባትሪዎችን NADH/FADH2 ነው የሚሞላው)።'
        ],
        localizedAnalogy: {
          title: 'Watermill Grist Mill Wheel (የውሃ ወፍጮ)',
          titleAmharic: 'የገጠር ውሃ ወፍጮ እና የእህል መፍጨት ዑደት',
          context: 'An Ethiopian rural watermill repeatedly turning around to crush grain and collect power.',
          contextAmharic: 'የውሃ ወፍጮ ዑደት።',
          culturalElement: 'Traditional Watermill (የውሃ ወፍጮ)',
          explanation: 'Acetyl-CoA is like grain entering the mill wheel. With each complete turn, CO2 chaff is blown off and buckets of high-energy water (NADH) are filled for the big power generator next door.',
          explanationAmharic: 'አሴታይል-ኮኤ ልክ እህል ወደ ወፍጮው እንደሚገባ ነው። ወፍጮው በዞረ ቁጥር ቆሻሻው በCO2 ይወገዳል፣ የተሞሉ ባትሪዎች (NADH) ለቀጣዩ ማሽን ይዘጋጃሉ።'
        },
        prerequisites: ['node_bio_01'],
        x: 480,
        y: 120
      },
      {
        id: 'node_bio_03',
        label: 'Electron Transport Chain & ATP Synthase (Oxidative Phosphorylation)',
        labelAmharic: 'የኤሌክትሮን ማስተላለፊያ ሰንሰለት እና የATP ምርት',
        category: 'Core Law',
        depthLevel: 3,
        masteryScore: 0,
        masteryStatus: 'unstudied',
        summary: 'NADH and FADH2 donate electrons to inner membrane protein complexes. The electron flow pumps H+ protons across into the intermembrane space, creating a proton gradient that spins ATP Synthase to forge ~28-34 ATP.',
        summaryAmharic: 'NADH እና FADH2 ኤሌክትሮኖችን ያስተላልፋሉ። ይህ ፍሰት የፕሮቶን ልዩነት ፈጥሮ የATP ሲንቴዝ ሞተርን በማሽከርከር በብዛት ~30 ATP ያመርታል።',
        keyFormulasOrRules: [
          'Total aerobic yield per glucose molecule: ~30 to 32 ATP',
          'Oxygen is the final electron acceptor, forming H2O: 1/2 O2 + 2e- + 2H+ -> H2O',
          'Proton-motive force drives ATP Synthase rotary turbine'
        ],
        commonMisconceptions: [
          'Believing ATP synthase is powered directly by electrons rather than by the proton gradient (chemiosmosis).',
          'Missing that cyanide kills by blocking Complex IV of the ETC, halting oxygen acceptance.'
        ],
        misconceptionsAmharic: [
          'የATP ሞተር የሚሽከረከረው በቀጥታ በኤሌክትሮን ነው ብሎ ማሰብ (በፕሮቶን ፍሰት ግፊት/Chemiosmosis ነው የሚሽከረከረው)።'
        ],
        localizedAnalogy: {
          title: 'The Grand Ethiopian Renaissance Dam (GERD / ህዳሴ ግድብ) Turbine',
          titleAmharic: 'የታላቁ የኢትዮጵያ ህዳሴ ግድብ የኤሌክትሪክ ተርባይን',
          context: 'Water pressure behind the GERD concrete wall rushing through turbines to produce electricity.',
          contextAmharic: 'የህዳሴ ግድብ ውሃ ታምቆ በተርባይን ሲያልፍ ኤሌክትሪክ እንደሚያመነጭ።',
          culturalElement: 'GERD Hydroelectric Dam (የህዳሴ ግድብ)',
          explanation: 'The electron chain pumps protons behind the inner membrane wall just like the Abay river fills the GERD reservoir. When the trapped protons rush through the ATP Synthase turbine back down, it rotates like giant hydro-generators, cranking out pure ATP energy for your body!',
          explanationAmharic: 'የኤሌክትሮን ሰንሰለቱ ፕሮቶኖችን ልክ እንደ ህዳሴ ግድብ ውሃ ያከማቻቸዋል። የታመቁት ፕሮቶኖች በATP ሲንቴዝ ተርባይን ሲያልፉ ሞተሩን በማሽከርከር ለሰውነትህ ግዙፍ የATP ጉልበት ያመርታሉ።'
        },
        prerequisites: ['node_bio_02'],
        x: 740,
        y: 120
      }
    ],
    connections: [
      {
        id: 'conn_bio_1_2',
        from: 'node_bio_01',
        to: 'node_bio_02',
        label: 'Pyruvate from glycolysis feeds into Krebs cycle',
        labelAmharic: 'ፓይሩቬት ወደ ክሬብስ ዑደት ይገባል',
        relationType: 'transforms_into'
      },
      {
        id: 'conn_bio_2_3',
        from: 'node_bio_02',
        to: 'node_bio_03',
        label: 'NADH and FADH2 deliver electrons to ETC',
        labelAmharic: 'NADH እና FADH2 ኤሌክትሮኖችን ለሰንሰለቱ ያቀርባሉ',
        relationType: 'causes'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_bio_01',
        nodeId: 'node_bio_03',
        nodeLabel: 'Electron Transport Chain',
        question: 'What is the ultimate fate of the oxygen (O2) we inhale during aerobic cellular respiration?',
        questionAmharic: 'በአየር አተነፋፈስ ወቅት የምንወስደው ኦክስጅን (O2) መጨረሻው ምን ይሆናል?',
        type: 'mcq',
        options: [
          'It is converted directly into carbon dioxide (CO2)',
          'It acts as the final electron acceptor and forms water (H2O)',
          'It enters the nucleus to replicate DNA',
          'It directly binds to glucose to split it'
        ],
        optionsAmharic: [
          'በቀጥታ ወደ ካርቦን ዳይኦክሳይድ (CO2) ይቀየራል',
          'የመጨረሻው ኤሌክትሮን ተቀባይ በመሆን ወደ ውሃ (H2O) ይቀየራል',
          'DNA ለማባዛት ወደ ኒውክሊየስ ይገባል',
          'ግሉኮስን ለመስበር በቀጥታ ይጣመራል'
        ],
        correctIndex: 1,
        explanation: 'Oxygen acts as the terminal electron acceptor at Complex IV of the ETC. It combines with electrons and free protons to form metabolic water (H2O). CO2 comes from glucose breakdown in the Krebs cycle!',
        explanationAmharic: 'ኦክስጅን በኤሌክትሮን ሰንሰለቱ መጨረሻ ላይ ኤሌክትሮን እና ፕሮቶን ተቀብሎ ወደ ውሃ (H2O) ይቀየራል።',
        difficulty: 'medium'
      }
    ],
    flashcards: [
      {
        id: 'fc_bio_01',
        nodeId: 'node_bio_01',
        front: 'Where in the eukaryotic cell does glycolysis occur, and how much net ATP is produced?',
        frontAmharic: 'ግላይኮላይሲስ በህዋስ ውስጥ የት ይካሄዳል፣ ስንት የተጣራ ATP ያመርታል?',
        back: 'In the cytoplasm (cytosol). It yields a net of 2 ATP per glucose molecule without needing oxygen.',
        backAmharic: 'በሳይቶፕላዝም ውስጥ። ያለ ኦክስጅን 2 የተጣራ ATP ያመርታል።',
        boxLevel: 1,
        nextReviewDate: '2026-09-01'
      }
    ]
  },
  {
    id: 'unit_cs_dsa',
    title: 'Graph Algorithms & Shortest Path',
    titleAmharic: 'የግራፍ አልጎሪዝም እና አቋራጭ መንገድ ስሌት',
    subject: 'Computer Science',
    subjectAmharic: 'ኮምፒውተር ሳይንስ',
    gradeOrLevel: 'University / Advanced Level',
    textbookSource: 'Introduction to Algorithms (CLRS) & Tech Curricula',
    chapter: 'Chapter 24: Single-Source Shortest Paths & Dijkstra',
    description: 'Understand vertices, edges, priority queues, and Dijkstra algorithm with the Addis Ababa transport grid.',
    descriptionAmharic: 'የግራፍ አልጎሪዝም እና የዲጅክስትራ አቋራጭ መንገድ ስሌትን በአዲስ አበባ የትራንስፖርት መስመሮች ይረዱ።',
    overallMastery: 50,
    createdAt: '2026-08-30',
    nodes: [
      {
        id: 'node_cs_01',
        label: 'Graph Representations (Adj Matrix vs Adj List)',
        labelAmharic: 'የግራፍ አቀራረብ (አጃሰንሲ ማትሪክስ እና ሊስት)',
        category: 'Foundation',
        depthLevel: 1,
        masteryScore: 90,
        masteryStatus: 'mastered',
        summary: 'Graphs consist of Vertices V and Edges E. Adjacency lists take O(V + E) space (optimal for sparse graphs), while matrices take O(V^2) space.',
        summaryAmharic: 'ግራፎች ከነጥቦች (Vertices) እና መስመሮች (Edges) የተሰሩ ናቸው። አጃሰንሲ ሊስት O(V+E) ቦታ ሲይዝ፣ ማትሪክስ O(V^2) ይይዛል።',
        keyFormulasOrRules: [
          'Sparse Graph: |E| << |V|^2 -> Use Adjacency List',
          'Dense Graph: |E| ≈ |V|^2 -> Adjacency Matrix allows O(1) edge lookup'
        ],
        commonMisconceptions: [
          'Using adjacency matrix for huge sparse graphs leads to massive wasted memory.'
        ],
        localizedAnalogy: {
          title: 'Addis Ababa Light Rail Transit Map',
          titleAmharic: 'የአዲስ አበባ ቀላል ባቡር ጣቢያዎች ካርታ',
          context: 'Stations along East-West (Ayat to Torhailoch) and North-South (Menelik II to Kality) lines.',
          contextAmharic: 'የአዲስ አበባ ቀላል ባቡር ጣቢያዎች እና መስመሮች።',
          culturalElement: 'Addis Ababa Light Rail (ቀላል ባቡር)',
          explanation: 'Each rail station (Meskel Square, Stadium, Mexico) is a vertex V. The physical rail tracks between them are edges E. A station only connects to its 2-3 direct neighbors, so a list is vastly lighter than a giant grid of all possible town points!',
          explanationAmharic: 'እያንዳንዱ የባቡር ጣቢያ (መስቀል አደባባይ፣ ስታዲየም፣ ሜክሲኮ) ቨርቴክስ ሲሆን የባቡር ሀዲዱ መስመር (Edge) ነው።'
        },
        prerequisites: [],
        x: 220,
        y: 120
      },
      {
        id: 'node_cs_02',
        label: 'Dijkstra Shortest Path Algorithm',
        labelAmharic: 'የዲጅክስትራ አቋራጭ መንገድ ፈላጊ አልጎሪዝም',
        category: 'Core Law',
        depthLevel: 2,
        masteryScore: 65,
        masteryStatus: 'feynman_tested',
        summary: 'A greedy algorithm that finds the shortest path from a starting node to all others in a weighted graph with non-negative edge weights using a Min-Priority Queue in O((V + E) log V) time.',
        summaryAmharic: 'አሉታዊ ክብደት በሌላቸው ግራፎች ውስጥ ከመነሻ ነጥብ ወደ ሁሉም አቋራጩን መንገድ በMin-Priority Queue በፍጥነት O((V+E)logV) የሚያገኝ አልጎሪዝም።',
        keyFormulasOrRules: [
          'Relaxation condition: if dist[u] + weight(u, v) < dist[v] then dist[v] = dist[u] + weight(u, v)',
          'Requires all edge weights w >= 0 (fails on negative cycles; use Bellman-Ford instead)'
        ],
        commonMisconceptions: [
          'Attempting to use Dijkstra on graphs with negative edge weights.',
          'Thinking Dijkstra explores nodes in random order rather than expanding the nearest unvisited node first.'
        ],
        localizedAnalogy: {
          title: 'Addis Minibus Taxi Dispatcher Finding Fastest Route',
          titleAmharic: 'የታክሲ ረዳት ፈጣን መስመር ምርጫ',
          context: 'A commuter finding the fastest route from Megenagna to Piassa during rush hour.',
          contextAmharic: 'ከመገናኛ ወደ ፒያሳ ፈጣን ታክሲ መምረጥ።',
          culturalElement: 'Addis Blue-and-White Taxi (ሰማያዊ ታክሲ)',
          explanation: 'At Megenagna, you look at all immediate short hops (Arat Kilo vs Kazanchis). You always jump onto the closest verified station first, update the total minutes to every neighbor, and never backtrack because every extra road segment only adds positive driving time!',
          explanationAmharic: 'ከመገናኛ ስትነሳ በአጭሩ ርቀት ላይ ያለውን ጣቢያ መጀመሪያ ትመርጣለህ። ሁልጊዜ አነስተኛ ጊዜ የሚወስደውን እያረጋገጥክ ወደፊት ትሄዳለህ።'
        },
        prerequisites: ['node_cs_01'],
        x: 520,
        y: 120
      }
    ],
    connections: [
      {
        id: 'conn_cs_1_2',
        from: 'node_cs_01',
        to: 'node_cs_02',
        label: 'Graph structure provides input for Dijkstra',
        labelAmharic: 'የግራፍ አቀራረብ ለዲጅክስትራ ግብዓት ይሆናል',
        relationType: 'depends_on'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_cs_01',
        nodeId: 'node_cs_02',
        nodeLabel: 'Dijkstra Limitations',
        question: 'Why does Dijkstra\'s algorithm fail to guarantee the shortest path on graphs containing negative edge weights?',
        questionAmharic: 'የዲጅክስትራ አልጎሪዝም አሉታዊ (Negative) ክብደት ባላቸው መስመሮች ላይ ትክክለኛውን አቋራጭ ማግኘት የማይችለው ለምንድን ነው?',
        type: 'mcq',
        options: [
          'Because it uses too much RAM memory',
          'Because its greedy assumption that visited nodes are finalized is broken if a negative edge later reduces total cost',
          'Because graphs with negative weights cannot be represented in computers',
          'Because priority queues only support letters, not numbers'
        ],
        optionsAmharic: [
          'ከፍተኛ የኮምፒውተር ሜሞሪ ስለሚጠቀም',
          'አንድ ጊዜ ተጎብኝቶ የተዘጋ ነጥብ በቀጣይ በሚመጣ አሉታዊ መስመር ዋጋው ሊቀንስ ስለሚችል የGreedy መርሁን ያፈርሰዋል',
          'አሉታዊ ክብደት በኮምፒውተር ሊቀመጥ ስለማይችል',
          'ፕራዮሪቲ ኪው ፊደል እንጂ ቁጥር ስለማይቀበል'
        ],
        correctIndex: 1,
        explanation: 'Dijkstra assumes that once a node is extracted from the priority queue, its shortest distance is permanently locked. A negative weight later in the graph could violate this assumption.',
        explanationAmharic: 'ዲጅክስትራ አንዴ የተጎበኘን ነጥብ ምርጥ አድርጎ ይዘጋል፤ አሉታዊ መስመር ግን ወደፊት የነበረውን ወጪ ዝቅ ሊያደርገው ስለሚችል አልጎሪዝሙ ይሳሳታል።',
        difficulty: 'hard'
      }
    ],
    flashcards: [
      {
        id: 'fc_cs_01',
        nodeId: 'node_cs_02',
        front: 'What is the time complexity of Dijkstra using a Binary Min-Heap Priority Queue?',
        frontAmharic: 'ዲጅክስትራ በባይነሪ ሂፕ ሲሰራ የጊዜ ፍጥነት (Time Complexity) ስንት ነው?',
        back: 'O((V + E) log V), where V is the number of vertices and E is the number of edges.',
        backAmharic: 'O((V + E) log V) ሲሆን V የነጥቦች ብዛት እና E የመስመሮች ብዛት ነው።',
        boxLevel: 4,
        nextReviewDate: '2026-09-08'
      }
    ]
  }
];
