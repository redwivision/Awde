import { TextbookWorkspace, TopicUnit, ConceptNode, NodeConnection } from '../types';
import { DEFAULT_UNITS } from './curricula';

// Monotonic counter guarantees unique workspace ids even when two PDF uploads
// are processed within the same millisecond (prevents localStorage key clashes).
let customBookIdCounter = 0;

// Rich pre-configured official curriculum textbook workspaces
export const DEFAULT_TEXTBOOK_WORKSPACES: TextbookWorkspace[] = [
  {
    id: 'book_eth_phys_11',
    title: 'Grade 11 Physics (Ethiopian National Curriculum)',
    titleAmharic: 'የ11ኛ ክፍል ፊዚክስ (ብሔራዊ ሥርዓተ-ትምህርት)',
    subject: 'Physics',
    subjectAmharic: 'ፊዚክስ',
    gradeOrLevel: 'Grade 11 MoE Official',
    sourcePdfName: 'Grade_11_Physics_MoE_Ethiopia_Student_Textbook.pdf',
    coverColor: 'from-blue-600 to-indigo-800',
    totalUnits: 2,
    totalTopics: 8,
    overallMastery: 42,
    lastStudiedAt: '2 hours ago',
    units: [
      DEFAULT_UNITS[0], // Thermodynamics (unit_physics_thermo)
      {
        id: 'unit_physics_mechanics',
        title: 'Vectors & 2D Kinematics',
        titleAmharic: 'ቬክተሮች እና ባለ ሁለት አቅጣጫ እንቅስቃሴ',
        subject: 'Physics',
        subjectAmharic: 'ፊዚክስ',
        gradeOrLevel: 'Grade 11 National Curriculum',
        textbookSource: 'Ethiopian MoE Grade 11 Physics Textbook (Unit 1 & 2)',
        chapter: 'Unit 1 & 2: Vectors, Motion & Projectiles',
        description: 'Resolve vectors in 2D coordinate spaces, projectile trajectories, and relative velocity calculations.',
        descriptionAmharic: 'የቬክተር ክፍፍል፣ የወንጭፍና የኳስ ውርወራ (Projectile) እና የአንፃራዊ ፍጥነት ስሌቶች።',
        overallMastery: 55,
        createdAt: '2026-08-20',
        nodes: [
          {
            id: 'node_mech_01',
            label: 'Vector Resolution & Dot Product',
            labelAmharic: 'የቬክተር ክፍፍል እና ነጥብ ማባዛት (Dot Product)',
            category: 'Foundation',
            depthLevel: 1,
            masteryScore: 80,
            masteryStatus: 'mastered',
            summary: 'Splitting vectors into orthogonal components (Ax = A cos θ, Ay = A sin θ) and scalar multiplication.',
            summaryAmharic: 'ቬክተርን ወደ አግድም እና ቀጥታ ክፍሎች መከፋፈል እና ስኬላር ማባዛት።',
            keyFormulasOrRules: ['A · B = |A||B| cos(θ)', 'Ax = A cos(θ), Ay = A sin(θ)'],
            commonMisconceptions: ['Thinking dot product results in a vector rather than a pure scalar value.'],
            misconceptionsAmharic: ['Dot Product ውጤቱ ቬክተር ሳይሆን ቁጥር (ስኬላር) መሆኑን መዘንጋት።'],
            localizedAnalogy: {
              title: 'Two Oxen Plowing at an Angle',
              titleAmharic: 'ሁለት በሬዎች በማእዘን ሲጎትቱ',
              context: 'Two Ethiopian oxen harnessed to a traditional wooden Mofer (እርፍ) pulling at an angle.',
              contextAmharic: 'በሬዎች በእርሻ ላይ ሲጎትቱ።',
              culturalElement: 'Traditional Mofer & Kember Plowing (እርሻ)',
              explanation: 'Only the forward force component aligned with the furrow actually moves the plow; the sideways pull is balanced out.',
              explanationAmharic: 'ወደፊት የሚጎትተው የጉልበት ክፍል ብቻ ነው እርሻውን የሚያሳርሰው።'
            },
            prerequisites: [],
            x: 200,
            y: 100
          },
          {
            id: 'node_mech_02',
            label: 'Projectile Motion & Parabolic Path',
            labelAmharic: 'የፕሮጀክታይል እንቅስቃሴ እና ፓራቦላዊ ጉዞ',
            category: 'Core Law',
            depthLevel: 2,
            masteryScore: 50,
            masteryStatus: 'learning',
            summary: 'Independence of horizontal motion (constant velocity) and vertical motion (free-fall acceleration g).',
            summaryAmharic: 'አግድም እንቅስቃሴው ቋሚ ፍጥነት ሲኖረው፣ ቀጥታ እንቅስቃሴው በስበት ፍጥነት (g) የሚመራ ነው።',
            keyFormulasOrRules: ['x = v0x * t', 'y = v0y * t - 0.5 * g * t^2', 'Max Range R = (v0^2 * sin 2θ) / g'],
            commonMisconceptions: ['Believing an object maintains forward force after leaving the hand/launcher.'],
            misconceptionsAmharic: ['ከተወረወረ በኋላ ወደፊት የሚገፋ ጉልበት አብሮት ይጓዛል ብሎ ማሰብ።'],
            localizedAnalogy: {
              title: 'Traditional Gena Wooden Ball Long Shot',
              titleAmharic: 'የገና ጨዋታ የሩቅ ኳስ ምት',
              context: 'Hitting a wooden ball into the air during Ethiopian Christmas Genna sport.',
              contextAmharic: 'በገና ጨዋታ ኳስ ወደ ላይ ሲመታ።',
              culturalElement: 'Genna Traditional Sport (የገና ጨዋታ)',
              explanation: 'The ball coasts forward steadily while gravity continuously pulls it down into a symmetric arc until it hits the pasture.',
              explanationAmharic: 'ኳሱ ወደፊት በተመሳሳይ ፍጥነት እየሄደ የስበት ኃይል ወደ ታች ይጎትተዋል።'
            },
            prerequisites: ['node_mech_01'],
            x: 460,
            y: 100
          },
          {
            id: 'node_mech_03',
            label: 'Work-Energy Theorem & Conservation',
            labelAmharic: 'የሥራ እና የጉልበት ቲዎረም (Work-Energy Theorem)',
            category: 'Core Law',
            depthLevel: 2,
            masteryScore: 35,
            masteryStatus: 'learning',
            summary: 'Net work done on an object equals its change in kinetic energy: W_net = ΔKE = 0.5*m*(vf^2 - vi^2).',
            summaryAmharic: 'በአንድ አካል ላይ የተሰራው የተጣራ ሥራ ከተንቀሳቃሽ ጉልበቱ ለውጥ (Kinetic Energy) ጋር እኩል ነው።',
            keyFormulasOrRules: ['W = F · d = ΔKE', 'ME_initial = ME_final (conservative systems)'],
            commonMisconceptions: ['Thinking carrying a heavy load across a flat floor does thermodynamic physical work on the load.'],
            misconceptionsAmharic: ['ጭነት ተሸክሞ በአግድም ሲራመዱ የስበት ኃይል ሥራ ይሰራል ብሎ ማሰብ (ማእዘኑ 90 ዲግሪ ስለሆነ ሥራ ዜሮ ነው)።'],
            localizedAnalogy: {
              title: 'Carrying Clay Invalids up Mount Entoto',
              titleAmharic: 'ሸክም ወደ እንጦጦ ተራራ ማውጣት',
              context: 'Pushing a cart up Mount Entoto vs moving on flat road.',
              contextAmharic: 'ወደ እንጦጦ ተራራ እቃ መግፋት።',
              culturalElement: 'Mount Entoto Hills (እንጦጦ ተራራ)',
              explanation: 'Only pushing parallel to the steep slope transfers potential energy into the cart.',
              explanationAmharic: 'ከተራራው አቀበት ጋር ትይዩ የሚደረገው ግፊት ብቻ ነው ጉልበት የሚሰጠው።'
            },
            prerequisites: ['node_mech_01'],
            x: 720,
            y: 100
          }
        ],
        connections: [
          {
            id: 'conn_mech_1_2',
            from: 'node_mech_01',
            to: 'node_mech_02',
            label: 'Vector components split projectile velocity',
            relationType: 'depends_on'
          },
          {
            id: 'conn_mech_1_3',
            from: 'node_mech_01',
            to: 'node_mech_03',
            label: 'Dot product defines work calculation W = F · d',
            relationType: 'depends_on'
          }
        ],
        quizQuestions: [],
        flashcards: []
      }
    ]
  },
  {
    id: 'book_eth_bio_12',
    title: 'Grade 12 Biology (Ethiopian National Curriculum)',
    titleAmharic: 'የ12ኛ ክፍል ባዮሎጂ (ብሔራዊ ሥርዓተ-ትምህርት)',
    subject: 'Biology',
    subjectAmharic: 'ባዮሎጂ',
    gradeOrLevel: 'Grade 12 MoE Official',
    sourcePdfName: 'Grade_12_Biology_MoE_Ethiopia_Student_Textbook.pdf',
    coverColor: 'from-emerald-600 to-teal-800',
    totalUnits: 2,
    totalTopics: 5,
    overallMastery: 28,
    lastStudiedAt: 'Yesterday',
    units: [
      DEFAULT_UNITS[1], // Cellular Respiration (unit_bio_cell_resp)
      {
        id: 'unit_bio_genetics',
        title: 'Molecular Genetics & DNA Transcription',
        titleAmharic: 'ሞለኪውላር ጄኔቲክስ እና የዲኤንኤ ኮድ ቅጅ (Transcription)',
        subject: 'Biology',
        subjectAmharic: 'ባዮሎጂ',
        gradeOrLevel: 'Grade 12 National Curriculum',
        textbookSource: 'Ethiopian MoE Grade 12 Biology Textbook (Unit 3)',
        chapter: 'Unit 3: Genetics & Protein Synthesis',
        description: 'How the genetic code is transcribed from DNA to mRNA and translated into proteins in the ribosome.',
        descriptionAmharic: 'የዘረ-መል መረጃ ከዲኤንኤ ወደ አርኤንኤ ተገልብጦ በራይቦዞም አማካኝነት ፕሮቲን እንዴት እንደሚሰራ።',
        overallMastery: 20,
        createdAt: '2026-08-27',
        nodes: [
          {
            id: 'node_gen_01',
            label: 'DNA Double Helix & Base Pairing',
            labelAmharic: 'የዲኤንኤ ድርብ ጠመዝማዛ ቅርጽ እና የቤዞች ጋብቻ',
            category: 'Foundation',
            depthLevel: 1,
            masteryScore: 65,
            masteryStatus: 'learning',
            summary: 'Antiparallel sugar-phosphate backbones held by hydrogen bonds between complementary bases (A=T, G≡C).',
            summaryAmharic: 'በሃይድሮጅን ቦንድ የተያያዙ ቤዞች (A ከ T ጋር፣ G ከ C ጋር)።',
            keyFormulasOrRules: ['Chargaff\'s Rule: %A = %T, %G = %C', 'Antiparallel: 5\' to 3\' opposite 3\' to 5\''],
            commonMisconceptions: ['Assuming covalent bonds connect the complementary bases instead of easily unzipped hydrogen bonds.'],
            misconceptionsAmharic: ['ቤዞቹ በጠንካራ ቦንድ ሳይሆን በቀላሉ በሚፈታ ሃይድሮጅን ቦንድ የተያያዙ መሆናቸውን መዘንጋት።'],
            localizedAnalogy: {
              title: 'Traditional Ethiopian Zip/Mesob Weaving',
              titleAmharic: 'የመሶብ ጥልፍ እና የዚፕ ጥርስ ጋብቻ',
              context: 'Two interlocking woven strands of an Ethiopian basket.',
              contextAmharic: 'የመሶብ አሰራር ጥልፍ።',
              culturalElement: 'Harari Colored Basketry (የሐረር መሶብ)',
              explanation: 'Each tooth on the left strand only fits its exact matching tooth on the right. When copying, you unzip them cleanly down the middle.',
              explanationAmharic: 'ግራና ቀኝ ያሉት ጥርሶች ልክ እንደ ዚፕ ይገጣጠማሉ፤ መገልበጥ ሲፈለግ መሃሉ በቀላሉ ይከፈታል።'
            },
            prerequisites: [],
            x: 220,
            y: 100
          },
          {
            id: 'node_gen_02',
            label: 'Transcription: RNA Polymerase & mRNA',
            labelAmharic: 'ትራንስክሪፕሽን፡ የአርኤንኤ ፖሊመሬዝ እና የmRNA ስራ',
            category: 'Mechanism',
            depthLevel: 2,
            masteryScore: 15,
            masteryStatus: 'unstudied',
            summary: 'RNA Polymerase reads the template DNA strand 3\'->5\' and synthesizes single-stranded pre-mRNA 5\'->3\', substituting Uracil (U) for Thymine (T).',
            summaryAmharic: 'አርኤንኤ ፖሊመሬዝ የዲኤንኤውን ኮድ በማንበብ አርኤንኤ ያዘጋጃል፤ ታይሚን (T) በዩራሲል (U) ይተካል።',
            keyFormulasOrRules: ['DNA template -> RNA transcript', 'A pairs with U, C pairs with G'],
            commonMisconceptions: ['Thinking both DNA strands are transcribed simultaneously (only the template strand is read).'],
            misconceptionsAmharic: ['ሁለቱም የዲኤንኤ ክፍሎች በአንድ ጊዜ ይገለበጣሉ ብሎ ማሰብ።'],
            localizedAnalogy: {
              title: 'Ancient Scribe Copying a Ge\'ez Parchment',
              titleAmharic: 'የብራና መጽሐፍ ገልባጭ ጸሐፊ',
              context: 'A traditional scribe creating a portable copy of a sacred master parchment.',
              contextAmharic: 'የብራና መጽሐፍ ቅጂ ማዘጋጀት።',
              culturalElement: 'Ethiopian Scribe Parchment Tradition (ብራና)',
              explanation: 'The precious master DNA book stays locked safely in the nucleus vault, while the scribe writes a lightweight messenger scroll (mRNA) to send out to the cellular workshop.',
              explanationAmharic: 'ዋናው መጽሐፍ (ዲኤንኤ) በቤተ-መዛግብት (ኑክሊየስ) ይቀመጣል፤ ገልባጩ ግን ተንቀሳቃሽ መልእክት (mRNA) ጽፎ ወደ ፋብሪካው ይልካል።'
            },
            prerequisites: ['node_gen_01'],
            x: 520,
            y: 100
          }
        ],
        connections: [
          {
            id: 'conn_gen_1_2',
            from: 'node_gen_01',
            to: 'node_gen_02',
            label: 'DNA structure provides template for transcription',
            relationType: 'depends_on'
          }
        ],
        quizQuestions: [],
        flashcards: []
      }
    ]
  },
  {
    id: 'book_cs_algo',
    title: 'Algorithms & Discrete Mathematics',
    titleAmharic: 'አልጎሪዝም እና የኮምፒውተር ሳይንስ መሠረቶች',
    subject: 'Computer Science',
    subjectAmharic: 'ኮምፒውተር ሳይንስ',
    gradeOrLevel: 'University & High School STEM Track',
    sourcePdfName: 'Introduction_to_Algorithms_and_Graph_Theory.pdf',
    coverColor: 'from-purple-600 to-indigo-900',
    totalUnits: 1,
    totalTopics: DEFAULT_UNITS[2].nodes.length,
    overallMastery: 72,
    lastStudiedAt: '4 hours ago',
    units: [
      DEFAULT_UNITS[2] // Graph Algorithms & Shortest Path (unit_cs_dsa)
    ]
  }
];

