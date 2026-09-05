import { z } from 'zod';

export const VisualTypeSchema = z.enum([
  'equation',
  'graph',
  'diagram',
  'timeline',
  'map',
  'code',
  'flowchart',
  'image',
  'simulation',
]);

export const VisualContentSchema = z.object({
  type: VisualTypeSchema,
  title: z.string().min(1),
  description: z.string().default(''),
  data: z.any().optional(),
});

export const MisconceptionMapItemSchema = z.object({
  diagnosis: z.string(),
  remediationAnalogy: z.string(),
  followUpPrompt: z.string(),
});

export const QuestionSchema = z.object({
  id: z.string().default(() => `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
  type: z.enum(['MCQ', 'SHORT_ANSWER', 'CONCEPTUAL', 'APPLICATION', 'EXPLAIN_IN_OWN_WORDS']).default('MCQ'),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  rubricKeywords: z.array(z.string()).optional(),
  explanation: z.string().default(''),
  misconceptionsMap: z.record(MisconceptionMapItemSchema).optional(),
});

export const LessonSectionSchema = z.object({
  id: z.string().default(() => `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
  title: z.string().min(1),
  durationMinutes: z.number().positive(),
  conceptSummary: z.string().min(1),
  scriptText: z.string().min(1),
  audioUrl: z.string().optional(),
  visual: VisualContentSchema,
  checkpoints: z.array(QuestionSchema).default([]),
});

export const MultiDayMilestoneSchema = z.object({
  day: z.number(),
  focusTopic: z.string(),
  studyGoal: z.string(),
  tasks: z.array(z.string()),
  revisionKeywords: z.array(z.string()),
});

export const LessonPlanSchema = z.object({
  title: z.string().min(1),
  objective: z.array(z.string()).min(1),
  duration: z.number().positive(), // in minutes
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'elementary', 'middle_school', 'high_school', 'undergraduate']).default('beginner'),
  language: z.enum(['en', 'hi', 'hinglish', 'ne', 'ta', 'es']).default('en'),
  teachingStyle: z.enum(['intuitive', 'rigorous', 'visual', 'analogy_driven', 'socratic']).default('intuitive'),
  prerequisites: z.array(z.string()).default([]),
  sections: z.array(LessonSectionSchema).min(1),
  questions: z.array(QuestionSchema).default([]),
  assessment: z.array(QuestionSchema).default([]),
  visuals: z.array(VisualContentSchema).default([]),
  multiDayPlan: z.array(MultiDayMilestoneSchema).optional(),
});

export type LessonPlan = z.infer<typeof LessonPlanSchema>;
export type LessonSection = z.infer<typeof LessonSectionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type VisualContent = z.infer<typeof VisualContentSchema>;
export type VisualType = z.infer<typeof VisualTypeSchema>;
