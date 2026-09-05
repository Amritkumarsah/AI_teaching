import { ILesson, ILessonSection, IQuestion, VisualType, SupportedLanguage, TeachingStyle, EducationLevel } from '@ai-teacher/types';
import { ENV } from '../config/env';

export interface PlanLessonParams {
  userId: string;
  topic: string;
  documentId?: string;
  documentContext?: string;
  targetDurationMinutes?: number;
  difficulty?: EducationLevel;
  language?: SupportedLanguage;
  teachingStyle?: TeachingStyle;
  learningGoal?: string;
}

export class LessonPlannerService {
  /**
   * Selects the pedagogical visual type based on domain keywords
   */
  public static detectVisualDomain(topic: string, text: string): { type: VisualType; title: string; description: string; data: any } {
    const combined = `${topic} ${text}`.toLowerCase();

    // 1. Physics / Forces / Motion / Mechanics
    if (combined.includes('force') || combined.includes('motion') || combined.includes('gravity') || combined.includes('friction') || combined.includes('acceleration') || combined.includes('newton')) {
      return {
        type: 'SIMULATION_DIAGRAM',
        title: 'Free Body Force Vectors',
        description: 'Dynamic vector arrows showing balanced and unbalanced forces acting on the mass.',
        data: {
          object: 'Block on Horizontal Surface',
          vectors: [
            { name: 'Normal Force (F_N)', direction: 'up', magnitude: 'm · g', color: '#10B981' },
            { name: 'Gravitational Force (F_g)', direction: 'down', magnitude: 'm · g', color: '#EF4444' },
            { name: 'Applied Force (F_app)', direction: 'right', magnitude: 'F', color: '#3B82F6' },
            { name: 'Frictional Force (f_k)', direction: 'left', magnitude: 'μ · F_N', color: '#F59E0B' },
          ],
          netForceFormula: '\\Sigma F_x = F_{app} - f_k = m \\cdot a',
        },
      };
    }

    // 2. Mathematics / Calculus / Algebra
    if (combined.includes('derivative') || combined.includes('integral') || combined.includes('equation') || combined.includes('calculus') || combined.includes('matrix') || combined.includes('algebra') || combined.includes('pythagorean')) {
      return {
        type: 'EQUATION',
        title: 'Step-by-Step Mathematical Derivation',
        description: 'Algebraic step-by-step expansion rendered rigorously with KaTeX.',
        data: {
          steps: [
            { step: '1. Standard Formulation', latex: 'f(x) = x^n' },
            { step: '2. Limit Definition of Derivative', latex: 'f\'(x) = \\lim_{h \\to 0} \\frac{(x+h)^n - x^n}{h}' },
            { step: '3. Power Rule Result', latex: '\\frac{d}{dx}[x^n] = n \\cdot x^{n-1}' },
          ],
        },
      };
    }

    // 3. Computer Science / Programming / Algorithms
    if (combined.includes('code') || combined.includes('algorithm') || combined.includes('python') || combined.includes('javascript') || combined.includes('react') || combined.includes('data structure') || combined.includes('array') || combined.includes('loop')) {
      return {
        type: 'CODE_TRACE',
        title: 'Execution Trace & State',
        description: 'Monospace code trace highlighting the active line and memory pointers.',
        data: {
          language: 'typescript',
          codeLines: [
            'function binarySearch(arr: number[], target: number): number {',
            '  let left = 0, right = arr.length - 1;',
            '  while (left <= right) {',
            '    const mid = Math.floor((left + right) / 2);',
            '    if (arr[mid] === target) return mid;',
            '    if (arr[mid] < target) left = mid + 1;',
            '    else right = mid - 1;',
            '  }',
            '  return -1;',
            '}',
          ],
          traceVariables: { left: 0, right: 6, mid: 3, target: 42 },
        },
      };
    }

    // 4. Biology / Life Sciences / Chemistry
    if (combined.includes('cell') || combined.includes('photosynthesis') || combined.includes('dna') || combined.includes('biology') || combined.includes('respiration') || combined.includes('molecule') || combined.includes('reaction')) {
      return {
        type: 'FLOWCHART_PROCESS',
        title: 'Sequential Biological Pipeline',
        description: 'Stage-by-stage biochemical reaction pathway from input to stroma glucose output.',
        data: {
          nodes: [
            { id: '1', label: 'Light Photons Absorb into Chlorophyll', stage: 'Input' },
            { id: '2', label: 'Photolysis of Water (H2O -> 2H+ + 1/2 O2 + 2e-)', stage: 'Light Reaction' },
            { id: '3', label: 'ATP & NADPH Synthesis', stage: 'Thylakoid Membrane' },
            { id: '4', label: 'Calvin Cycle (CO2 Fixation into Glucose)', stage: 'Stroma Output' },
          ],
        },
      };
    }

    // 5. Default / History / General
    return {
      type: 'TIMELINE',
      title: 'Conceptual Milestones & Chronology',
      description: 'Causal timeline anchoring events to historical epochs and paradigms.',
      data: {
        milestones: [
          { era: 'Foundation', event: 'Initial Discovery & Core Axiom Formulation' },
          { era: 'Experimentation', event: 'Empirical Verification & Edge-Case Identification' },
          { era: 'Modern Application', event: 'Industrial Integration & Current Standard Practice' },
        ],
      },
    };
  }

