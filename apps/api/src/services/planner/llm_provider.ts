import { ENV } from '../../config/env';
import { LessonPlan, LessonPlanSchema, VisualContent, VisualType } from '../../schemas/lesson.schema';

export interface PlanGenerationContext {
  topic: string;
  documentContext?: string;
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  existingKnowledge?: string;
  learningGoal?: string;
  preferredLanguage: 'en' | 'hi' | 'hinglish' | 'ne' | 'ta';
  teachingStyle: 'intuitive' | 'rigorous' | 'visual' | 'analogy_driven' | 'socratic';
  availableTime: number; // minutes
  desiredDepth?: 'overview' | 'standard' | 'deep';
  previousPerformance?: { averageScore?: number };
  weakConcepts?: string[];
  strongConcepts?: string[];
}

export interface ILLMProvider {
  name: string;
  generateLessonPlan(context: PlanGenerationContext): Promise<LessonPlan>;
}

/**
 * Deterministic Pedagogical Orchestration Engine
 * Implements expert pedagogical heuristics for offline operation, tests, and fallback.
 */
export class DeterministicLessonEngine implements ILLMProvider {
  public name = 'DeterministicLessonEngine';

  public async generateLessonPlan(context: PlanGenerationContext): Promise<LessonPlan> {
    const {
      topic,
      documentContext,
      studentLevel,
      preferredLanguage,
      teachingStyle,
      availableTime,
      weakConcepts = [],
      strongConcepts = [],
    } = context;

    // 1. Time Adaptation
    // 5 mins = 1 sprint section, 15-30 mins = 3 sections, 45-60 mins = 5 sections, >60 = multi-day
    const isMultiDay = availableTime > 60 || availableTime === 120;
    let sectionCount = 3;
    if (availableTime <= 10) {
      sectionCount = 1;
    } else if (availableTime <= 30) {
      sectionCount = 3;
    } else if (availableTime <= 60) {
      sectionCount = 5;
    } else {
      sectionCount = 4; // per core day
    }

    const minutesPerSection = Math.max(2, Math.floor(Math.min(availableTime, 60) / sectionCount));

    // 2. Multilingual Translations / Titles / Greetings
    const languageStrings = this.getLanguageTokens(preferredLanguage, topic);

    // 3. Subject-Aware Visuals & Section Construction
    const sections: LessonPlan['sections'] = [];
    const detectedVisuals: VisualContent[] = [];

    for (let i = 1; i <= sectionCount; i++) {
      const sectionInfo = this.buildSectionMeta(i, sectionCount, topic, studentLevel, teachingStyle, languageStrings);
      const visual = this.classifyAndBuildVisual(topic, sectionInfo.title, studentLevel);
      detectedVisuals.push(visual);

      // Section-specific checkpoint question
      const checkpoint = this.buildCheckpoint(i, topic, studentLevel, preferredLanguage, languageStrings);

      sections.push({
        id: `sec_${i}_${Date.now()}`,
        title: sectionInfo.title,
        durationMinutes: minutesPerSection,
        conceptSummary: sectionInfo.conceptSummary,
        scriptText: sectionInfo.scriptText,
        visual,
        checkpoints: [checkpoint],
      });
    }

    // 4. Assessment Questions
    const assessment = this.buildAssessment(topic, studentLevel, languageStrings);

    // 5. Standalone Checkpoints array
    const questions = sections.flatMap((s) => s.checkpoints);

    // 6. Multi-Day Learning & Revision Plan (if requested)
    let multiDayPlan: LessonPlan['multiDayPlan'] = undefined;
    if (isMultiDay) {
      multiDayPlan = [
        {
          day: 1,
          focusTopic: `${topic}: Conceptual Foundations & Intuition`,
          studyGoal: 'Master underlying qualitative mental models and terminology.',
          tasks: ['Watch introductory demonstration', 'Answer concept check questions', 'Summarize in own words'],
          revisionKeywords: [topic, 'Foundations', 'Intuition', ...strongConcepts],
        },
        {
          day: 2,
          focusTopic: `${topic}: Problem Solving & Edge Cases`,
          studyGoal: 'Address weak areas and practice quantitative applications.',
          tasks: ['Work through numerical and logical derivations', 'Target misconceptions: ' + (weakConcepts[0] || 'subtle corner-cases')],
          revisionKeywords: ['Problem Solving', ...weakConcepts],
        },
        {
          day: 3,
          focusTopic: `${topic}: Mastery & Synthesis`,
          studyGoal: 'Full synthetic assessment and cross-domain connections.',
          tasks: ['Complete final adaptive quiz', 'Review active recall flashcards'],
          revisionKeywords: ['Final Mastery', 'Synthesis'],
        },
      ];
    }

    // 7. Objectives based on level and weak concepts
    const objectives = [
      `${languageStrings.objectivePrefix} foundational principles of ${topic}`,
      `Analyze and solve ${studentLevel} level scenarios using ${teachingStyle} frameworks`,
      ...(weakConcepts.length > 0 ? [`Strengthen identified weak concepts: ${weakConcepts.join(', ')}`] : []),
      `Demonstrate concept mastery via interactive checkpoints and assessment questions`,
    ];

    const plan: LessonPlan = {
      title: `${topic} — ${studentLevel.toUpperCase()} ${languageStrings.titleSuffix}`,
      objective: objectives,
      duration: availableTime,
      difficulty: studentLevel,
      language: preferredLanguage,
      teachingStyle,
      prerequisites: this.getPrerequisites(topic, studentLevel),
      sections,
      questions,
      assessment,
      visuals: detectedVisuals,
      multiDayPlan,
    };

    return LessonPlanSchema.parse(plan);
  }

