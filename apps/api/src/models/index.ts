import mongoose, { Schema, Document as MDocument } from 'mongoose';
import {
  IUser,
  IStudentProfile,
  IDocument,
  IDocumentChunk,
  ILesson,
  ILessonSession,
  IQuestion,
  IAssessmentResult,
  ILearningProgress,
  IVideoJob,
  IVoiceSession,
  IApiUsage,
  IAuditLog
} from '@ai-teacher/types';

// 1. User Model (with bcrypt pre-save hashing & methods)
export { UserModel } from './user.model';

// 2. StudentProfile Model
const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: String, required: true, unique: true, index: true },
  educationLevel: { type: String, default: 'beginner' },
  preferredLanguage: { type: String, default: 'en' },
  learningGoal: { type: String, default: 'concept_mastery' },
  teachingStyle: { type: String, default: 'intuitive' },
  availableStudyTimeMinutes: { type: Number, default: 20 },
  difficultyPreference: { type: String, default: 'moderate' },
}, { timestamps: true });

export const StudentProfileModel = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);

// 3 & 4. Document & DocumentChunk Models (with status, storagePath, metadata)
export { DocumentModel, DocumentChunkModel } from './document.model';

// 5. Course Model
export interface ICourse {
  _id: string;
  title: string;
  category: string;
  description: string;
  syllabus: string[];
  createdAt: Date;
}
const CourseSchema = new Schema<ICourse>({
  title: { type: String, required: true, index: true },
  category: { type: String, required: true },
  description: { type: String },
  syllabus: [{ type: String }],
}, { timestamps: true });

export const CourseModel = mongoose.model<ICourse>('Course', CourseSchema);

// 6. LearningPath Model
export interface ILearningPath {
  _id: string;
  userId: string;
  courseTitle: string;
  modules: {
    title: string;
    description: string;
    isCompleted: boolean;
    estimatedMinutes: number;
    prerequisites: string[];
  }[];
  createdAt: Date;
}
const LearningPathSchema = new Schema<ILearningPath>({
  userId: { type: String, required: true, index: true },
  courseTitle: { type: String, required: true },
  modules: [{
    title: { type: String, required: true },
    description: { type: String },
    isCompleted: { type: Boolean, default: false },
    estimatedMinutes: { type: Number, default: 20 },
    prerequisites: [{ type: String }],
  }],
}, { timestamps: true });

export const LearningPathModel = mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);

// 7. Lesson Model
const LessonSchema = new Schema<ILesson>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  topic: { type: String, required: true, index: true },
  documentId: { type: String },
  targetDurationMinutes: { type: Number, required: true },
  actualPlannedMinutes: { type: Number, required: true },
  difficulty: { type: String, required: true },
  language: { type: String, required: true },
  teachingStyle: { type: String, required: true },
  objectives: [{ type: String }],
  prerequisites: [{ type: String }],
  sections: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    conceptSummary: { type: String },
    scriptText: { type: String, required: true },
    audioUrl: { type: String },
    visual: {
      type: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String },
      data: { type: Schema.Types.Mixed },
    },
    checkpoints: [{
      id: { type: String, required: true },
      type: { type: String, required: true },
      prompt: { type: String, required: true },
      options: [{ type: String }],
      correctAnswer: { type: String, required: true },
      rubricKeywords: [{ type: String }],
      explanation: { type: String },
      misconceptionsMap: { type: Schema.Types.Mixed },
    }],
  }],
  assessmentQuestions: [{
    id: { type: String, required: true },
    type: { type: String, required: true },
    prompt: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String },
  }],
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const LessonModel = mongoose.model<ILesson>('Lesson', LessonSchema);