// Helper to build a unified Multi-Level Mind Map Graph for an entire Textbook:
// Level 0: Master Book Node -> Level 1: Unit Nodes -> Level 2: Topic Nodes -> Level 3: Micro-Concepts
export interface MultiLevelGraphData {
  bookNode: {
    id: string;
    label: string;
    labelAmharic: string;
    type: 'book_root';
    subject: string;
    totalUnits: number;
  };
  unitNodes: {
    id: string;
    label: string;
    labelAmharic: string;
    chapter: string;
    unitId: string;
    mastery: number;
    type: 'unit_hub';
    x: number;
    y: number;
  }[];
  topicNodes: ConceptNode[];
  connections: NodeConnection[];
  crossUnitConnections: {
    id: string;
    fromUnitId: string;
    toUnitId: string;
    fromNodeId: string;
    toNodeId: string;
    label: string;
    labelAmharic: string;
  }[];
}

export function generateTextbookMultiLevelGraph(workspace: TextbookWorkspace): MultiLevelGraphData {
  const unitNodes = workspace.units.map((unit, index) => {
    // Distribute units in a circular or radial ring around center book node
    const angle = (index / Math.max(workspace.units.length, 1)) * 2 * Math.PI - Math.PI / 2;
    const radius = 260;
    const x = Math.round(500 + radius * Math.cos(angle));
    const y = Math.round(300 + radius * Math.sin(angle));

    return {
      id: `hub_${unit.id}`,
      label: unit.title,
      labelAmharic: unit.titleAmharic,
      chapter: unit.chapter,
      unitId: unit.id,
      mastery: unit.overallMastery,
      type: 'unit_hub' as const,
      x,
      y
    };
  });

  const allTopics: ConceptNode[] = [];
  const allConnections: NodeConnection[] = [];

  // Add connections from Book root to each Unit hub
  unitNodes.forEach((uNode) => {
    allConnections.push({
      id: `conn_book_${uNode.id}`,
      from: workspace.id,
      to: uNode.id,
      label: 'Contains Unit',
      labelAmharic: 'ያካተተውን ክፍል ያሳያል',
      relationType: 'contains'
    });
  });

  // Position and aggregate topic nodes for each unit
  workspace.units.forEach((unit, uIdx) => {
    const hub = unitNodes[uIdx];
    unit.nodes.forEach((node, nIdx) => {
      // Offset node relative to its unit hub
      const subAngle = (nIdx / Math.max(unit.nodes.length, 1)) * Math.PI + (uIdx * Math.PI) / 2;
      const subRadius = 140 + node.depthLevel * 40;
      const nx = Math.round(hub.x + subRadius * Math.cos(subAngle));
      const ny = Math.round(hub.y + subRadius * Math.sin(subAngle));

      allTopics.push({
        ...node,
        x: nx,
        y: ny
      });

      // Connect unit hub to root topics of this unit
      if (node.depthLevel === 1 || node.prerequisites.length === 0) {
        allConnections.push({
          id: `conn_hub_${unit.id}_${node.id}`,
          from: hub.id,
          to: node.id,
          label: 'Core Lesson',
          labelAmharic: 'ዋና ትምህርት',
          relationType: 'contains'
        });
      }
    });

    // Add internal unit connections
    allConnections.push(...unit.connections);
  });

  const workspaceUnitIds = new Set(workspace.units.map((u) => u.id));
  const crossUnitTemplates: MultiLevelGraphData['crossUnitConnections'] = [
    {
      id: 'cross_mech_thermo_01',
      fromUnitId: 'unit_physics_mechanics',
      toUnitId: 'unit_physics_thermo',
      fromNodeId: 'node_mech_03', // Work-Energy
      toNodeId: 'node_thermo_02', // First Law
      label: 'Mechanical Work W transfers directly into Internal Energy ΔU',
      labelAmharic: 'የሜካኒካል ሥራ ወደ ውስጣዊ ጉልበት ይቀየራል'
    },
    {
      id: 'cross_bio_resp_gen_01',
      fromUnitId: 'unit_bio_cell_resp',
      toUnitId: 'unit_bio_genetics',
      fromNodeId: 'node_bio_03', // ATP Synthase
      toNodeId: 'node_gen_02', // Transcription
      label: 'ATP produced by Respiration fuels RNA Polymerase transcription',
      labelAmharic: 'የተመረተው ATP ለትራንስክሪፕሽን ጉልበት ይሰጣል'
    }
  ];
  // Only include entries whose endpoint units actually exist in THIS workspace,
  // otherwise they become dangling refs in a single-book graph.
  const crossUnitConnections = crossUnitTemplates.filter(
    (c) => workspaceUnitIds.has(c.fromUnitId) && workspaceUnitIds.has(c.toUnitId)
  );

  return {
    bookNode: {
      id: workspace.id,
      label: workspace.title,
      labelAmharic: workspace.titleAmharic,
      type: 'book_root',
      subject: workspace.subject,
      totalUnits: workspace.units.length
    },
    unitNodes,
    topicNodes: allTopics,
    connections: allConnections,
    crossUnitConnections
  };
}