  private buildSectionMeta(
    index: number,
    total: number,
    topic: string,
    level: string,
    style: string,
    lang: any
  ) {
    if (total === 1) {
      // 5 min Sprint
      return {
        title: `${lang.sprintPrefix}: ${topic}`,
        conceptSummary: `Critical high-impact summary of ${topic} calibrated for rapid ${level} understanding.`,
        scriptText: `${lang.greeting} Today, in this focused sprint, we master the single most vital axiom of ${topic}. Focus closely on the core relationship presented on our digital chalkboard.`,
      };
    }

    if (index === 1) {
      return {
        title: `Part 1: Intuitive Foundation of ${topic}`,
        conceptSummary: `Foundational mental model and physical motivation behind ${topic}.`,
        scriptText: `${lang.greeting} Let us begin with ${topic}. Before diving into technical jargon, imagine how this principle governs everyday reality. Notice how our intuition guides the direction of change.`,
      };
    } else if (index === 2) {
      return {
        title: `Part 2: Mechanisms & Governing Rules`,
        conceptSummary: `Mathematical formulation, laws, and structural relationships governing ${topic}.`,
        scriptText: `Now that we have established the intuition, look at the chalkboard diagram. Here is how the governing laws establish equilibrium and transformation.`,
      };
    } else if (index === 3) {
      return {
        title: `Part 3: Worked Examples & Application`,
        conceptSummary: `Practical problem-solving walkthrough demonstrating ${topic} step-by-step.`,
        scriptText: `Let us apply these principles to a concrete scenario. Follow each step on the board to avoid common stumbling blocks.`,
      };
    } else if (index === 4) {
      return {
        title: `Part 4: Edge Cases & Common Traps`,
        conceptSummary: `Uncovering non-obvious misconceptions and boundary conditions in ${topic}.`,
        scriptText: `Many learners stumble when boundary conditions change. Let us examine what happens when friction, resistance, or edge constraints are introduced.`,
      };
    } else {
      return {
        title: `Part 5: Synthesis & Advanced Extensions`,
        conceptSummary: `Synthesizing ${topic} with broader academic and real-world paradigms.`,
        scriptText: `Finally, let us synthesize everything we have learned today. You now possess the rigorous foundation necessary to master advanced topics.`,
      };
    }
  }

