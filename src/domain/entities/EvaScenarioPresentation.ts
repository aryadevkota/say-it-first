/**
 * EvaScenarioPresentation.ts — Domain Entity & Presentation Model
 *
 * Defines Eva's scenario-adaptive visual appearance configuration while enforcing
 * strict visual identity consistency:
 * - Eva is the single avatar concept: realistic, friendly adult woman practice partner.
 * - Consistent identity markers: soft shoulder-length auburn-brown hair with gentle waves,
 *   warm hazel-brown eyes, natural skin tone, approachable presence, realistic 3-point lighting.
 * - Contextual wardrobe and environment adaptation:
 *   • Interview / Professional: Professional business attire with modern office setting.
 *   • Coffee Chat / Social: Comfortable knit turtleneck with warm coffee shop background.
 *   • Boundaries / Difficult Conversations: Smart-casual blazer with calm library/study background.
 *   • Healthcare / Appointment: Clinical & professional attire with consultation room setting.
 *   • Everyday / Casual: Comfortable warm knitwear with airy lounge background.
 *   • Custom Scenarios: Heuristic contextual inference based on situation keywords and role.
 */

import type { ScenarioDefinition, InterestCategory } from '../scenarios/topics';

export type EvaOutfit =
  | 'business-attire'
  | 'turtleneck'
  | 'smart-casual'
  | 'clinical-professional'
  | 'casual-knitwear';

export type EvaBackground =
  | 'office'
  | 'coffee-shop'
  | 'quiet-study'
  | 'consultation-room'
  | 'warm-lounge';

export interface EvaIdentityConsistency {
  readonly avatarName: 'Eva';
  readonly persona: string;
  readonly ageBracket: string;
  readonly facialStructure: string;
  readonly eyeColor: string;
  readonly hairColorAndStyle: string;
  readonly expressionBaseline: string;
  readonly realisticLighting: string;
}

export interface EvaPresentationEnvironment {
  readonly settingName: string;
  readonly atmosphericDetails: string;
  readonly lightingMood: string;
  readonly colorPalette: {
    readonly primary: string;
    readonly accent: string;
    readonly backgroundHex: string;
    readonly gradient: string;
  };
}

export interface EvaScenarioPresentation {
  readonly scenarioId: string;
  readonly outfit: EvaOutfit;
  readonly background: EvaBackground;
  readonly outfitLabel: string;
  readonly backgroundLabel: string;
  readonly visualSummary: string;
  readonly badgeText?: string;
  readonly detailedVisualDescription: string;
  readonly consistency: EvaIdentityConsistency;
  readonly environment: EvaPresentationEnvironment;
}

export const EVA_CORE_IDENTITY: EvaIdentityConsistency = Object.freeze({
  avatarName: 'Eva',
  persona: 'Realistic, friendly, adult woman communication practice partner',
  ageBracket: 'Early 30s',
  facialStructure: 'Soft oval face shape with natural jawline, warm neutral undertone, gentle expressive brows',
  eyeColor: 'Warm hazel-brown eyes with gentle catchlights, reflective and attentive',
  hairColorAndStyle: 'Rich auburn-brown hair, shoulder-length with soft natural waves and slight side part',
  expressionBaseline: 'Grounding, calm, empathetic micro-expressions without robotic exaggeration',
  realisticLighting: 'Subtle 3-point portrait illumination with soft ambient key light and warm fill',
});

// Locked voice contract — Alexandra (eleven_multilingual_v2)
export const LOCKED_VOICE_ID = 'kdmDKE6EkgrWrrykO9Qt';
export const LOCKED_VOICE_NAME = 'Alexandra — Conversational and Natural';
export const LOCKED_MODEL_ID = 'eleven_multilingual_v2';
export const TARGET_AUDIO_FORMAT = 'pcm_16000';
export const SIMLI_TARGET_AUDIO_FORMAT = 'pcm_16000';
export const SIMLI_DEFAULT_FACE_ID = 'afdb6a3e-3939-40aa-92df-01604c23101c';

export type PresentationArchetype =
  | 'interview-professional'
  | 'coffee-chat-social'
  | 'boundaries-difficult'
  | 'healthcare-appointment'
  | 'everyday-casual';

export const EVA_PRESENTATION_CONFIGS: Record<
  PresentationArchetype,
  Omit<EvaScenarioPresentation, 'scenarioId'>
