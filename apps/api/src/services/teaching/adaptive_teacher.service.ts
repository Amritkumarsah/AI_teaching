import {
  TeachingState,
  TeacherPersonality,
  IConceptMastery,
  ITeachingInteraction,
  IEvaluationResult,
  IQuestion,
  SupportedLanguage,
  IVisualContent,
} from '@ai-teacher/types';
import { LessonSessionModel, LessonModel, StudentProfileModel, WeakConceptModel, StrongConceptModel } from '../../models';
import { AppError } from '../../utils/appError';

export interface StartSessionOptions {
  userId: string;
  lessonId?: string;
  topic?: string;
  personality?: TeacherPersonality;
  language?: SupportedLanguage;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface RespondOptions {
  sessionId: string;
  userId: string;
  studentAnswer: string;
  isVoice?: boolean;
}

export interface TeacherActionResponse {
  sessionId: string;
  state: TeachingState;
  currentSection: number;
  currentConcept: string;
  teacherSpeech: string;
  teacherAction: string;
  visual: IVisualContent;
  question?: IQuestion;
  masteryScore: number;
  conceptMastery: Record<string, IConceptMastery>;
  language: SupportedLanguage;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  personality: TeacherPersonality;
  evaluation?: IEvaluationResult;
}

export class AdaptiveTeacherService {
  /**
   * 1. Start or resume an adaptive teaching session
   * State: INTRODUCTION -> EXPLANATION
   */
  public static async startSession(options: StartSessionOptions): Promise<TeacherActionResponse> {
    const { userId, lessonId, topic, personality = 'Friendly', language = 'en', difficulty = 'beginner' } = options;

    // 1. Fetch or create backing lesson
    let lesson: any = null;
    if (lessonId) {
      lesson = await LessonModel.findById(lessonId).lean().catch(() => null);
    }
    if (!lesson) {
      lesson = await LessonModel.findOne({ topic: topic || "Newton's Laws of Motion" }).lean().catch(() => null);
    }

    // Default fallback structure if no pre-generated lesson exists
    if (!lesson) {
      lesson = {
        _id: `lesson_${Date.now()}`,
        title: topic || "Newton's Laws of Motion",
        topic: topic || "Newton's Laws of Motion",
        targetDurationMinutes: 20,
        actualPlannedMinutes: 20,
        difficulty,
        language,
        teachingStyle: 'intuitive',
        sections: [
          {
            id: 'sec_1',
            title: 'Principle of Inertia',
            durationMinutes: 6,
            conceptSummary: 'An object remains at rest or uniform motion unless acted upon by a net force.',
            scriptText: 'Welcome! Today we discover the deep truth of motion: objects do not need continuous pushing to keep moving. In a frictionless world, once in motion, you glide forever.',
            visual: {
              type: 'simulation',
              title: 'Inertia & Force Vectors',
              description: 'Zero net force results in constant velocity vector.',
              data: { forceNet: '0 N', velocity: 'Constant', acceleration: '0 m/s²' },
            },
            checkpoints: [
              {
                id: 'chk_inertia_1',
                type: 'CONCEPTUAL',
                prompt: 'If a spacecraft cuts off its thrusters in deep interstellar space with zero gravity and friction, what happens to its speed?',
                options: [
                  'It maintains its constant speed and direction forever',
                  'It gradually slows down because fuel ran out',
                  'It stops instantly',
                  'It spirals out of control',
                ],
                correctAnswer: 'It maintains its constant speed and direction forever',
                explanation: 'By Newton\'s First Law (Inertia), an object in motion stays in motion with constant velocity when net external force is zero.',
                misconceptionsMap: {
                  'slows down': {
                    diagnosis: 'Continuous Force Fallacy: Believing that motion requires an ongoing source of force.',
                    remediationAnalogy: 'Think of an air-hockey puck on an active air table. Once you give it one flick, it glides across the table without your finger touching it again. In deep space, there is not even air resistance!',
                    followUpPrompt: 'If you slide a smooth metal coin across frictionless ice, does it require you to keep pushing it to keep moving?',
                  },
                },
              },
            ],
          },
          {
            id: 'sec_2',
            title: 'Force, Mass, and Acceleration (F = ma)',
            durationMinutes: 7,
            conceptSummary: 'Net force produces acceleration inversely proportional to mass.',
            scriptText: 'Now we examine what happens when force is not zero. Pushing harder creates more acceleration, but more mass resists that change.',
            visual: {
              type: 'equation',
              title: 'Newton\'s Second Law Formulation',
              description: 'Mathematical proportionality of force and acceleration.',
              data: { latex: 'F_{net} = m \\cdot a' },
            },
            checkpoints: [
              {
                id: 'chk_fma_1',
                type: 'APPLICATION',
                prompt: 'If you apply the same pushing force to an empty shopping cart and a cart filled with 50kg of books, which accelerates faster?',
                options: [
                  'The empty cart accelerates faster because it has less mass',
                  'The filled cart accelerates faster because it has more momentum',
                  'Both carts accelerate at the exact same rate',
                  'Neither cart accelerates',
                ],
                correctAnswer: 'The empty cart accelerates faster because it has less mass',
                explanation: 'Acceleration equals Force divided by Mass (a = F/m). Less mass results in greater acceleration for the same force.',
                misconceptionsMap: {
                  'same rate': {
                    diagnosis: 'Mass Neglect Fallacy: Ignoring inertia and mass resistance.',
                    remediationAnalogy: 'Imagine kicking a lightweight soccer ball versus kicking a solid concrete boulder with the exact same kick force. The ball flies away; the boulder barely budges!',
                    followUpPrompt: 'Does an object with greater inertia resist changes in its motion more or less?',
                  },
                },
              },
            ],
          },
        ],
      };
    }

    const currentSectionObj = lesson.sections[0];
    const initialConcept = currentSectionObj.title;

    // Initialize concept mastery map
    const initialMastery: Record<string, IConceptMastery> = {};
    for (const sec of lesson.sections) {
      initialMastery[sec.title] = {
        concept: sec.title,
        masteryScore: 0,
        attempts: 0,
        correct: 0,
        incorrect: 0,
        misconceptions: [],
        difficulty,
      };
    }

    // Check student profile for persistent weak concepts
    const profile = await StudentProfileModel.findOne({ userId }).lean().catch(() => null);
    const knownWeak = profile?.weakConcepts || [];

    // Synthesize Teacher Intro Speech
    const teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
      `Welcome to our interactive classroom! I am your AI Teacher. Today we master "${lesson.title}". ` +
      (knownWeak.length > 0 ? `I know you previously worked on ${knownWeak.slice(0, 2).join(', ')}, so we will build upon your foundation with care. ` : '') +
      `Let us begin with our first core principle: ${initialConcept}.`,
      personality,
      language
    );

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const initialInteraction: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: 'INTRODUCTION',
      teacherSpeech,
      teacherAction: 'Introduce lesson objective and concept motivation',
      visual: currentSectionObj.visual,
      timestamp: new Date(),
    };