  /**
   * Generates a pedagogical, time-budgeted lesson plan with checkpoint questions & misconceptions
   */
  public static async generateLesson(params: PlanLessonParams): Promise<ILesson> {
    const targetMins = params.targetDurationMinutes || 20;
    const lang = params.language || 'en';
    const difficulty = params.difficulty || 'beginner';
    const style = params.teachingStyle || 'intuitive';
    const topic = params.topic || 'Newton\'s Laws of Motion';

    // Scale sections count based on duration budget
    let sectionsCount = 2;
    if (targetMins >= 15 && targetMins < 45) sectionsCount = 3;
    else if (targetMins >= 45) sectionsCount = 5;

    const sections: ILessonSection[] = [];
    const minutesPerSection = Math.max(2, Math.floor(targetMins / sectionsCount));

    for (let i = 1; i <= sectionsCount; i++) {
      const sectionTitle = i === 1 ? `Foundational Intuition: ${topic}` : i === 2 ? `Core Principles & Mechanism` : `Applied Problem Solving & Edge Cases`;
      const visual = this.detectVisualDomain(topic, sectionTitle);

      const checkpoints: IQuestion[] = [
        {
          id: `chk_${i}_1`,
          type: 'CONCEPTUAL',
          prompt: `In the context of ${topic} (${sectionTitle}), if all external balanced influences cancel out, what happens to the continuous state of the system?`,
          options: [
            'The system immediately decelerates to rest',
            'The system maintains its constant velocity without requiring continuous push',
            'The system accelerates exponentially without limit',
            'The mass of the system doubles dynamically',
          ],
          correctAnswer: 'The system maintains its constant velocity without requiring continuous push',
          rubricKeywords: ['constant velocity', 'inertia', 'no force needed', 'maintain state'],
          explanation: 'Newton\'s First Law states that an object continues in its state of uniform motion unless acted upon by a net external force. Continuous push is not required to sustain motion.',
          misconceptionsMap: {
            'continuous motion requires continuous force': {
              diagnosis: 'Continuous Force Trap: Believing that moving objects naturally come to rest unless continuously pushed.',
              remediationAnalogy: 'Imagine sliding an air-hockey puck on a frictionless table in deep outer space. Once tapped, it glides forever without any further push!',
              followUpPrompt: 'If you tap a hockey puck in vacuum far away from all stars, will it ever stop on its own?',
            },
            'heavier objects fall faster': {
              diagnosis: 'Gravitational Fallacy: Conflating total gravitational attraction (weight = mg) with acceleration (a = g).',
              remediationAnalogy: 'Remember the Apollo 15 Moon experiment: Commander David Scott dropped a heavy hammer and a light falcon feather simultaneously in the lunar vacuum; both struck the ground at the exact same instant.',
              followUpPrompt: 'In a vacuum tube with zero air resistance, which falls faster: a bowling ball or an apple?',
            },
          },
        },
      ];

      sections.push({
        id: `sec_${i}`,
        title: sectionTitle,
        durationMinutes: minutesPerSection,
        conceptSummary: `Deep-dive exploration of ${sectionTitle} tailored for ${difficulty} level with a ${style} pedagogical emphasis.`,
        scriptText: `Welcome to our session on ${topic}. Today, we will explore ${sectionTitle}. Notice how real-world observations align with the underlying mathematical principles. As we observe the chalkboard, focus on how each variable influences the final state.`,
        visual,
        checkpoints,
      });
    }

    const assessmentQuestions: IQuestion[] = [
      {
        id: 'quiz_1',
        type: 'MCQ',
        prompt: `Which of the following best defines the primary rule established in ${topic}?`,
        options: [
          'Force is directly proportional to the rate of change of momentum (F = dp/dt)',
          'Velocity remains constant only when continuous force is applied',
          'Acceleration is inversely proportional to velocity',
          'Energy is destroyed during inelastic mechanical collisions',
        ],
        correctAnswer: 'Force is directly proportional to the rate of change of momentum (F = dp/dt)',
        explanation: 'Newton\'s Second Law rigorously connects net applied force to the time rate of momentum change.',
      },
      {
        id: 'quiz_2',
        type: 'SHORT_ANSWER',
        prompt: 'Why do action-reaction force pairs never cancel each other out on a single object?',
        correctAnswer: 'Action and reaction act on two entirely different bodies, never on the same isolated body.',
        rubricKeywords: ['different bodies', 'separate objects', 'not same body'],
        explanation: 'Third law forces always act on distinct interacting entities (Body A on Body B, and Body B on Body A).',
      },
    ];

    const lesson: ILesson = {
      _id: `lesson_${Date.now()}`,
      userId: params.userId,
      title: `${topic} Masterclass`,
      topic,
      documentId: params.documentId,
      targetDurationMinutes: targetMins,
      actualPlannedMinutes: minutesPerSection * sectionsCount,
      difficulty,
      language: lang,
      teachingStyle: style,
      objectives: [
        `Understand the physical foundations of ${topic}`,
        `Solve conceptual and quantitative checkpoint scenarios`,
        `Overcome classical intuitive misconceptions with verified mental models`,
      ],
      prerequisites: ['Basic high school algebra', 'Fundamental concept of coordinate systems'],
      sections,
      assessmentQuestions,
      createdAt: new Date(),
    };

    return lesson;
  }
}
