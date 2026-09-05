import {
  ILesson,
  ITeachingScene,
  SceneType,
  SubjectCategory,
  SupportedLanguage,
} from '@ai-teacher/types';
import { SubjectAwareVisualGenerator } from './visual_generator';
import { getAvatarProvider } from './avatar_provider';

export interface IScenePlannerOptions {
  topic: string;
  lesson?: ILesson;
  subject?: SubjectCategory;
  language?: SupportedLanguage;
  targetDurationSeconds?: number;
}

export class ScenePlanner {
  /**
   * Deconstructs a lesson topic or lesson plan into structured, subject-aware scenes
   */
  public static async planScenes(options: IScenePlannerOptions): Promise<ITeachingScene[]> {
    const topic = options.topic || 'Newton\'s Laws of Motion';
    const subject = options.subject || SubjectAwareVisualGenerator.detectSubject(topic);
    const language = options.language || 'en';

    // Core scene flow: INTRO -> EXPLANATION -> DIAGRAM -> EQUATION -> CODE -> EXAMPLE -> QUESTION -> SUMMARY
    const sceneBlueprints: Array<{
      type: SceneType;
      duration: number;
      script: string;
      pose: 'explaining' | 'pointing_board' | 'questioning' | 'summarizing';
      expression: 'neutral' | 'encouraging' | 'thoughtful' | 'excited';
      headline: string;
      bulletPoints: string[];
    }> = [
      {
        type: 'INTRO',
        duration: 12,
        script: `Welcome to today's masterclass on ${topic}. Today we unravel the foundational mechanics governing the physical universe.`,
        pose: 'explaining',
        expression: 'excited',
        headline: `Welcome: ${topic}`,
        bulletPoints: ['Foundational Principles', 'Real-World Dynamics', 'Predictive Modeling'],
      },
      {
        type: 'EXPLANATION',
        duration: 18,
        script: `Let us examine how objects behave in isolation. When all acting forces cancel out, inertia dictates that an object maintains its velocity forever.`,
        pose: 'pointing_board',
        expression: 'thoughtful',
        headline: 'Core Concept: Inertia & Equilibrium',
        bulletPoints: ['Zero Net External Force (ΣF = 0)', 'Perpetual Uniform Motion', 'Mass as Measure of Inertia'],
      },
      {
        type: 'DIAGRAM',
        duration: 20,
        script: `Observe the vector diagram on our board. Notice how normal force and gravity are in exact balance, leaving velocity unimpeded.`,
        pose: 'pointing_board',
        expression: 'encouraging',
        headline: 'Vector Mechanics & Equilibrium',
        bulletPoints: ['Normal Force counters Gravity', 'No lateral drag or friction', 'Constant vector trajectory'],
      },
      {
        type: 'EQUATION',
        duration: 16,
        script: `Mathematically, this is expressed by the derivative of momentum. When net force is zero, acceleration must strictly equal zero.`,
        pose: 'pointing_board',
        expression: 'thoughtful',
        headline: 'Mathematical Formulation',
        bulletPoints: ['F_net = m * a = 0', 'dv/dt = 0 -> v(t) = C', 'Conservation of Momentum'],
      },
      {
        type: 'CODE',
        duration: 18,
        script: `In computational physics, we simulate this state with numerical integration. Notice how velocity never diminishes across 100 timesteps.`,
        pose: 'pointing_board',
        expression: 'excited',
        headline: 'Computational Simulation',
        bulletPoints: ['Euler/Verlet Numerical Step', 'Zero force delta', 'Execution state conservation'],
      },
      {
        type: 'EXAMPLE',
        duration: 16,
        script: `Consider deep space probes like Voyager 1. Having escaped planetary friction, it drifts through the cosmos at constant speed without burning fuel.`,
        pose: 'explaining',
        expression: 'encouraging',
        headline: 'Real-World Application',
        bulletPoints: ['Voyager Interstellar Mission', 'Zero fuel required for drift', 'Continuous constant speed'],
      },
      {
        type: 'QUESTION',
        duration: 14,
        script: `Here is a checkpoint: What happens to a moving spacecraft if its engines are turned off in deep space? Does it stop, slow down, or keep moving?`,
        pose: 'questioning',
        expression: 'thoughtful',
        headline: 'Concept Checkpoint',
        bulletPoints: ['A: Comes to an immediate stop', 'B: Gradually slows down', 'C: Continues at identical speed (Correct)'],
      },
      {
        type: 'SUMMARY',
        duration: 12,
        script: `To summarize: inertia preserves momentum perpetually until an external net force intervenes. Outstanding work today!`,
        pose: 'summarizing',
        expression: 'excited',
        headline: 'Key Takeaways & Mastery',
        bulletPoints: ['Inertia requires NO fuel to maintain speed', 'Only external net force causes acceleration', 'Universal conservation principle'],
      },
    ];

    const avatarProvider = getAvatarProvider();
    const scenes: ITeachingScene[] = [];

    for (let i = 0; i < sceneBlueprints.length; i++) {
      const bp = sceneBlueprints[i];
      const sceneId = `scene_${i + 1}_${Date.now()}`;

      // Generate domain-specific visual
      const visual = SubjectAwareVisualGenerator.generateVisualForScene(
        bp.type,
        subject,
        topic,
        bp.headline
      );

      // Create scene object
      const scene: ITeachingScene = {
        sceneId,
        sceneIndex: i + 1,
        type: bp.type,
        duration: bp.duration,
        script: bp.script,
        visual,
        avatar: {
          provider: 'fallback',
          pose: bp.pose,
          facialExpression: bp.expression,
          speakingAnimation: true,
        },
        voice: {
          speechText: bp.script,
          durationSeconds: bp.duration,
          language,
          voiceName: language === 'hi' ? 'hi-IN-SwaraNeural' : 'en-US-JennyNeural',
          audioUrl: `/static/audio/scene_${i + 1}.mp3`,
        },
        textOverlay: {
          headline: bp.headline,
          bulletPoints: bp.bulletPoints,
          callout: bp.type === 'QUESTION' ? 'Pause & Reflect' : undefined,
        },
      };

      // Enrich with avatar render
      const avatarResult = await avatarProvider.generateAvatar(scene, {
        pose: bp.pose,
        expression: bp.expression,
        durationSeconds: bp.duration,
        scriptText: bp.script,
      });

      scene.avatar.avatarVideoUrl = avatarResult.avatarUrl;
      scenes.push(scene);
    }

    return scenes;
  }
}
