// ==========================================
// User & Auth Types
// ==========================================

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  googleId?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type EducationLevel = 'elementary' | 'middle_school' | 'high_school' | 'beginner' | 'intermediate' | 'undergraduate' | 'advanced';
export type TeachingStyle = 'intuitive' | 'rigorous' | 'visual' | 'analogy_driven' | 'socratic';
export type LearningGoal = 'exam_prep' | 'concept_mastery' | 'revision' | 'practical_skills';
export type SupportedLanguage = 'en' | 'hi' | 'hinglish' | 'ta' | 'es' | 'ne';

export interface IStudentProfile {
  _id: string;
  userId: string;
  educationLevel: EducationLevel;
  preferredLanguage: SupportedLanguage;
  learningGoal: LearningGoal;
  teachingStyle: TeachingStyle;
  availableStudyTimeMinutes: number;
  difficultyPreference: 'easy' | 'moderate' | 'challenging';
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Document & RAG Types
// ==========================================

export interface IDocument {
  _id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  filePath: string;
  pageCount?: number;
  isProcessed: boolean;
  createdAt: Date;
}

export interface IDocumentChunk {
  _id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber?: number;
  chapter?: string;
  section?: string;
  text: string;
  tokensCount?: number;
  keywords?: string[];
  embedding?: number[];
  createdAt: Date;
}

export interface IRAGSourceCitation {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  chapter?: string;
  section?: string;
  relevanceScore: number;
  snippet: string;
}

// ==========================================
// Pedagogical & Lesson Planning Types
// ==========================================

export type VisualType = 
  | 'EQUATION' 
  | 'SIMULATION_DIAGRAM' 
  | 'FLOWCHART_PROCESS' 
  | 'CODE_TRACE' 
  | 'TIMELINE' 
  | 'CONCEPT_MAP';

export interface IVisualContent {
  type: VisualType;
  title: string;
  description: string;
  data: any; // LaTeX formula, vector arrows, flowchart nodes, code lines, timeline milestones
}

export type QuestionType = 
  | 'MCQ' 
  | 'SHORT_ANSWER' 
  | 'CONCEPTUAL' 
  | 'APPLICATION' 
  | 'PROBLEM_SOLVING'
  | 'EXPLAIN_IN_OWN_WORDS';

export interface IQuestion {
  _id?: string;
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  rubricKeywords?: string[];
  explanation: string;
  misconceptionsMap?: Record<string, {
    diagnosis: string;
    remediationAnalogy: string;
    followUpPrompt: string;
  }>;
}

export interface ILessonSection {
  id: string;
  title: string;
  durationMinutes: number;
  conceptSummary: string;
  scriptText: string;
  audioUrl?: string;
  visual: IVisualContent;
  checkpoints: IQuestion[];
}

export interface ILesson {
  _id: string;
  userId: string;
  title: string;
  topic: string;
  documentId?: string;
  targetDurationMinutes: number;
  actualPlannedMinutes: number;
  difficulty: EducationLevel;
  language: SupportedLanguage;
  teachingStyle: TeachingStyle;
  objectives: string[];
  prerequisites: string[];
  sections: ILessonSection[];
  assessmentQuestions: IQuestion[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

// ==========================================
// Interactive Teaching State Machine (Phase 6)
// ==========================================

export type TeachingState =
  | 'INTRODUCTION'
  | 'EXPLANATION'
  | 'DEMONSTRATION'
  | 'CHECK_UNDERSTANDING'
  | 'EVALUATE'
  | 'ADAPT'
  | 'REMEDIATION'
  | 'NEXT_CONCEPT'
  | 'FINAL_REVIEW';

export type TeacherState = TeachingState | 'QUESTION' | 'EVALUATING' | 'ADAPTIVE_REMEDIATION' | 'FINAL_ASSESSMENT' | 'COMPLETED';

export type TeacherPersonality =
  | 'Friendly'
  | 'Strict'
  | 'Socratic'
  | 'Exam Coach'
  | 'Patient'
  | 'Professional';

export interface IConceptMastery {
  concept: string;
  masteryScore: number; // 0 - 100
  attempts: number;
  correct: number;
  incorrect: number;
  misconceptions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ITeachingInteraction {
  id: string;
  state: TeachingState;
  teacherSpeech: string;
  teacherAction?: string;
  visual?: IVisualContent | any;
  question?: IQuestion;
  studentAnswer?: string;
  isVoice?: boolean;
  evaluation?: IEvaluationResult;
  misconceptionAnalysis?: {
    rootMisunderstanding: string;
    remediationAnalogy: string;
    easierQuestion?: IQuestion;
  };
  timestamp: Date;
}

export interface IEvaluationResult {
  isCorrect: boolean;
  score: number; // 0 to 10
  feedback: string;
  hasMisconception: boolean;
  misconceptionDiagnosis?: string;
  remediationAnalogy?: string;
  followUpQuestion?: IQuestion;
}

export interface ILessonSession {
  _id: string;
  lessonSessionId?: string;
  userId: string;
  lessonId: string;
  currentSection: number;
  currentConcept: string;
  state: TeachingState;
  masteryScore: number;
  personality: TeacherPersonality;
  language: SupportedLanguage;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  interactionHistory: ITeachingInteraction[];
  conceptMastery: Record<string, IConceptMastery>;
  currentState?: TeacherState;
  currentSectionIndex?: number;
  currentCheckpointIndex?: number;
  activeRemediation?: {
    diagnosis: string;
    analogy: string;
    followUpQuestion: IQuestion;
  };
  answersGiven?: {
    questionId: string;
    answerText: string;
    isVoice: boolean;
    evaluation: IEvaluationResult;
    timestamp: Date;
  }[];
  startedAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

// ==========================================
// Assessment & Progress Types
// ==========================================

export interface IGradedAnswer {
  questionId: string;
  type: QuestionType;
  prompt: string;
  submittedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isPartial: boolean;
  score: number; // 0 to 10
  feedback: string;
  misconceptionDiagnosis?: string;
}

export interface IAssessmentResult {
  _id: string;
  userId: string;
  lessonId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  conceptMastery: Record<string, number>;
  strongConcepts: string[];
  weakConcepts: string[];
  misconceptionsFound: string[];
  recommendedRevisionTopics: string[];
  recommendedPractice: string[];
  nextSuggestedTopic: string;
  gradedAnswers?: IGradedAnswer[];
  createdAt: Date;
}

export interface ILearningProgress {
  _id: string;
  userId: string;
  totalStudyTimeMinutes: number;
  lessonsCompletedCount: number;
  currentStreakDays: number;
  lastStudyDate: Date;
  conceptMasteryMap: Record<string, {
    score: number; // 0 to 100
    attempts: number;
    lastUpdated: Date;
  }>;
  weakConcepts: string[];
  strongConcepts: string[];
}

// ==========================================
// Media, Video Jobs & Voice Types
// ==========================================

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// ==========================================
// Phase 9: AI Teaching Video & Scene Models
// ==========================================

export type SceneType =
  | 'INTRO'
  | 'EXPLANATION'
  | 'DIAGRAM'
  | 'EQUATION'
  | 'CODE'
  | 'EXAMPLE'
  | 'QUESTION'
  | 'SUMMARY';

export type SubjectCategory = 'math' | 'physics' | 'biology' | 'history' | 'programming' | 'general';

export interface ISceneVisual {
  type: SceneType;
  subject: SubjectCategory;
  title: string;
  description: string;
  svgData?: string;
  latexFormula?: string;
  graphPoints?: { x: number; y: number }[];
  labeledStructures?: { label: string; x: number; y: number; detail: string }[];
  timelineEvents?: { year: string | number; title: string; description: string }[];
  codeSnippet?: string;
  codeLanguage?: string;
  executionOutput?: string;
  diagramElements?: Array<{ id: string; label: string; shape: 'rect' | 'circle' | 'arrow'; x: number; y: number }>;
}

export interface ISceneAvatar {
  provider: 'premium' | 'fallback';
  avatarId?: string;
  pose: 'pointing_board' | 'explaining' | 'questioning' | 'summarizing';
  facialExpression: 'neutral' | 'encouraging' | 'thoughtful' | 'excited';
  speakingAnimation: boolean;
  avatarVideoUrl?: string;
}

export interface ISceneVoice {
  speechText: string;
  audioUrl?: string;
  audioBase64?: string;
  durationSeconds: number;
  language: SupportedLanguage;
  voiceName: string;
}

export interface ITeachingScene {
  sceneId: string;
  sceneIndex: number;
  type: SceneType;
  duration: number; // in seconds
  script: string;
  visual: ISceneVisual;
  avatar: ISceneAvatar;
  voice: ISceneVoice;
  textOverlay: {
    headline: string;
    bulletPoints: string[];
    callout?: string;
  };
}

export interface IVideoJob {
  _id: string;
  userId: string;
  lessonId: string;
  topic?: string;
  subject?: SubjectCategory;
  status: JobStatus;
  progressPercent: number;
  currentStage?: string;
  currentSceneIndex?: number;
  totalScenes?: number;
  scenes?: ITeachingScene[];
  outputVideoUrl?: string;
  downloadUrl?: string;
  lessonSources?: Array<{ title: string; type: string; url?: string; citation?: string }>;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface IAvatarRenderOptions {
  pose?: ISceneAvatar['pose'];
  expression?: ISceneAvatar['facialExpression'];
  durationSeconds?: number;
  scriptText?: string;
}

export interface IAvatarRenderResult {
  avatarUrl?: string;
  avatarVideoBase64?: string;
  isFallback: boolean;
  providerName: string;
}

export interface IAvatarProvider {
  name: string;
  isReal: boolean;
  requiresApiKey: boolean;
  generateAvatar(scene: ITeachingScene, options?: IAvatarRenderOptions): Promise<IAvatarRenderResult>;
}

export type VoiceUIState = 'Idle' | 'Listening' | 'Processing' | 'Speaking' | 'Error';

export interface ISTTOptions {
  language?: SupportedLanguage;
  simulateError?: 'PERMISSION_DENIED' | 'EMPTY_AUDIO' | 'NOISY_AUDIO' | 'STT_FAILURE' | 'TIMEOUT';
  timeoutMs?: number;
}

export interface ISTTResult {
  text: string;
  language: SupportedLanguage;
  confidence: number;
  durationSeconds?: number;
  isFallback?: boolean;
}

export interface ITTSOptions {
  language?: SupportedLanguage;
  voiceName?: string;
  speed?: number;
  pitch?: number;
  simulateError?: 'TTS_FAILURE' | 'TIMEOUT';
  timeoutMs?: number;
}

export interface ITTSResult {
  audioBase64?: string;
  audioUrl: string;
  durationSeconds: number;
  language: SupportedLanguage;
  voiceName: string;
  isFallback?: boolean;
  fallbackNotice?: string;
}

export interface ISTTProvider {
  name: string;
  isReal: boolean;
  transcribe(audio: Buffer | string, options?: ISTTOptions): Promise<ISTTResult>;
}

export interface ITTSProvider {
  name: string;
  isReal: boolean;
  synthesize(text: string, options?: ITTSOptions): Promise<ITTSResult>;
}

export interface IVoiceSession {
  _id: string;
  userId: string;
  textInput: string;
  language: SupportedLanguage;
  voiceName: string;
  audioDurationSeconds: number;
  audioFileUrl: string;
  visemeTimings?: { timeMs: number; visemeId: number }[];
  createdAt: Date;
}

export interface IApiUsage {
  _id: string;
  userId: string;
  service: 'gemini' | 'openai' | 'edge_tts' | 'local_heuristic';
  endpoint: string;
  tokensConsumed?: number;
  latencyMs: number;
  costUsd: number;
  createdAt: Date;
}

export interface IAuditLog {
  _id: string;
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

// ==========================================
// Phase 10: Learning Path & Long-Term Analytics
// ==========================================

export interface ICurriculumLessonStep {
  lessonId: string;
  title: string;
  topic: string;
  durationMinutes: number;
  isCompleted: boolean;
  score?: number;
  practiceProblemsCount: number;
  prerequisites: string[];
}

export interface ICurriculumModule {
  moduleId: string;
  title: string;
  order: number;
  description: string;
  isCompleted: boolean;
  lessons: ICurriculumLessonStep[];
}

export interface ICurriculumCourse {
  courseId: string;
  userId: string;
  title: string;
  broadTopic: string;
  progressPercent: number;
  modules: ICurriculumModule[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface IRecommendationItem {
  id: string;
  type: 'REVISE' | 'PRACTICE' | 'NEXT_TOPIC';
  title: string;
  reason: string;
  conceptTarget: string;
  estimatedMinutes: number;
  actionPayload: {
    topic: string;
    lessonId?: string;
    mode?: 'teaching' | 'practice' | 'assessment';
  };
}

export interface IDashboardAnalytics {
  overallProgressPercent: number;
  totalStudyTimeMinutes: number;
  lessonsCompletedCount: number;
  currentStreakDays: number;
  averageScorePercent: number;
  topicMastery: Array<{ topic: string; score: number; attempts: number }>;
  assessmentScores: Array<{ date: string; title: string; score: number; percentage: number }>;
  weakAreas: string[];
  strongAreas: string[];
  recentActivity: Array<{
    id: string;
    type: 'LESSON' | 'ASSESSMENT' | 'VOICE' | 'VIDEO';
    title: string;
    timestamp: Date;
    score?: number;
  }>;
  recommendations: IRecommendationItem[];
  activeLearningPath?: ICurriculumCourse;
}
