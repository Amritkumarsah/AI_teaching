import { DocumentChunkModel, LessonModel } from '../../models';
import { LessonPlan, LessonPlanSchema } from '../../schemas/lesson.schema';
import { getLLMProvider, PlanGenerationContext, DeterministicLessonEngine } from './llm_provider';

export interface GeneratePlanRequest {
  userId: string;
  topic?: string;
  documentId?: string;
  studentLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elementary' | 'middle_school' | 'high_school' | 'undergraduate';
  existingKnowledge?: string;
  learningGoal?: 'concept_mastery' | 'exam_prep' | 'practical_skills' | 'revision';
  preferredLanguage?: 'en' | 'hi' | 'hinglish' | 'ne' | 'ta' | 'es';
  teachingStyle?: 'intuitive' | 'rigorous' | 'visual' | 'analogy_driven' | 'socratic';
  availableTime?: number; // 5, 20, 60, 120 minutes
  desiredDepth?: 'overview' | 'standard' | 'deep';
  previousPerformance?: { averageScore?: number };
  weakConcepts?: string[];
  strongConcepts?: string[];
}

export class LessonPlannerService {
  /**
   * Main entrypoint for generating an AI lesson plan
   */
  public static async planLesson(req: GeneratePlanRequest): Promise<{ lesson: LessonPlan; lessonId: string }> {
    let resolvedTopic = req.topic?.trim() || '';
    let documentContext = '';

    // 1. If documentId is provided, extract grounding text from stored chunks
    if (req.documentId) {
      const chunks = await DocumentChunkModel.find({ documentId: req.documentId })
        .sort({ chunkIndex: 1 })
        .limit(10)
        .lean();

      if (chunks.length > 0) {
        documentContext = chunks
          .map((c) => `[Page ${c.pageNumber || 1}, ${c.chapter || 'Chapter'} - ${c.heading || 'Section'}]:\n${c.text}`)
          .join('\n\n');

        if (!resolvedTopic) {
          // Infer topic from first chunk or section title
          resolvedTopic = chunks[0].heading || chunks[0].chapter || 'Grounded Document Lesson';
        }
      }
    }

    if (!resolvedTopic) {
      resolvedTopic = 'Foundational Concepts';
    }

    // Normalize level
    let normalizedLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (req.studentLevel === 'advanced' || req.studentLevel === 'undergraduate') {
      normalizedLevel = 'advanced';
    } else if (req.studentLevel === 'intermediate' || req.studentLevel === 'high_school') {
      normalizedLevel = 'intermediate';
    }

    // Normalize language
    const lang = req.preferredLanguage || 'en';
    const validLanguages = ['en', 'hi', 'hinglish', 'ne', 'ta'] as const;
    const normalizedLang = validLanguages.includes(lang as any) ? (lang as any) : 'en';

    const context: PlanGenerationContext = {
      topic: resolvedTopic,
      documentContext,
      studentLevel: normalizedLevel,
      existingKnowledge: req.existingKnowledge,
      learningGoal: req.learningGoal || 'concept_mastery',
      preferredLanguage: normalizedLang,
      teachingStyle: req.teachingStyle || 'intuitive',
      availableTime: req.availableTime || 20,
      desiredDepth: req.desiredDepth || 'standard',
      previousPerformance: req.previousPerformance,
      weakConcepts: req.weakConcepts || [],
      strongConcepts: req.strongConcepts || [],
    };

    const provider = getLLMProvider();
    let validatedPlan: LessonPlan;

    try {
      // Execute primary LLM generation
      const candidate = await provider.generateLessonPlan(context);
      const parseResult = LessonPlanSchema.safeParse(candidate);

      if (parseResult.success) {
        validatedPlan = parseResult.data;
      } else {
        // Schema mismatch: safely self-correct using deterministic engine
        const fallback = new DeterministicLessonEngine();
        validatedPlan = await fallback.generateLessonPlan(context);
      }
    } catch {
      // Network failure or LLM parse failure: safe fallback
      const fallback = new DeterministicLessonEngine();
      validatedPlan = await fallback.generateLessonPlan(context);
    }

    // 2. Persist to MongoDB
    const lessonDoc = await LessonModel.create({
      userId: req.userId,
      title: validatedPlan.title,
      topic: resolvedTopic,
      documentId: req.documentId,
      targetDurationMinutes: validatedPlan.duration,
      actualPlannedMinutes: validatedPlan.duration,
      difficulty: validatedPlan.difficulty,
      language: validatedPlan.language,
      teachingStyle: validatedPlan.teachingStyle,
      objectives: validatedPlan.objective,
      prerequisites: validatedPlan.prerequisites,
      sections: validatedPlan.sections,
      assessmentQuestions: validatedPlan.assessment,
      metadata: {
        visuals: validatedPlan.visuals,
        multiDayPlan: validatedPlan.multiDayPlan,
      },
      createdAt: new Date(),
    }).catch(() => null);

    const lessonId = lessonDoc?._id?.toString() || `lesson_${Date.now()}`;

    return {
      lesson: validatedPlan,
      lessonId,
    };
  }
}