// 8. LessonSession Model
const LessonSessionSchema = new Schema<ILessonSession>({
  lessonSessionId: { type: String, index: true },
  userId: { type: String, required: true, index: true },
  lessonId: { type: String, required: true, index: true },
  currentSection: { type: Number, default: 0 },
  currentConcept: { type: String, default: '' },
  state: { type: String, default: 'INTRODUCTION' },
  masteryScore: { type: Number, default: 0 },
  personality: { type: String, default: 'Friendly' },
  language: { type: String, default: 'en' },
  difficulty: { type: String, default: 'beginner' },
  interactionHistory: [{ type: Schema.Types.Mixed }],
  conceptMastery: { type: Schema.Types.Mixed, default: {} },
  currentState: { type: String, required: true, default: 'INTRODUCTION' },
  currentSectionIndex: { type: Number, default: 0 },
  currentCheckpointIndex: { type: Number, default: 0 },
  activeRemediation: { type: Schema.Types.Mixed },
  answersGiven: [{
    questionId: { type: String },
    answerText: { type: String },
    isVoice: { type: Boolean, default: false },
    evaluation: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  }],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { timestamps: true });

export const LessonSessionModel = mongoose.model<ILessonSession>('LessonSession', LessonSessionSchema);

// 9. Question Model
const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true },
  prompt: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  rubricKeywords: [{ type: String }],
  explanation: { type: String },
  misconceptionsMap: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const QuestionModel = mongoose.model<IQuestion>('Question', QuestionSchema);

// 10. Answer Model
export interface IAnswer {
  userId: string;
  lessonSessionId: string;
  questionId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  misconceptionFound?: string;
  createdAt: Date;
}
const AnswerSchema = new Schema<IAnswer>({
  userId: { type: String, required: true, index: true },
  lessonSessionId: { type: String, required: true, index: true },
  questionId: { type: String, required: true },
  submittedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  score: { type: Number, required: true },
  feedback: { type: String },
  misconceptionFound: { type: String },
}, { timestamps: true });

export const AnswerModel = mongoose.model<IAnswer>('Answer', AnswerSchema);

// 11. Assessment Model
export interface IAssessment {
  lessonId: string;
  title: string;
  questions: IQuestion[];
  passingScorePercent: number;
}
const AssessmentSchema = new Schema<IAssessment>({
  lessonId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  questions: [{ type: Schema.Types.Mixed }],
  passingScorePercent: { type: Number, default: 70 },
}, { timestamps: true });

export const AssessmentModel = mongoose.model<IAssessment>('Assessment', AssessmentSchema);

// 12. AssessmentResult Model
const AssessmentResultSchema = new Schema<IAssessmentResult>({
  userId: { type: String, required: true, index: true },
  lessonId: { type: String, required: true, index: true },
  totalScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  accuracy: { type: Number, default: 0 },
  conceptMastery: { type: Schema.Types.Mixed, default: {} },
  strongConcepts: [{ type: String }],
  weakConcepts: [{ type: String }],
  misconceptionsFound: [{ type: String }],
  recommendedRevisionTopics: [{ type: String }],
  recommendedPractice: [{ type: String }],
  nextSuggestedTopic: { type: String },
  gradedAnswers: [{ type: Schema.Types.Mixed }],
}, { timestamps: true });

export const AssessmentResultModel = mongoose.model<IAssessmentResult>('AssessmentResult', AssessmentResultSchema);