  /**
   * Subject-Aware Visuals Classifier:
   * Maps topic and section to one of the 9 required visual types:
   * equation, graph, diagram, timeline, map, code, flowchart, image, simulation.
   */
  public classifyAndBuildVisual(topic: string, sectionTitle: string, level: string): VisualContent {
    const text = `${topic} ${sectionTitle}`.toLowerCase();

    // 1. Code / Programming
    if (text.includes('code') || text.includes('algorithm') || text.includes('python') || text.includes('javascript') || text.includes('function') || text.includes('array') || text.includes('loop')) {
      return {
        type: 'code',
        title: 'Algorithmic Execution Trace',
        description: 'Line-by-line monospace execution trace with register and memory pointer inspection.',
        data: {
          language: 'typescript',
          code: `// ${topic} Implementation\nfunction executeStep(input: number[]): number {\n  let result = 0;\n  for (const val of input) {\n    result += val;\n  }\n  return result;\n}`,
        },
      };
    }

    // 2. Equation / Mathematics
    if (text.includes('calculus') || text.includes('derivative') || text.includes('integral') || text.includes('equation') || text.includes('algebra') || text.includes('math') || level === 'advanced') {
      return {
        type: 'equation',
        title: 'Formal Mathematical Derivation',
        description: 'Rigorous KaTeX mathematical derivation with balanced terms.',
        data: {
          latex: '\\lim_{\\Delta t \\to 0} \\frac{\\Delta p}{\\Delta t} = \\frac{dp}{dt} = F_{net} = m \\cdot a',
          steps: ['Initial state', 'Instantaneous rate of change', 'Final formulation'],
        },
      };
    }

    // 3. Simulation / Physics / Forces
    if (text.includes('force') || text.includes('motion') || text.includes('gravity') || text.includes('friction') || text.includes('physics') || text.includes('velocity')) {
      return {
        type: 'simulation',
        title: 'Interactive Force Vector Simulation',
        description: 'Real-time vector mechanics simulation showing balanced and unbalanced forces.',
        data: {
          model: 'Rigid body mechanics',
          vectors: [
            { name: 'Normal Force (Fn)', direction: 'up', magnitude: 'mg' },
            { name: 'Gravity (Fg)', direction: 'down', magnitude: 'mg' },
            { name: 'Applied Force (F)', direction: 'right', magnitude: 'F' },
          ],
        },
      };
    }

    // 4. Flowchart / Biological / Chemical / Process
    if (text.includes('cycle') || text.includes('photosynthesis') || text.includes('cell') || text.includes('process') || text.includes('reaction') || text.includes('pipeline')) {
      return {
        type: 'flowchart',
        title: 'Sequential Process Flowchart',
        description: 'Directed acyclic graph illustrating reactant transformation steps.',
        data: {
          steps: ['Step 1: Input & Absorption', 'Step 2: Catalytic Conversion', 'Step 3: Stable Output Yield'],
        },
      };
    }

    // 5. Timeline / History / Chronology
    if (text.includes('war') || text.includes('history') || text.includes('chronology') || text.includes('revolution') || text.includes('century')) {
      return {
        type: 'timeline',
        title: 'Historical Milestones & Epochs',
        description: 'Chronological timeline mapping causality across milestone events.',
        data: {
          events: [
            { year: 'Epoch I', event: 'Initial Trigger & Escalation' },
            { year: 'Epoch II', event: 'Peak Conflict & Strategic Shift' },
            { year: 'Epoch III', event: 'Resolution & Systemic Aftermath' },
          ],
        },
      };
    }

    // 6. Graph / Quantitative Trends
    if (text.includes('trend') || text.includes('rate') || text.includes('growth') || text.includes('economics') || text.includes('data')) {
      return {
        type: 'graph',
        title: 'Cartesian Trend Analysis',
        description: 'Plotted curves showing independent vs dependent variable dynamics.',
        data: {
          xAxis: 'Time / Input Parameter',
          yAxis: 'Response Magnitude',
          trend: 'Non-linear asymptotic growth',
        },
      };
    }

    // 7. Map / Geography
    if (text.includes('geography') || text.includes('plate') || text.includes('continent') || text.includes('trade route')) {
      return {
        type: 'map',
        title: 'Topological & Spatial Distribution Map',
        description: 'Spatial visual projection of geopolitical and geographic features.',
        data: { projection: 'Orthographic Global Projection' },
      };
    }

    // 8. Image / Anatomy / Structure
    if (text.includes('anatomy') || text.includes('structure') || text.includes('organ') || text.includes('hardware')) {
      return {
        type: 'image',
        title: 'High-Resolution Structural Cutaway',
        description: 'Annotated structural visual highlighting internal components.',
        data: { labels: ['Layer A (Outer)', 'Core Mechanism', 'Basal Membrane'] },
      };
    }

    // 9. Default Diagram
    return {
      type: 'diagram',
      title: 'Structural Architecture Diagram',
      description: 'Component relationship map representing interconnected sub-modules.',
      data: { root: topic, components: ['Foundation', 'Core Mechanism', 'Application'] },
    };
  }