> = Object.freeze({
  'interview-professional': {
    outfit: 'business-attire',
    background: 'office',
    outfitLabel: 'Professional Business Attire',
    backgroundLabel: 'Office Background',
    visualSummary: 'Eva • Professional Business Attire • Office Background',
    detailedVisualDescription:
      'Eva is presented in a tailored deep navy-charcoal business blazer over a crisp ivory shell blouse with a discreet minimalist silver pendant. Her shoulder-length auburn-brown hair is smoothly styled behind one ear. She is seated in a modern architectural office setting with floor-to-ceiling glass partitions, subtle warm acoustic oak slats in soft focus, and soft daylight filtering through.',
    consistency: EVA_CORE_IDENTITY,
    environment: {
      settingName: 'Contemporary Modern Office',
      atmosphericDetails: 'Soft-focus professional office suite with architectural glass walls and oak wood accents',
      lightingMood: 'Crisp diffused daylight with subtle warm directional key light',
      colorPalette: {
        primary: '#1E293B',
        accent: '#0EA5E9',
        backgroundHex: '#0F172A',
        gradient: 'from-slate-900 via-slate-800 to-indigo-950',
      },
    },
  },

  'coffee-chat-social': {
    outfit: 'turtleneck',
    background: 'coffee-shop',
    outfitLabel: 'Turtleneck',
    backgroundLabel: 'Coffee Shop',
    visualSummary: 'Eva • Turtleneck • Coffee Shop',
    detailedVisualDescription:
      'Eva wears a comfortable ribbed oatmeal-cream knit turtleneck sweater with soft textured collar folds. Her auburn-brown hair falls naturally around her shoulders in relaxed waves. She is framed against a warm neighborhood coffee shop with soft amber pendant lighting, blurred artisanal timber shelves, a potted monstera, and gentle golden ambient warmth.',
    consistency: EVA_CORE_IDENTITY,
    environment: {
      settingName: 'Artisanal Cafe Interior',
      atmosphericDetails: 'Warm ambient coffee house with soft-focus espresso bar, timber shelving, and leafy greenery',
      lightingMood: 'Warm golden-hour ambient glow with soft incandescent hanging pendants',
      colorPalette: {
        primary: '#78350F',
        accent: '#D97706',
        backgroundHex: '#292017',
        gradient: 'from-[#2A1B12] via-[#3B2519] to-[#1C120C]',
      },
    },
  },

  'boundaries-difficult': {
    outfit: 'smart-casual',
    background: 'quiet-study',
    outfitLabel: 'Smart-Casual Blazer',
    backgroundLabel: 'Calm Library/Study',
    visualSummary: 'Eva • Smart-Casual Blazer • Calm Library/Study',
    detailedVisualDescription:
      'Eva is dressed in an unstructured earth-toned olive/camel smart-casual blazer over a soft heathered sand crewneck. Her hair is loosely gathered with natural framing tendrils. She is positioned in a serene library and study room lined with muted cedar bookshelves, soft matte sage walls, and warm desk-lamp luminescence creating a grounded, reflective atmosphere.',
    consistency: EVA_CORE_IDENTITY,
    environment: {
      settingName: 'Serene Library & Study Room',
      atmosphericDetails: 'Quiet, acoustically balanced library setting with warm wood bookshelves and reading lamps',
      lightingMood: 'Calm, low-glare indirect warm illumination fostering safety and focus',
      colorPalette: {
        primary: '#14532D',
        accent: '#10B981',
        backgroundHex: '#13231B',
        gradient: 'from-[#12221A] via-[#1B3227] to-[#0D1812]',
      },
    },
  },

  'healthcare-appointment': {
    outfit: 'clinical-professional',
    background: 'consultation-room',
    outfitLabel: 'Clinical & Professional Attire',
    backgroundLabel: 'Consultation Room',
    visualSummary: 'Eva • Clinical & Professional Attire • Consultation Room',
    detailedVisualDescription:
      'Eva wears clean, tailored clinical-professional attire featuring a muted eucalyptus-teal consultation coat over a soft linen blouse with a clean notched collar. Her hair is neatly styled back to keep her expressions clear and reassuring. The backdrop depicts a calm, spotless consultation room with soft vertical daylight blinds, a restful pastel backdrop, and a discreet indoor peace lily.',
    consistency: EVA_CORE_IDENTITY,
    environment: {
      settingName: 'Private Medical & Consultation Office',
      atmosphericDetails: 'Orderly, bright, tranquil professional consultation suite with minimal visual distraction',
      lightingMood: 'Balanced, clean, daylight-balanced luminescence with gentle soft shadows',
      colorPalette: {
        primary: '#0F766E',
        accent: '#14B8A6',
        backgroundHex: '#0D2423',
        gradient: 'from-[#0B1E1E] via-[#133230] to-[#0A1817]',
      },
    },
  },

  'everyday-casual': {
    outfit: 'casual-knitwear',
    background: 'warm-lounge',
    outfitLabel: 'Comfortable Warm Knitwear',
    backgroundLabel: 'Airy Lounge',
    visualSummary: 'Eva • Comfortable Warm Knitwear • Airy Lounge',
    detailedVisualDescription:
      'Eva wears a relaxed, fine-gauge heathered sage knit sweater with soft drop shoulders and ribbed cuffs. Her auburn-brown hair is casually styled in loose, natural waves. She is seated in an airy sunlit lounge area with sheer white curtains catching afternoon breeze, warm timber floorboards, and comfortable neutral upholstery.',
    consistency: EVA_CORE_IDENTITY,
    environment: {
      settingName: 'Airy Daylight Living Lounge',
      atmosphericDetails: 'Sunlit, open residential lounge with sheer drapery and gentle natural light',
      lightingMood: 'Soft daylight ambiance with gentle warm fill and airy open atmosphere',
      colorPalette: {
        primary: '#475569',
        accent: '#F59E0B',
        backgroundHex: '#1E2228',
        gradient: 'from-[#1E2228] via-[#2D333B] to-[#181B20]',
      },
    },
  },
});