    const sessionDoc = await LessonSessionModel.create({
      lessonSessionId: sessionId,
      userId,
      lessonId: String(lesson._id),
      currentSection: 0,
      currentConcept: initialConcept,
      state: 'INTRODUCTION',
      masteryScore: 0,
      personality,
      language,
      difficulty,
      interactionHistory: [initialInteraction],
      conceptMastery: initialMastery,
      currentState: 'INTRODUCTION',
      currentSectionIndex: 0,
      currentCheckpointIndex: 0,
      answersGiven: [],
      startedAt: new Date(),
    }).catch(() => null);

    const finalSessionId = sessionDoc?._id?.toString() || sessionId;

    return {
      sessionId: finalSessionId,
      state: 'INTRODUCTION',
      currentSection: 0,
      currentConcept: initialConcept,
      teacherSpeech,
      teacherAction: 'Introduce lesson objective and motivate curiosity',
      visual: currentSectionObj.visual,
      masteryScore: 0,
      conceptMastery: initialMastery,
      language,
      difficulty,
      personality,
    };
  }

  /**
   * 2. Continue to next pedagogical phase in the state machine:
   * INTRODUCTION -> EXPLANATION -> DEMONSTRATION -> CHECK_UNDERSTANDING
   * Or NEXT_CONCEPT -> EXPLANATION / FINAL_REVIEW
   */
  public static async continueSession(sessionId: string, userId: string): Promise<TeacherActionResponse> {
    const session = await AdaptiveTeacherService.findSession(sessionId, userId);
    const lesson = await AdaptiveTeacherService.loadLesson(session.lessonId);
    const sectionIndex = session.currentSection || 0;
    const currentSec = lesson.sections[sectionIndex] || lesson.sections[0];
    const personality = (session.personality as TeacherPersonality) || 'Friendly';
    const language = (session.language as SupportedLanguage) || 'en';
    const difficulty = session.difficulty || 'beginner';

    let nextState: TeachingState = 'EXPLANATION';
    let teacherSpeech = '';
    let teacherAction = '';
    let visual: IVisualContent = currentSec.visual;
    let question: IQuestion | undefined = undefined;

    switch (session.state) {
      case 'INTRODUCTION':
        nextState = 'EXPLANATION';
        teacherAction = 'Progressive conceptual explanation';
        teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
          `Let us explore ${currentSec.title}. ${currentSec.scriptText}`,
          personality,
          language
        );
        break;

      case 'EXPLANATION':
        nextState = 'DEMONSTRATION';
        teacherAction = 'Demonstrate physical mechanism with visual model';
        teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
          `Look closely at the chalkboard display. Notice how the visual representation grounds the principle: ${currentSec.conceptSummary}. When variables change, observe the dynamic transformation.`,
          personality,
          language
        );
        visual = {
          ...currentSec.visual,
          title: `Demonstration: ${currentSec.visual.title}`,
          description: `Active demonstration step showing ${currentSec.title} mechanics.`,
        };
        break;

      case 'DEMONSTRATION':
      case 'REMEDIATION':
        nextState = 'CHECK_UNDERSTANDING';
        teacherAction = 'Present checkpoint question and await student response';
        question = currentSec.checkpoints?.[0] || {
          id: `chk_${sectionIndex}_${Date.now()}`,
          type: 'CONCEPTUAL',
          prompt: `In your own words, what is the governing rule of ${currentSec.title}?`,
          correctAnswer: currentSec.conceptSummary,
          explanation: currentSec.conceptSummary,
        };
        teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
          `Now, let us test your intuitive grasp before we move forward. Here is a checkpoint question for you.`,
          personality,
          language
        );
        break;

      case 'NEXT_CONCEPT':
        const nextSecIndex = sectionIndex + 1;
        if (nextSecIndex < lesson.sections.length) {
          session.currentSection = nextSecIndex;
          session.currentConcept = lesson.sections[nextSecIndex].title;
          const nextSec = lesson.sections[nextSecIndex];
          nextState = 'EXPLANATION';
          visual = nextSec.visual;
          teacherAction = 'Transition to next progressive concept';
          teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
            `Terrific progress! You have demonstrated mastery of "${currentSec.title}". Now let us elevate to our next milestone: "${nextSec.title}". ${nextSec.scriptText}`,
            personality,
            language
          );
        } else {
          nextState = 'FINAL_REVIEW';
          teacherAction = 'Conduct holistic lesson synthesis';
          teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
            `Outstanding work! You have completed all foundational sections for "${lesson.title}". You are now primed for the comprehensive mastery assessment.`,
            personality,
            language
          );
          visual = {
            type: 'diagram',
            title: 'Mastery Concept Synthesis',
            description: 'Integrated conceptual map of all mastered units.',
            data: { masteredConcepts: lesson.sections.map((s: any) => s.title) },
          };
        }
        break;

      case 'FINAL_REVIEW':
        nextState = 'FINAL_REVIEW';
        teacherAction = 'Ready for quiz assessment';
        teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
          `You have completed the interactive teaching loop! Please proceed to the final quiz to record your mastery certificate.`,
          personality,
          language
        );
        break;

      default:
        nextState = 'EXPLANATION';
        teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
          `Let us continue our exploration of ${currentSec.title}.`,
          personality,
          language
        );
        break;
    }

    // Update session record
    session.state = nextState;
    session.currentState = nextState;
    session.updatedAt = new Date();

    const turn: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: nextState,
      teacherSpeech,
      teacherAction,
      visual,
      question,
      timestamp: new Date(),
    };

    AdaptiveTeacherService.appendInteraction(session, turn);
    await session.save().catch(() => null);

    return {
      sessionId: String(session._id),
      state: nextState,
      currentSection: session.currentSection || 0,
      currentConcept: session.currentConcept || currentSec.title,
      teacherSpeech,
      teacherAction,
      visual,
      question,
      masteryScore: session.masteryScore || 0,
      conceptMastery: session.conceptMastery || {},
      language,
      difficulty,
      personality,
    };
  }

  /**
   * 3. Student responds to a checkpoint question:
   * Evaluates response -> Misconception Engine -> Adapt -> Remediation or Next Concept
   */
  public static async respondToQuestion(options: RespondOptions): Promise<TeacherActionResponse> {
    const { sessionId, userId, studentAnswer, isVoice = false } = options;
    const session = await AdaptiveTeacherService.findSession(sessionId, userId);
    const lesson = await AdaptiveTeacherService.loadLesson(session.lessonId);
    const sectionIndex = session.currentSection || 0;
    const currentSec = lesson.sections[sectionIndex] || lesson.sections[0];
    const personality = (session.personality as TeacherPersonality) || 'Friendly';
    const language = (session.language as SupportedLanguage) || 'en';
    const difficulty = session.difficulty || 'beginner';

    // Retrieve active question from activeRemediation if in remediation, else last interaction or section
    const activeQuestion: IQuestion =
      session.activeRemediation?.question ||
      session.interactionHistory?.[session.interactionHistory.length - 1]?.question ||
      currentSec.checkpoints?.[0] || {
        id: `chk_${sectionIndex}`,
        type: 'CONCEPTUAL',
        prompt: `Explain ${currentSec.title}`,
        correctAnswer: currentSec.conceptSummary,
        explanation: currentSec.conceptSummary,
      };

    // Execute Misconception Diagnosis Engine
    const evaluation = AdaptiveTeacherService.evaluateMisconception(activeQuestion, studentAnswer, currentSec);

    // Concept Mastery Record
    const conceptKey = currentSec.title;
    const mastery = session.conceptMastery?.[conceptKey] || {
      concept: conceptKey,
      masteryScore: 0,
      attempts: 0,
      correct: 0,
      incorrect: 0,
      misconceptions: [],
      difficulty,
    };

    mastery.attempts += 1;

    let nextState: TeachingState;
    let teacherSpeech = '';
    let teacherAction = '';
    let visual: IVisualContent = currentSec.visual;
    let easierQuestion: IQuestion | undefined = undefined;

    if (evaluation.isCorrect) {
      // Correct answer: increment mastery, clear active remediation and advance
      mastery.correct += 1;
      mastery.masteryScore = Math.min(100, mastery.masteryScore + 35);
      session.masteryScore = Math.min(100, (session.masteryScore || 0) + 20);
      session.activeRemediation = null;
      if (typeof session.markModified === 'function') {
        session.markModified('activeRemediation');
      }

      // Record strong concept
      await StrongConceptModel.findOneAndUpdate(
        { userId, conceptName: conceptKey },
        { $inc: { successCount: 1 }, masteryScore: mastery.masteryScore, lastDemonstrated: new Date() },
        { upsert: true }
      ).catch(() => null);

      nextState = 'NEXT_CONCEPT';
      teacherAction = 'Validate correct response and reinforce conceptual axiom';
      teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
        `Spot-on! ${evaluation.feedback} You have truly grasped the core intuition of ${conceptKey}.`,
        personality,
        language
      );
    } else {
      // Incorrect answer: NEVER just say "Wrong"!
      // Trigger ADAPT -> REMEDIATION with alternative analogy & easier scaffolded question
      mastery.incorrect += 1;
      mastery.masteryScore = Math.max(0, mastery.masteryScore - 15);
      if (evaluation.misconceptionDiagnosis) {
        mastery.misconceptions.push(evaluation.misconceptionDiagnosis);
      }

      // Record weak concept for future sessions
      await WeakConceptModel.findOneAndUpdate(
        { userId, conceptName: conceptKey },
        { $inc: { failureCount: 1 }, lastEncountered: new Date(), resolved: false },
        { upsert: true }
      ).catch(() => null);

      nextState = 'REMEDIATION';
      teacherAction = 'Remediate root misconception with alternative mental model and analogy';

      // Select an alternative analogy distinctly different from the original script
      const alternativeAnalogy = evaluation.remediationAnalogy || AdaptiveTeacherService.getAlternativeAnalogy(conceptKey, language);

      easierQuestion = evaluation.followUpQuestion || {
        id: `${activeQuestion.id}_scaffold`,
        type: 'CONCEPTUAL',
        prompt: `Let us test this simplified scenario: In a complete vacuum with no gravity and no air friction, does a moving hockey puck ever stop on its own?`,
        options: ['No, it keeps moving forward perpetually', 'Yes, it stops because force is exhausted'],
        correctAnswer: 'No, it keeps moving forward perpetually',
        explanation: 'With zero friction, inertia preserves uniform velocity.',
      };

      teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
        `Let us look at this differently. ${alternativeAnalogy} Now, with that picture in mind, consider this simpler question:`,
        personality,
        language
      );

      visual = {
        type: 'simulation',
        title: `Remediation Model: ${conceptKey}`,
        description: `Alternative conceptual model clearing up: ${evaluation.misconceptionDiagnosis || 'common misconception'}`,
        data: {
          analogy: alternativeAnalogy,
          keyFocus: 'Zero Friction State',
          status: 'Remediation Active',
        },
      };

      session.activeRemediation = {
        question: easierQuestion,
        diagnosis: evaluation.misconceptionDiagnosis,
        analogy: alternativeAnalogy,
      };
      if (typeof session.markModified === 'function') {
        session.markModified('activeRemediation');
      }
    }

    session.conceptMastery[conceptKey] = mastery;
    session.state = nextState;
    session.currentState = nextState;
    session.updatedAt = new Date();

    const turn: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: nextState,
      teacherSpeech,
      teacherAction,
      visual,
      question: easierQuestion || activeQuestion,
      studentAnswer,
      isVoice,
      evaluation,
      misconceptionAnalysis: !evaluation.isCorrect ? {
        rootMisunderstanding: evaluation.misconceptionDiagnosis || 'Incomplete conceptual model',
        remediationAnalogy: evaluation.remediationAnalogy || '',
        easierQuestion,
      } : undefined,
      timestamp: new Date(),
    };

    AdaptiveTeacherService.appendInteraction(session, turn);
    await session.save().catch(() => null);

    return {
      sessionId: String(session._id),
      state: nextState,
      currentSection: sectionIndex,
      currentConcept: conceptKey,
      teacherSpeech,
      teacherAction,
      visual,
      question: easierQuestion,
      masteryScore: session.masteryScore || 0,
      conceptMastery: session.conceptMastery || {},
      language,
      difficulty,
      personality,
      evaluation,
    };
  }

  /**
   * 4. Explain Again: Fresh alternative explanation for current concept
   */
  public static async explainAgain(sessionId: string, userId: string): Promise<TeacherActionResponse> {
    const session = await AdaptiveTeacherService.findSession(sessionId, userId);
    const lesson = await AdaptiveTeacherService.loadLesson(session.lessonId);
    const sectionIndex = session.currentSection || 0;
    const currentSec = lesson.sections[sectionIndex] || lesson.sections[0];
    const personality = (session.personality as TeacherPersonality) || 'Friendly';
    const language = (session.language as SupportedLanguage) || 'en';
    const difficulty = session.difficulty || 'beginner';

    const alternativeAnalogy = AdaptiveTeacherService.getAlternativeAnalogy(currentSec.title, language);
    const teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
      `No problem at all! Let us reset and approach ${currentSec.title} from another angle: ${alternativeAnalogy}`,
      personality,
      language
    );

    const visual: IVisualContent = {
      type: 'diagram',
      title: `Alternative Perspective: ${currentSec.title}`,
      description: 'Alternative mental model representation',
      data: { alternativeView: true, analogy: alternativeAnalogy },
    };

    const turn: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: session.state,
      teacherSpeech,
      teacherAction: 'Provide fresh alternative explanation',
      visual,
      timestamp: new Date(),
    };

    AdaptiveTeacherService.appendInteraction(session, turn);
    await session.save().catch(() => null);

    return {
      sessionId: String(session._id),
      state: session.state,
      currentSection: sectionIndex,
      currentConcept: currentSec.title,
      teacherSpeech,
      teacherAction: 'Provide fresh alternative explanation',
      visual,
      masteryScore: session.masteryScore || 0,
      conceptMastery: session.conceptMastery || {},
      language,
      difficulty,
      personality,
    };
  }

  /**
   * 5. Simplify Concept: Lowers difficulty and explains in foundational terms
   */
  public static async simplifyConcept(sessionId: string, userId: string): Promise<TeacherActionResponse> {
    const session = await AdaptiveTeacherService.findSession(sessionId, userId);
    const lesson = await AdaptiveTeacherService.loadLesson(session.lessonId);
    const sectionIndex = session.currentSection || 0;
    const currentSec = lesson.sections[sectionIndex] || lesson.sections[0];
    const personality = (session.personality as TeacherPersonality) || 'Friendly';
    const language = (session.language as SupportedLanguage) || 'en';

    session.difficulty = 'beginner';

    const simplifiedSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
      `Let us strip away the technical jargon. Imagine you are riding in a car. When the driver slams on the brakes, your body lurches forward. Why? Because your body was already moving, and it wants to keep moving! That is all inertia is: matter resists changing what it is already doing.`,
      personality,
      language
    );

    const visual: IVisualContent = {
      type: 'image',
      title: `Simplified Real-World Analogy`,
      description: 'Intuitive everyday demonstration of inertia.',
      data: { scenario: 'Passenger lurching forward when vehicle brakes' },
    };

    const turn: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: session.state,
      teacherSpeech: simplifiedSpeech,
      teacherAction: 'Downgrade complexity and explain using intuitive everyday intuition',
      visual,
      timestamp: new Date(),
    };

    AdaptiveTeacherService.appendInteraction(session, turn);
    await session.save().catch(() => null);

    return {
      sessionId: String(session._id),
      state: session.state,
      currentSection: sectionIndex,
      currentConcept: currentSec.title,
      teacherSpeech: simplifiedSpeech,
      teacherAction: 'Downgrade complexity to foundational level',
      visual,
      masteryScore: session.masteryScore || 0,
      conceptMastery: session.conceptMastery || {},
      language,
      difficulty: 'beginner',
      personality,
    };
  }

  /**
   * 6. Example: Provide a concrete worked real-world or mathematical example
   */
  public static async provideExample(sessionId: string, userId: string): Promise<TeacherActionResponse> {
    const session = await AdaptiveTeacherService.findSession(sessionId, userId);
    const lesson = await AdaptiveTeacherService.loadLesson(session.lessonId);
    const sectionIndex = session.currentSection || 0;
    const currentSec = lesson.sections[sectionIndex] || lesson.sections[0];
    const personality = (session.personality as TeacherPersonality) || 'Friendly';
    const language = (session.language as SupportedLanguage) || 'en';
    const difficulty = session.difficulty || 'beginner';

    const exampleSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
      `Here is a concrete worked example: Suppose an astronaut on a spacewalk throws a 2 kg metal wrench with a velocity of 5 m/s. Because space has zero friction and negligible gravity, that wrench will still be traveling at exactly 5 m/s 10,000 years from now unless it hits an asteroid! Force was only needed to accelerate it during the throw, not to sustain its journey.`,
      personality,
      language
    );

    const visual: IVisualContent = {
      type: 'simulation',
      title: 'Worked Example: Spacewalk Wrench Throw',
      description: 'Zero net force perpetuates velocity indefinitely.',
      data: { mass: '2 kg', velocity: '5 m/s', distanceOverTime: 'Linear uniform motion' },
    };

    const turn: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: session.state,
      teacherSpeech: exampleSpeech,
      teacherAction: 'Walkthrough concrete worked scenario',
      visual,
      timestamp: new Date(),
    };

    AdaptiveTeacherService.appendInteraction(session, turn);
    await session.save().catch(() => null);

    return {
      sessionId: String(session._id),
      state: session.state,
      currentSection: sectionIndex,
      currentConcept: currentSec.title,
      teacherSpeech: exampleSpeech,
      teacherAction: 'Provide concrete worked example',
      visual,
      masteryScore: session.masteryScore || 0,
      conceptMastery: session.conceptMastery || {},
      language,
      difficulty,
      personality,
    };
  }

  /**
   * 7. Change Language: Dynamically switch language preserving lesson state
   */
  public static async changeLanguage(sessionId: string, userId: string, newLanguage: SupportedLanguage): Promise<TeacherActionResponse> {
    const session = await AdaptiveTeacherService.findSession(sessionId, userId);
    const lesson = await AdaptiveTeacherService.loadLesson(session.lessonId);
    const sectionIndex = session.currentSection || 0;
    const currentSec = lesson.sections[sectionIndex] || lesson.sections[0];
    const personality = (session.personality as TeacherPersonality) || 'Friendly';

    session.language = newLanguage;

    const teacherSpeech = AdaptiveTeacherService.formatSpeechByPersonality(
      `Language switched to ${newLanguage}. All lesson progress, concept mastery, and checkpoints are preserved. Let us continue with ${currentSec.title}.`,
      personality,
      newLanguage
    );

    const turn: ITeachingInteraction = {
      id: `int_${Date.now()}`,
      state: session.state,
      teacherSpeech,
      teacherAction: `Switch spoken and written language to ${newLanguage}`,
      visual: currentSec.visual,
      timestamp: new Date(),
    };

    AdaptiveTeacherService.appendInteraction(session, turn);
    await session.save().catch(() => null);

    return {
      sessionId: String(session._id),
      state: session.state,
      currentSection: sectionIndex,
      currentConcept: currentSec.title,
      teacherSpeech,
      teacherAction: `Language changed to ${newLanguage}`,
      visual: currentSec.visual,
      masteryScore: session.masteryScore || 0,
      conceptMastery: session.conceptMastery || {},
      language: newLanguage,
      difficulty: session.difficulty || 'beginner',
      personality,
    };
  }

  // =========================================================================
  // HELPER PEDAGOGICAL METHODS
  // =========================================================================

  private static evaluateMisconception(question: IQuestion, studentAnswer: string, currentSec: any): IEvaluationResult {
    const raw = studentAnswer.trim().toLowerCase();
    const correctLower = question.correctAnswer.toLowerCase();

    // 1. Direct or fuzzy match for correct
    const isDirectMatch = raw === correctLower || raw.includes(correctLower) || (raw.length > 5 && correctLower.includes(raw));
    const isKeywordMatch = question.rubricKeywords?.some((kw) => raw.includes(kw.toLowerCase()));

    // Semantic conceptual match (e.g. "no" + "keeps moving" / "perpetually" / "constant")
    const isConceptualMatch =
      (correctLower.startsWith('no') && raw.startsWith('no') && (raw.includes('moving') || raw.includes('perpetual') || raw.includes('constant') || raw.includes('maintain'))) ||
      (correctLower.includes('maintains') && raw.includes('maintains')) ||
      (correctLower.includes('empty cart') && raw.includes('empty'));

    // Token overlap check
    const correctWords = correctLower.split(/\W+/).filter((w) => w.length > 3);
    const matchCount = correctWords.filter((w) => raw.includes(w)).length;
    const hasSufficientOverlap = correctWords.length > 0 && matchCount / correctWords.length >= 0.5;

    if (isDirectMatch || isKeywordMatch || isConceptualMatch || hasSufficientOverlap) {
      return {
        isCorrect: true,
        score: 10,
        feedback: 'Excellent reasoning! Your explanation demonstrates strong physical intuition and clarity.',
        hasMisconception: false,
      };
    }

    // 2. Check for configured misconceptions in question map
    if (question.misconceptionsMap) {
      for (const [key, item] of Object.entries(question.misconceptionsMap)) {
        const parts = key.toLowerCase().split(' ');
        if (parts.some((p) => p.length > 2 && raw.includes(p))) {
          return {
            isCorrect: false,
            score: 3,
            feedback: `Notice this common misconception: ${item.diagnosis}`,
            hasMisconception: true,
            misconceptionDiagnosis: item.diagnosis,
            remediationAnalogy: item.remediationAnalogy,
            followUpQuestion: {
              id: `${question.id}_remedy`,
              type: 'CONCEPTUAL',
              prompt: item.followUpPrompt,
              options: [
                'No, it keeps moving perpetually without any further push',
                'Yes, it slows down because force runs out',
              ],
              correctAnswer: 'No, it keeps moving perpetually without any further push',
              rubricKeywords: ['no', 'perpetually', 'keeps moving', 'constant', 'maintains'],
              explanation: 'Without external resistive forces, inertia preserves motion indefinitely.',
            },
          };
        }
      }
    }

    // 3. Heuristic Misconception Detection for Motion/Inertia
    if (raw.includes('slow') || raw.includes('stop') || raw.includes('fuel') || raw.includes('push')) {
      return {
        isCorrect: false,
        score: 2,
        feedback: 'You are experiencing the Continuous Force Trap: assuming ongoing motion requires ongoing exertion.',
        hasMisconception: true,
        misconceptionDiagnosis: 'Continuous Force Fallacy: Assuming continuous output requires ongoing exertion.',
        remediationAnalogy: 'Imagine a spacecraft floating in empty vacuum: once given an initial burst of thrusters, it cruises forward forever with zero fuel needed!',
        followUpQuestion: {
          id: `${question.id}_remedy`,
          type: 'CONCEPTUAL',
          prompt: 'In a complete vacuum with zero friction, does a moving object ever stop without an external force?',
          options: ['No, it keeps moving perpetually', 'Yes, it stops on its own'],
          correctAnswer: 'No, it keeps moving perpetually',
          explanation: 'Newton\'s first law guarantees uniform velocity when net force is zero.',
        },
      };
    }

    // 4. Default gentle remediation
    return {
      isCorrect: false,
      score: 2,
      feedback: `Not quite. Let us examine the governing mechanism: ${question.explanation || currentSec.conceptSummary}`,
      hasMisconception: true,
      misconceptionDiagnosis: 'Surface Intuition Fallacy: Overlooking non-obvious boundary conditions.',
      remediationAnalogy: 'Think of an ice skater gliding on a smooth, frozen lake: after one push, they glide effortlessly without taking another step.',
      followUpQuestion: {
        id: `${question.id}_remedy`,
        type: 'CONCEPTUAL',
        prompt: `If net force equals zero, does velocity change?`,
        options: ['No, velocity remains constant', 'Yes, velocity decreases'],
        correctAnswer: 'No, velocity remains constant',
        explanation: 'Zero net force means zero acceleration, hence constant velocity.',
      },
    };
  }

  private static getAlternativeAnalogy(concept: string, lang: SupportedLanguage): string {
    const analogiesEn: Record<string, string> = {
      default: 'Think of an air-hockey table: when the blower is on, the puck floats on air with almost zero friction. Give it a tap, and it bounces back and forth without slowing down.',
      inertia: 'Picture a space probe cruising between stars. It turned off its rocket engines 40 years ago, yet it continues traveling at 35,000 miles per hour through the silent cosmos.',
      force: 'Imagine pushing a loaded wheelbarrow versus an empty one. The mass of the loaded wheelbarrow resists your push, requiring much more muscle to pick up speed.',
    };

    const analogiesHi: Record<string, string> = {
      default: 'सरल शब्दों में समझें: जैसे चिकने बर्फ पर गेंद को एक बार लुढ़का दें, तो वह बिना रुके चलती रहती है। उसे रोकने के लिए घर्षण की जरूरत होती है।',
      inertia: 'अंतरिक्ष यान की तरह सोचें: एक बार इंजन बंद हो जाने के बाद भी, वह ब्रह्मांड में बिना रुके उसी गति से आगे बढ़ता रहता है।',
    };

    const analogiesHinglish: Record<string, string> = {
      default: 'Ek simple analogy imagine karo: Ice rink par jab ek puck slide karti hai, toh wo smoothly move karti rehti hai jab tak koi usse roke na. Continual push ki zaroorat nahi hoti!',
      inertia: 'Deep space probe ki tarah socho: Engine switch off hone ke baad bhi space probe bina ruke same speed se travel karta rehta hai.',
    };

    if (lang === 'hi') return analogiesHi.inertia || analogiesHi.default;
    if (lang === 'hinglish') return analogiesHinglish.inertia || analogiesHinglish.default;
    return analogiesEn.inertia || analogiesEn.default;
  }

  public static formatSpeechByPersonality(baseSpeech: string, personality: TeacherPersonality, lang: SupportedLanguage): string {
    switch (personality) {
      case 'Friendly':
        return `😊 ${baseSpeech} You are doing wonderfully, so take your time and enjoy learning!`;
      case 'Strict':
        return `⚠️ Focus carefully on every term. Precision is essential in scientific thought. ${baseSpeech}`;
      case 'Socratic':
        return `🤔 Consider this thoughtfully before answering: What does your intuition tell you? ${baseSpeech}`;
      case 'Exam Coach':
        return `🎯 High-yield exam point! Examiners frequently test this exact trap. Pay close attention: ${baseSpeech}`;
      case 'Patient':
        return `🌱 No hurry at all. Learning takes time, and we will take every step together. ${baseSpeech}`;
      case 'Professional':
      default:
        return `Academic Overview: ${baseSpeech}`;
    }
  }

  private static appendInteraction(session: any, turn: ITeachingInteraction) {
    if (!session.interactionHistory) {
      session.interactionHistory = [];
    }
    session.interactionHistory.push(turn);

    // Context management & summarization: limit stored history to last 10 turns to avoid unbounded bloat
    if (session.interactionHistory.length > 10) {
      session.interactionHistory = session.interactionHistory.slice(-10);
    }
    if (typeof session.markModified === 'function') {
      session.markModified('interactionHistory');
      session.markModified('conceptMastery');
      session.markModified('activeRemediation');
    }
  }

  private static async findSession(sessionId: string, userId: string) {
    let session = await LessonSessionModel.findById(sessionId).catch(() => null);
    if (!session) {
      session = await LessonSessionModel.findOne({ lessonSessionId: sessionId }).catch(() => null);
    }
    if (!session) {
      throw new AppError(`Teaching session '${sessionId}' was not found. Please start a new session.`, 404, 'SESSION_NOT_FOUND');
    }
    if (session.userId && session.userId !== userId) {
      throw new AppError('Forbidden: You do not have permission to access this teaching session.', 403, 'FORBIDDEN');
    }
    return session;
  }

  private static async loadLesson(lessonId: string) {
    let lesson = await LessonModel.findById(lessonId).lean().catch(() => null);
    if (!lesson) {
      lesson = await LessonModel.findOne({ _id: lessonId }).lean().catch(() => null);
    }
    if (!lesson) {
      // Return default pedagogical syllabus
      return {
        _id: lessonId,
        title: "Newton's Laws of Motion",
        topic: "Newton's Laws of Motion",
        sections: [
          {
            id: 'sec_1',
            title: 'The Principle of Inertia',
            durationMinutes: 6,
            conceptSummary: 'An object maintains uniform velocity when net external force is zero.',
            scriptText: 'Welcome! An object does not require continuous force to keep moving.',
            visual: {
              type: 'simulation',
              title: 'Inertia Simulation',
              description: 'Force and velocity vectors in zero friction.',
              data: { forceNet: '0 N', velocity: 'Constant' },
            },
            checkpoints: [
              {
                id: 'chk_1',
                type: 'CONCEPTUAL',
                prompt: 'What happens to a spacecraft moving in deep vacuum when its engines turn off?',
                options: ['It continues moving with constant velocity', 'It slows down and stops'],
                correctAnswer: 'It continues moving with constant velocity',
                explanation: 'Zero net force means zero acceleration.',
                misconceptionsMap: {
                  'slows down': {
                    diagnosis: 'Continuous Force Fallacy: Believing that motion requires an ongoing source of force.',
                    remediationAnalogy: 'Think of an air-hockey puck glided on a frictionless table: once tapped, it never slows down.',
                    followUpPrompt: 'In zero friction, does a moving hockey puck require continuous pushing to keep moving?',
                  },
                },
              },
            ],
          },
        ],
      };
    }
    return lesson;
  }
}