  private buildCheckpoint(index: number, topic: string, level: string, langKey: string, lang: any) {
    return {
      id: `chk_${index}_${Date.now()}`,
      type: 'CONCEPTUAL' as const,
      prompt: `${lang.questionPromptPrefix} (${topic}): What happens when the primary constraint or external influence is balanced to zero?`,
      options: [
        'The system maintains its state of uniform equilibrium without needing continuous intervention',
        'The system instantaneously collapses to zero',
        'The parameters fluctuate chaotically without bound',
        'The mass or magnitude multiplies exponentially',
      ],
      correctAnswer: 'The system maintains its state of uniform equilibrium without needing continuous intervention',
      explanation: `According to fundamental principles, when net external forces/influences are zero, the system maintains its inertial equilibrium. Continuous pushing is not required.`,
      misconceptionsMap: {
        'continuous force needed': {
          diagnosis: 'Continuous Action Fallacy: Assuming continuous output requires ongoing exertion.',
          remediationAnalogy: 'Imagine a spacecraft floating in empty vacuum: once given an initial burst of thrusters, it cruises forward forever with zero fuel needed!',
          followUpPrompt: 'In a complete vacuum with zero friction, does a moving object ever stop without an external force?',
        },
      },
    };
  }

  private buildAssessment(topic: string, level: string, lang: any) {
    return [
      {
        id: `asmt_1_${Date.now()}`,
        type: 'MCQ' as const,
        prompt: `Which of the following statements most accurately captures the foundational law of ${topic}?`,
        options: [
          `The rate of change of state is directly proportional to the applied net influence`,
          `Equilibrium can only exist in a completely static, stationary state`,
          `Applied energy is always destroyed in irreversible transitions`,
          `Velocity and acceleration are always identical in magnitude`,
        ],
        correctAnswer: `The rate of change of state is directly proportional to the applied net influence`,
        explanation: `This statement represents the core dynamic relationship governing ${topic}.`,
      },
      {
        id: `asmt_2_${Date.now()}`,
        type: 'SHORT_ANSWER' as const,
        prompt: `Explain why action-reaction pairs never cancel each other out on the same single body.`,
        correctAnswer: `Action and reaction forces act on two distinct, separate bodies, so they never cancel on an individual isolated body.`,
        rubricKeywords: ['different bodies', 'separate objects', 'distinct', 'two bodies'],
        explanation: `Each force acts on a different participant in the interaction, maintaining conservation of momentum across the total system.`,
      },
    ];
  }

  private getPrerequisites(topic: string, level: string): string[] {
    if (level === 'advanced') {
      return ['Multivariate calculus & differential equations', 'Vector spaces and matrix transformations', 'Classical mechanics foundations'];
    } else if (level === 'intermediate') {
      return ['Basic algebra and linear equations', 'Familiarity with coordinate systems and vectors'];
    }
    return ['Basic curiosity and everyday observational experience', 'Basic arithmetic'];
  }

  private getLanguageTokens(lang: string, topic: string) {
    switch (lang) {
      case 'hi':
        return {
          greeting: 'नमस्ते! आज के पाठ में आपका स्वागत है।',
          titleSuffix: 'सम्पूर्ण मास्टरक्लास',
          objectivePrefix: 'गहन रूप से समझना',
          sprintPrefix: 'त्वरित समीक्षा',
          questionPromptPrefix: 'महत्वपूर्ण अवधारणा प्रश्न',
        };
      case 'hinglish':
        return {
          greeting: 'Hello students! Aaj ke session mein welcome.',
          titleSuffix: 'Masterclass (Concept Clear)',
          objectivePrefix: 'In-depth conceptual understanding of',
          sprintPrefix: 'Quick Concept Sprint',
          questionPromptPrefix: 'Concept Check Sawal',
        };
      case 'ne':
        return {
          greeting: 'नमस्ते! आजको सिकाइ कक्षामा तपाईंलाई स्वागत छ।',
          titleSuffix: 'विस्तृत पाठ योजना',
          objectivePrefix: 'राम्रोसँग बुझ्न',
          sprintPrefix: 'द्रुत समीक्षा',
          questionPromptPrefix: 'महत्वपूर्ण अवधारणा प्रश्न',
        };
      case 'ta':
        return {
          greeting: 'வணக்கம்! இன்றைய கற்றல் வகுப்பிற்கு உங்களை வரவேற்கிறோம்.',
          titleSuffix: 'முழுமையான பாடம்',
          objectivePrefix: 'ஆழமாக புரிந்து கொள்ளுதல்',
          sprintPrefix: 'விரைவு மதிப்பாய்வு',
          questionPromptPrefix: 'கருத்து வினா',
        };
      default:
        return {
          greeting: 'Welcome to your personalized AI learning session.',
          titleSuffix: 'Masterclass',
          objectivePrefix: 'Master the',
          sprintPrefix: 'Quick Concept Sprint',
          questionPromptPrefix: 'Conceptual Check Question',
        };
    }
  }
}