/**
 * Infer presentation archetype from scenario definition.
 */
export function inferPresentationArchetype(scenario: ScenarioDefinition): PresentationArchetype {
  // Aggregate searchable contextual tokens
  const tokens = [
    scenario.id,
    scenario.category,
    scenario.categoryLabel,
    scenario.title,
    scenario.subtitle,
    scenario.userGoal,
    scenario.partner?.name,
    scenario.partner?.role,
    scenario.partner?.defaultTone,
    scenario.customMetadata?.userProvidedSituation,
    scenario.customMetadata?.relationshipContext,
    scenario.customMetadata?.avoidConstraints,
    scenario.customMetadata?.inferredPartnerConcerns,
    scenario.customMetadata?.inferredConversationalStyle,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // If standard scenario category is recognized and not 'custom', map directly unless clear override
  if (scenario.category && scenario.category !== 'custom') {
    switch (scenario.category as InterestCategory) {
      case 'work-school':
        return 'interview-professional';
      case 'friendships':
        return 'coffee-chat-social';
      case 'boundaries':
        return 'boundaries-difficult';
      case 'appointments':
        return 'healthcare-appointment';
      case 'everyday':
        return 'everyday-casual';
      case 'meeting-people':
        return 'coffee-chat-social';
    }
  }

  // Heuristic Keyword Scoring for Custom and Edge-Case Scenarios
  let interviewScore = 0;
  let coffeeScore = 0;
  let boundaryScore = 0;
  let healthcareScore = 0;
  let everydayScore = 0;

  // 1. Interview / Professional keywords
  const interviewRegex =
    /\b(interview|job|recruiter|hiring|career|promotion|salary|manager|boss|supervisor|director|corporate|workplace|colleague|coworker|stakeholder|presentation|board|client|evaluation|office|lead|executive)\b/g;
  const interviewMatches = tokens.match(interviewRegex);
  if (interviewMatches) interviewScore += interviewMatches.length * 2;

  // 2. Coffee Chat / Social keywords
  const coffeeRegex =
    /\b(coffee|cafe|café|tea|brunch|lunch|dinner|friend|friendship|social|catch up|hangout|meetup|drinks|espresso|latte|turtleneck|buddy|pal)\b/g;
  const coffeeMatches = tokens.match(coffeeRegex);
  if (coffeeMatches) coffeeScore += coffeeMatches.length * 2;

  // 3. Boundaries / Difficult Conversations keywords
  const boundaryRegex =
    /\b(boundar|saying no|decline|refus|difficult|conflict|confront|disagree|argument|landlord|roommate|tenant|negotiat|awkward|tense|tension|uncomfortable|firm|pushy|library|study)\b/g;
  const boundaryMatches = tokens.match(boundaryRegex);
  if (boundaryMatches) boundaryScore += boundaryMatches.length * 2;

  // 4. Healthcare / Appointment keywords
  const healthcareRegex =
    /\b(doctor|physician|nurse|dentist|therapist|therapy|psychiatrist|clinic|clinical|hospital|appointment|prescription|medical|diagnosis|specialist|treatment|healthcare|consultation|patient|medicine)\b/g;
  const healthcareMatches = tokens.match(healthcareRegex);
  if (healthcareMatches) healthcareScore += healthcareMatches.length * 2;

  // 5. Everyday / Casual keywords
  const everydayRegex =
    /\b(small talk|everyday|casual|neighbor|weather|grocer|commute|hallway|lounge|chit chat|stranger|store|errand)\b/g;
  const everydayMatches = tokens.match(everydayRegex);
  if (everydayMatches) everydayScore += everydayMatches.length * 2;

  // Evaluate highest score
  const scores: [PresentationArchetype, number][] = [
    ['interview-professional', interviewScore],
    ['coffee-chat-social', coffeeScore],
    ['boundaries-difficult', boundaryScore],
    ['healthcare-appointment', healthcareScore],
    ['everyday-casual', everydayScore],
  ];

  scores.sort((a, b) => b[1] - a[1]);

  if (scores[0][1] > 0) {
    return scores[0][0];
  }

  // Fallback default: everyday-casual
  return 'everyday-casual';
}

/**
 * Returns Eva's scenario-adaptive appearance and environment presentation.
 */
export function getEvaPresentationForScenario(
  scenario: ScenarioDefinition,
): EvaScenarioPresentation {
  const archetype = inferPresentationArchetype(scenario);
  const baseConfig = EVA_PRESENTATION_CONFIGS[archetype];

  return {
    scenarioId: scenario.id,
    outfit: baseConfig.outfit,
    background: baseConfig.background,
    outfitLabel: baseConfig.outfitLabel,
    backgroundLabel: baseConfig.backgroundLabel,
    visualSummary: baseConfig.visualSummary,
    badgeText: baseConfig.visualSummary,
    detailedVisualDescription: baseConfig.detailedVisualDescription,
    consistency: baseConfig.consistency,
    environment: baseConfig.environment,
  };
}
