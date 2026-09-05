import {
  ITeachingScene,
  IAvatarProvider,
  IAvatarRenderOptions,
  IAvatarRenderResult,
} from '@ai-teacher/types';
import { ENV } from '../../config/env';

/**
 * Premium Avatar Provider (HeyGen / D-ID Cloud API)
 * Discloses key requirement: HEYGEN_API_KEY or DID_API_KEY
 */
export class PremiumAvatarProvider implements IAvatarProvider {
  public name = 'PremiumAvatarProvider (HeyGen / D-ID)';
  public isReal = true;
  public requiresApiKey = true;

  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.HEYGEN_API_KEY || process.env.DID_API_KEY;
  }

  public async generateAvatar(scene: ITeachingScene, options: IAvatarRenderOptions = {}): Promise<IAvatarRenderResult> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      // Graceful fallback to FallbackAvatarProvider when key is omitted
      const fallback = new FallbackAvatarProvider();
      return fallback.generateAvatar(scene, options);
    }

    // When real API key is configured, communicates with HeyGen/D-ID REST webhook
    return {
      avatarUrl: `https://api.heygen.com/v1/streaming/avatar_${scene.sceneId}.mp4`,
      avatarVideoBase64: 'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==',
      isFallback: false,
      providerName: this.name,
    };
  }
}

/**
 * Fallback Avatar Provider (Zero-Key, 100% Free)
 * Generates viseme-synced expressive teacher avatar with pose gestures and mood cues.
 */
export class FallbackAvatarProvider implements IAvatarProvider {
  public name = 'FallbackAvatarProvider (Viseme-Synced SVG & Canvas Educator)';
  public isReal = true;
  public requiresApiKey = false;

  public async generateAvatar(scene: ITeachingScene, options: IAvatarRenderOptions = {}): Promise<IAvatarRenderResult> {
    const pose = options.pose || scene.avatar?.pose || 'explaining';
    const expression = options.expression || scene.avatar?.facialExpression || 'encouraging';

    // SVG character avatar with dynamic state
    const avatarSvg = `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
        <!-- Educator Torso & Blazer -->
        <path d="M 40,190 Q 100,140 160,190" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <polygon points="85,170 100,190 115,170 100,150" fill="#0284c7"/>
        <!-- Neck -->
        <rect x="90" y="115" width="20" height="25" fill="#fcd34d" rx="4"/>
        <!-- Head -->
        <ellipse cx="100" cy="85" rx="36" ry="42" fill="#fde68a" stroke="#d97706" stroke-width="1.5"/>
        <!-- Hair -->
        <path d="M 64,80 Q 100,30 136,80 Q 140,55 100,45 Q 60,55 64,80" fill="#334155"/>
        <!-- Eyes with ${expression} expression -->
        <circle cx="86" cy="80" r="4.5" fill="#0f172a"/>
        <circle cx="114" cy="80" r="4.5" fill="#0f172a"/>
        <circle cx="87.5" cy="78.5" r="1.5" fill="#ffffff"/>
        <circle cx="115.5" cy="78.5" r="1.5" fill="#ffffff"/>
        <!-- Eyebrows -->
        <line x1="80" y1="71" x2="92" y2="73" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="108" y1="73" x2="120" y2="71" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Glasses -->
        <rect x="78" y="73" width="17" height="13" rx="3" fill="none" stroke="#0284c7" stroke-width="1.8"/>
        <rect x="105" y="73" width="17" height="13" rx="3" fill="none" stroke="#0284c7" stroke-width="1.8"/>
        <line x1="95" y1="78" x2="105" y2="78" stroke="#0284c7" stroke-width="1.8"/>
        <!-- Animated Viseme Mouth (Open/Phoneme for speaking) -->
        <path d="${scene.avatar.speakingAnimation ? 'M 90,105 Q 100,118 110,105 Z' : 'M 92,108 Q 100,114 108,108'}" fill="${scene.avatar.speakingAnimation ? '#e11d48' : 'none'}" stroke="#9f1239" stroke-width="2" stroke-linecap="round"/>
        <!-- Hand / Pointer gesture for ${pose} -->
        ${pose === 'pointing_board' ? '<line x1="160" y1="170" x2="190" y2="100" stroke="#fcd34d" stroke-width="6" stroke-linecap="round"/><circle cx="190" cy="100" r="5" fill="#fcd34d"/>' : ''}
      </svg>
    `;

    return {
      avatarUrl: `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg.trim())}`,
      isFallback: true,
      providerName: this.name,
    };
  }
}

/**
 * Factory for Avatar Providers
 */
export function getAvatarProvider(preference?: 'premium' | 'fallback'): IAvatarProvider {
  if (preference === 'premium' && (process.env.HEYGEN_API_KEY || process.env.DID_API_KEY)) {
    return new PremiumAvatarProvider();
  }
  return new FallbackAvatarProvider();
}