/**
 * Gemini LLM Provider (Google Gemini 1.5 Flash)
 * Invoked when GEMINI_API_KEY is configured in the environment.
 */
export class GeminiLLMProvider implements ILLMProvider {
  public name = 'GeminiLLMProvider';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async generateLessonPlan(context: PlanGenerationContext): Promise<LessonPlan> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildPrompt(context, attempt > 1 ? String(lastError?.message || '') : undefined);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: attempt === 1 ? 0.2 : 0.0,
            responseMimeType: 'application/json',
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Empty response from Gemini API');

        const parsedJson = JSON.parse(rawText);
        const validated = LessonPlanSchema.safeParse(parsedJson);

        if (validated.success) {
          return validated.data;
        } else {
          throw new Error(`Zod Schema Validation Error: ${validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiLLMProvider] Attempt ${attempt} failed: ${err.message}. Retrying safely...`);
      }
    }

    throw new Error(`GeminiLLMProvider failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private buildPrompt(ctx: PlanGenerationContext, previousError?: string): string {
    return `You are an expert pedagogical AI Lesson Planning Engine. This is NOT a generic chatbot.
Your task is to synthesize all student dimensions, curriculum parameters, and grounding documents into an authoritative, structured pedagogical lesson plan.

=============================================================================
PEDAGOGICAL INPUT DIMENSIONS
=============================================================================
- Topic: ${ctx.topic}
${ctx.documentContext ? `- Uploaded Document Grounding:\n${ctx.documentContext.slice(0, 3500)}\n` : '- Uploaded Document: None (Operate in General Knowledge Mode)'}
- Student Level: ${ctx.studentLevel}
- Existing Knowledge: ${ctx.existingKnowledge || 'None specified / standard prior grade baseline'}
- Learning Goal: ${ctx.learningGoal || 'Concept mastery and analytical reasoning'}
- Preferred Language: ${ctx.preferredLanguage} (Must be strictly one of: en, hi, hinglish, ne, ta)
- Teaching Style: ${ctx.teachingStyle}
- Available Time: ${ctx.availableTime} minutes
- Desired Depth: ${ctx.desiredDepth || 'standard'}
- Previous Performance: ${ctx.previousPerformance?.averageScore !== undefined ? `${ctx.previousPerformance.averageScore}% average accuracy` : 'New student / no prior session data'}
- Weak Concepts (Requires targeted remediation & analogies): ${ctx.weakConcepts && ctx.weakConcepts.length > 0 ? ctx.weakConcepts.join(', ') : 'None flagged'}
- Strong Concepts (Can be leveraged for transfer learning): ${ctx.strongConcepts && ctx.strongConcepts.length > 0 ? ctx.strongConcepts.join(', ') : 'None flagged'}

=============================================================================
PEDAGOGICAL DECISION MATRIX (You must decide all 8 elements):
=============================================================================
1. WHAT TO TEACH: Select high-yield foundational and core principles for "${ctx.topic}".
2. WHAT ORDER TO TEACH: Sequence concepts logically from prerequisites -> intuition -> governing mechanisms -> worked examples -> edge cases.
3. PREREQUISITES: Explicitly determine necessary background knowledge.
4. DEPTH CALIBRATION BY TIME:
   - 5 minutes: Sprint mode. Focus strictly on 1 critical core concept and high-impact intuition.
   - 20 minutes: Standard session. 3 progressive sections (concepts + worked examples + checkpoint questions).
   - 60 minutes: Deep masterclass. 5 comprehensive sections (deep derivation + real-world applications + edge cases + full assessment).
   - Multi-day (>60 minutes or 120 minutes): Include a structured "multiDayPlan" with Day 1 Foundations, Day 2 Problem Solving/Remediation, Day 3 Synthesis/Mastery.
5. DIFFICULTY CALIBRATION:
   - beginner: Use simple accessible language, intuitive real-world analogies, and foundational examples.
   - intermediate: Use formal technical terminology, balanced mathematical relationships, and practical domain examples.
   - advanced: Use rigorous technical depth, mathematical derivations, implementation/algorithmic details, and advanced edge-case examples.
6. WHERE TO ASK QUESTIONS: Insert interactive checkpoints with specific misconception diagnosis and remediation analogies.
7. SUBJECT-AWARE VISUALS:
   Each section visual MUST be classified as exactly ONE of these 9 types:
   ["equation", "graph", "diagram", "timeline", "map", "code", "flowchart", "image", "simulation"]
8. HOW TO ASSESS UNDERSTANDING: Provide formative checkpoints and summative assessment questions (MCQ, SHORT_ANSWER).

=============================================================================
MULTILINGUAL INSTRUCTION
=============================================================================
Deliver title, scripts, questions, and explanations naturally in "${ctx.preferredLanguage}".
If language is "hi", use clear Hindi.
If language is "hinglish", blend colloquial conversational Hindi and English naturally (as an Indian educator speaks).
If language is "ne", use clear Nepali.
If language is "ta", use natural Tamil.
If language is "en", use articulate English.
Maintain rigorous conceptual integrity regardless of chosen language.

${previousError ? `\n[CORRECTION REQUIRED]: Your previous response failed schema validation with: ${previousError}. Fix the JSON structure immediately.\n` : ''}

Output strictly valid JSON matching this schema:
{
  "title": string,
  "objective": string[],
  "duration": ${ctx.availableTime},
  "difficulty": "${ctx.studentLevel}",
  "language": "${ctx.preferredLanguage}",
  "teachingStyle": "${ctx.teachingStyle}",
  "prerequisites": string[],
  "sections": [
    {
      "id": string,
      "title": string,
      "durationMinutes": number,
      "conceptSummary": string,
      "scriptText": string,
      "visual": {
        "type": "equation" | "graph" | "diagram" | "timeline" | "map" | "code" | "flowchart" | "image" | "simulation",
        "title": string,
        "description": string,
        "data": any
      },
      "checkpoints": [
        {
          "id": string,
          "type": "CONCEPTUAL" | "MCQ" | "SHORT_ANSWER" | "APPLICATION" | "EXPLAIN_IN_OWN_WORDS",
          "prompt": string,
          "options": string[],
          "correctAnswer": string,
          "explanation": string,
          "misconceptionsMap": {
            "key": {
              "diagnosis": string,
              "remediationAnalogy": string,
              "followUpPrompt": string
            }
          }
        }
      ]
    }
  ],
  "questions": [
    {
      "id": string,
      "type": "CONCEPTUAL" | "MCQ" | "SHORT_ANSWER" | "APPLICATION" | "EXPLAIN_IN_OWN_WORDS",
      "prompt": string,
      "options": string[],
      "correctAnswer": string,
      "explanation": string
    }
  ],
  "assessment": [
    {
      "id": string,
      "type": "MCQ" | "SHORT_ANSWER" | "APPLICATION",
      "prompt": string,
      "options": string[],
      "correctAnswer": string,
      "explanation": string
    }
  ],
  "visuals": [
    {
      "type": "equation" | "graph" | "diagram" | "timeline" | "map" | "code" | "flowchart" | "image" | "simulation",
      "title": string,
      "description": string,
      "data": any
    }
  ],
  "multiDayPlan": [
    {
      "day": number,
      "focusTopic": string,
      "studyGoal": string,
      "tasks": string[],
      "revisionKeywords": string[]
    }
  ]
}`;
  }
}

/**
 * Provider Factory:
 * Returns Gemini if GEMINI_API_KEY is configured, else the Deterministic Lesson Engine.
 */
export function getLLMProvider(): ILLMProvider {
  if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0) {
    return new GeminiLLMProvider(ENV.GEMINI_API_KEY.trim());
  }
  return new DeterministicLessonEngine();
}