// 12b. ConceptMastery Model
export interface IConceptMasteryRecord {
  userId: string;
  lessonId?: string;
  concept: string;
  masteryScore: number;
  attempts: number;
  correct: number;
  incorrect: number;
  misconceptions: string[];
  difficulty: string;
  lastUpdated: Date;
}
const ConceptMasterySchema = new Schema<IConceptMasteryRecord>({
  userId: { type: String, required: true, index: true },
  lessonId: { type: String, index: true },
  concept: { type: String, required: true, index: true },
  masteryScore: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  incorrect: { type: Number, default: 0 },
  misconceptions: [{ type: String }],
  difficulty: { type: String, default: 'beginner' },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export const ConceptMasteryModel = mongoose.model<IConceptMasteryRecord>('ConceptMastery', ConceptMasterySchema);

// 13. LearningProgress Model
const LearningProgressSchema = new Schema<ILearningProgress>({
  userId: { type: String, required: true, unique: true, index: true },
  totalStudyTimeMinutes: { type: Number, default: 0 },
  lessonsCompletedCount: { type: Number, default: 0 },
  currentStreakDays: { type: Number, default: 1 },
  lastStudyDate: { type: Date, default: Date.now },
  conceptMasteryMap: { type: Schema.Types.Mixed, default: {} },
  weakConcepts: [{ type: String }],
  strongConcepts: [{ type: String }],
}, { timestamps: true });

export const LearningProgressModel = mongoose.model<ILearningProgress>('LearningProgress', LearningProgressSchema);

// 14. WeakConcept Model
export interface IWeakConcept {
  userId: string;
  conceptName: string;
  failureCount: number;
  lastEncountered: Date;
  resolved: boolean;
}
const WeakConceptSchema = new Schema<IWeakConcept>({
  userId: { type: String, required: true, index: true },
  conceptName: { type: String, required: true },
  failureCount: { type: Number, default: 1 },
  lastEncountered: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

export const WeakConceptModel = mongoose.model<IWeakConcept>('WeakConcept', WeakConceptSchema);

// 15. StrongConcept Model
export interface IStrongConcept {
  userId: string;
  conceptName: string;
  masteryScore: number;
  successCount: number;
  lastDemonstrated: Date;
}
const StrongConceptSchema = new Schema<IStrongConcept>({
  userId: { type: String, required: true, index: true },
  conceptName: { type: String, required: true },
  masteryScore: { type: Number, default: 90 },
  successCount: { type: Number, default: 1 },
  lastDemonstrated: { type: Date, default: Date.now },
}, { timestamps: true });

export const StrongConceptModel = mongoose.model<IStrongConcept>('StrongConcept', StrongConceptSchema);

// 16. TeacherSession Model
export interface ITeacherSession {
  userId: string;
  lessonId: string;
  topic: string;
  interactionCount: number;
  studentDoubtQuestions: string[];
  reteachCount: number;
  durationSeconds: number;
  createdAt: Date;
}
const TeacherSessionSchema = new Schema<ITeacherSession>({
  userId: { type: String, required: true, index: true },
  lessonId: { type: String, required: true },
  topic: { type: String, required: true },
  interactionCount: { type: Number, default: 0 },
  studentDoubtQuestions: [{ type: String }],
  reteachCount: { type: Number, default: 0 },
  durationSeconds: { type: Number, default: 0 },
}, { timestamps: true });

export const TeacherSessionModel = mongoose.model<ITeacherSession>('TeacherSession', TeacherSessionSchema);

// 17. VideoJob Model
const VideoJobSchema = new Schema<IVideoJob>({
  userId: { type: String, required: true, index: true },
  lessonId: { type: String, required: true, index: true },
  topic: { type: String },
  subject: { type: String, default: 'physics' },
  status: { type: String, enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'QUEUED', index: true },
  progressPercent: { type: Number, default: 0 },
  currentStage: { type: String, default: 'Queued for generation' },
  currentSceneIndex: { type: Number, default: 0 },
  totalScenes: { type: Number, default: 0 },
  scenes: { type: [Schema.Types.Mixed], default: [] },
  outputVideoUrl: { type: String },
  downloadUrl: { type: String },
  lessonSources: { type: [Schema.Types.Mixed], default: [] },
  errorMessage: { type: String },
  completedAt: { type: Date },
}, { timestamps: true });

export const VideoJobModel = mongoose.model<IVideoJob>('VideoJob', VideoJobSchema);

// 18. VoiceSession Model
const VoiceSessionSchema = new Schema<IVoiceSession>({
  userId: { type: String, required: true, index: true },
  textInput: { type: String, required: true },
  language: { type: String, default: 'en' },
  voiceName: { type: String, default: 'hi-IN-SwaraNeural' },
  audioDurationSeconds: { type: Number, default: 0 },
  audioFileUrl: { type: String, required: true },
  visemeTimings: [{
    timeMs: { type: Number },
    visemeId: { type: Number },
  }],
}, { timestamps: true });

export const VoiceSessionModel = mongoose.model<IVoiceSession>('VoiceSession', VoiceSessionSchema);

// 19. ApiUsage Model
const ApiUsageSchema = new Schema<IApiUsage>({
  userId: { type: String, required: true, index: true },
  service: { type: String, required: true },
  endpoint: { type: String, required: true },
  tokensConsumed: { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  costUsd: { type: Number, default: 0 },
}, { timestamps: true });

export const ApiUsageModel = mongoose.model<IApiUsage>('ApiUsage', ApiUsageSchema);

// 20. AuditLog Model
const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, index: true },
  action: { type: String, required: true, index: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  details: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