// Function to synthesize a brand new custom Textbook Workspace from PDF upload
export function createCustomTextbookWorkspace(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedChapters: { title: string; topics: string[] }[]
): TextbookWorkspace {
  const bookId = `custom_book_${Date.now()}_${customBookIdCounter++}`;

  const units: TopicUnit[] = extractedChapters.map((ch, chIdx) => {
    const unitId = `${bookId}_unit_${chIdx + 1}`;
    const nodes: ConceptNode[] = ch.topics.map((tName, tIdx) => {
      return {
        id: `${unitId}_node_${tIdx + 1}`,
        label: tName,
        labelAmharic: `${tName} (የተተነተነ ጽንሰ-ሀሳብ)`,
        category: tIdx === 0 ? 'Foundation' : tIdx === 1 ? 'Core Law' : 'Mechanism',
        depthLevel: tIdx === 0 ? 1 : 2,
        masteryScore: 0,
        masteryStatus: 'unstudied',
        summary: `Comprehensive synthesized knowledge breakdown for "${tName}" extracted from ${fileName}.`,
        summaryAmharic: `ከቀረበው የመማሪያ መጽሐፍ የተዘጋጀ ማብራሪያ።`,
        keyFormulasOrRules: [`Core equation / invariant for ${tName}`, 'Conservation and symmetry properties'],
        commonMisconceptions: [`Common beginner pitfall when analyzing ${tName}.`],
        misconceptionsAmharic: ['በጥናት ወቅት የሚከሰቱ የተለመዱ ስህተቶች።'],
        localizedAnalogy: {
          title: `Ethiopian Real-World Analogy for ${tName}`,
          titleAmharic: `የኢትዮጵያ ተግባራዊ ማነጻጸሪያ`,
          context: `Daily Ethiopian natural or cultural phenomenon reflecting ${tName}.`,
          contextAmharic: `የዕለት ተዕለት ተግባር ማነጻጸሪያ።`,
          culturalElement: 'Ethiopian Everyday Life (የኢትዮጵያ ተሞክሮ)',
          explanation: `Visualizing ${tName} through accessible physical intuition without abstract jargon.`,
          explanationAmharic: `ጽንሰ-ሀሳቡን በቀላል መንገድ መረዳት።`
        },
        prerequisites: tIdx > 0 ? [`${unitId}_node_${tIdx}`] : [],
        x: 200 + tIdx * 250,
        y: 120 + (tIdx % 2) * 80
      };
    });

    const connections: NodeConnection[] = [];
    for (let i = 1; i < nodes.length; i++) {
      connections.push({
        id: `conn_${nodes[i - 1].id}_${nodes[i].id}`,
        from: nodes[i - 1].id,
        to: nodes[i].id,
        label: 'Prerequisite flow',
        relationType: 'depends_on'
      });
    }

    return {
      id: unitId,
      title: ch.title,
      titleAmharic: ch.title,
      subject,
      subjectAmharic: subject,
      gradeOrLevel: gradeLevel,
      textbookSource: `${bookTitle} (${fileName})`,
      chapter: `Unit ${chIdx + 1}: ${ch.title}`,
      description: `Structured cognitive breakdown of ${ch.title} from ${bookTitle}.`,
      descriptionAmharic: `የ${ch.title} ምዕራፍ የተሟላ ማይንድ-ማፕ እና የጥናት ዝግጅት።`,
      nodes,
      connections,
      quizQuestions: [
        {
          id: `quiz_${unitId}_1`,
          nodeId: nodes[0]?.id,
          question: `What is the core underlying mechanism governing ${nodes[0]?.label || ch.title}?`,
          type: 'mcq',
          options: [
            'Fundamental conservation principles and state equilibrium',
            'Arbitrary historical convention without physical basis',
            'Random thermal fluctuations without predictable laws',
            'Static equilibrium only with zero dynamic transfer'
          ],
          correctIndex: 0,
          explanation: 'It is grounded in fundamental scientific conservation laws.',
          difficulty: 'medium'
        }
      ],
      flashcards: [
        {
          id: `fc_${unitId}_1`,
          nodeId: nodes[0]?.id,
          front: `Define the core principle of ${nodes[0]?.label || ch.title}.`,
          frontAmharic: `የ${nodes[0]?.label || ch.title} ዋና መርህ ምንድን ነው?`,
          back: `The fundamental law establishing predictable quantitative relationships in this unit.`,
          backAmharic: `በዚህ ምዕራፍ ውስጥ ያሉትን መርሆች የሚወስን መሠረታዊ ሕግ።`,
          boxLevel: 1,
          nextReviewDate: 'Today'
        }
      ],
      overallMastery: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
  });

  return {
    id: bookId,
    title: bookTitle,
    titleAmharic: bookTitle,
    subject,
    subjectAmharic: subject,
    gradeOrLevel: gradeLevel,
    sourcePdfName: fileName,
    coverColor: 'from-indigo-600 to-violet-900',
    totalUnits: units.length,
    totalTopics: units.reduce((acc, u) => acc + u.nodes.length, 0),
    overallMastery: 0,
    lastStudiedAt: 'Just created',
    units
  };
}
