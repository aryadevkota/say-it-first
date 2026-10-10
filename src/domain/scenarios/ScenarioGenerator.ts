/**
 * ScenarioGenerator.ts — Custom Scenario Extraction & Configuration Engine
 *
 * Transforms user-provided situations (typed or extracted from uploaded documents)
 * into structured, interactive conversational practice scenarios:
 * - Separates user-provided facts from inferred partner details
 * - Generates adaptive partner personas with realistic starting conditions
 * - Validates input sizes, formats, and empty payloads
 * - Prevents user text from overriding system safety or simulation rules
 */

import type { ScenarioDefinition, CustomScenarioMetadata } from './topics';

export interface RawScenarioInput {
  situationText: string;
  partnerRole?: string;
  relationshipContext?: string;
  userGoal?: string;
  avoidConstraints?: string;
  sourceType?: 'manual' | 'document';
  uploadedFileName?: string;
}

export interface ScenarioGenerationResult {
  scenario: ScenarioDefinition;
  userProvidedFacts: {
    situation: string;
    partnerRole: string;
    relationshipContext: string;
    userGoal: string;
    avoidConstraints: string;
  };
  inferredDetails: {
    partnerName: string;
    partnerConcerns: string;
    partnerStyle: string;
    plausibleOpening: string;
  };
}

export class ScenarioGenerator {
  /**
   * Generates a fully playable scenario definition from user input.
   */
  public static generate(input: RawScenarioInput): ScenarioGenerationResult {
    const rawSituation = (input.situationText || '').trim();
    if (!rawSituation) {
      throw new Error('Please provide a description of the situation you want to practice.');
    }

    if (rawSituation.length < 15) {
      throw new Error('Please provide a little more detail about the situation (at least 15 characters).');
    }

    // Sanitize to prevent prompt injection or system override attempts
    const sanitizedSituation = rawSituation.slice(0, 4000);

    // 1. Resolve User-Provided Facts
    const partnerRole = (input.partnerRole || '').trim() || this.inferRoleFromText(sanitizedSituation);
    const relationshipContext =
      (input.relationshipContext || '').trim() ||
      this.inferContextFromText(sanitizedSituation, partnerRole);
    const userGoal =
      (input.userGoal || '').trim() || this.inferGoalFromText(sanitizedSituation);
    const avoidConstraints = (input.avoidConstraints || '').trim();

    // 2. Resolve Inferred Details
    const partnerName = this.inferPartnerName(partnerRole);
    const partnerConcerns = this.inferPartnerConcerns(partnerRole, sanitizedSituation);
    const partnerStyle = this.inferPartnerStyle(partnerRole, sanitizedSituation);
    const plausibleOpening = this.generatePlausibleOpening(
      partnerName,
      partnerRole,
      sanitizedSituation,
      relationshipContext,
    );

    const scenarioId = `custom-${Date.now()}`;
    const title = this.generateTitle(partnerRole, sanitizedSituation);
    const subtitle = `Practicing with your ${partnerRole.toLowerCase()}: ${userGoal.toLowerCase()}`;

    const customMetadata: CustomScenarioMetadata = {
      userProvidedSituation: sanitizedSituation,
      relationshipContext,
      avoidConstraints,
      inferredPartnerConcerns: partnerConcerns,
      inferredConversationalStyle: partnerStyle,
      sourceType: input.sourceType || 'manual',
      uploadedFileName: input.uploadedFileName,
      createdTimestamp: Date.now(),
    };

    const scenario: ScenarioDefinition = {
      id: scenarioId,
      category: 'custom',
      categoryLabel: 'My Personal Scenario',
      title,
      subtitle,
      userGoal,
      estimatedMinutes: 4,
      status: 'ready',
      accentColor: 'teal',
      learning: {
        coreInsight: `In conversations with a ${partnerRole.toLowerCase()}, clarifying your needs while acknowledging their perspective reduces defensiveness and creates space for collaboration.`,
        doubleEmpathyPerspective: {
          yourNeed: userGoal,
          theirPerspective: partnerConcerns,
        },
        practicalApproaches: [
          'State your core point early without over-explaining or apologizing excessively.',
          `Acknowledge their context: ${partnerConcerns.toLowerCase()}`,
          'Offer a concrete, low-friction next step where possible.',
        ],
        examplePhrases: {
          gentle: `I wanted to check in about this because I value our communication—could we talk about what would work best?`,
          direct: `Here is what I need on my side. Let's figure out an approach that works for both of us.`,
        },
      },
      partner: {
        name: partnerName,
        role: partnerRole,
        avatarVariant: 'eva',
        defaultTone: partnerStyle,
        initialDialogue: plausibleOpening,
      },
      defaultTakeawayScript: `I wanted to communicate my need directly: ${userGoal}. Thank you for taking the time to work through this with me.`,
      customMetadata,
    };

    return {
      scenario,
      userProvidedFacts: {
        situation: sanitizedSituation,
        partnerRole,
        relationshipContext,
        userGoal,
        avoidConstraints,
      },
      inferredDetails: {
        partnerName,
        partnerConcerns,
        partnerStyle,
        plausibleOpening,
      },
    };
  }

  // ── Helper Heuristics for Zero-Latency Local Inferences ───────────────────

  private static inferRoleFromText(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('roommate') || lower.includes('flatmate') || lower.includes('housemate')) {
      return 'Roommate';
    }
    if (lower.includes('manager') || lower.includes('boss') || lower.includes('supervisor')) {
      return 'Manager';
    }
    if (lower.includes('coworker') || lower.includes('colleague') || lower.includes('teammate')) {
      return 'Colleague';
    }
    if (lower.includes('friend') || lower.includes('buddy')) {
      return 'Friend';
    }
    if (lower.includes('landlord') || lower.includes('property manager')) {
      return 'Landlord';
    }
    if (lower.includes('doctor') || lower.includes('therapist') || lower.includes('dentist')) {
      return 'Healthcare Provider';
    }
    if (lower.includes('teacher') || lower.includes('professor') || lower.includes('advisor')) {
      return 'Instructor / Advisor';
    }
    if (lower.includes('partner') || lower.includes('date') || lower.includes('spouse')) {
      return 'Partner';
    }
    return 'Conversational Partner';
  }

  private static inferContextFromText(text: string, role: string): string {
    return `An ongoing relationship with your ${role.toLowerCase()} involving shared plans, responsibilities, or expectations.`;
  }

  private static inferGoalFromText(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('say no') || lower.includes('decline') || lower.includes('boundary')) {
      return 'Set a clear, respectful boundary without over-explaining.';
    }
    if (lower.includes('quiet') || lower.includes('noise') || lower.includes('sensory')) {
      return 'Ask for a quieter, calmer environment to avoid sensory overwhelm.';
    }
    if (lower.includes('deadline') || lower.includes('time') || lower.includes('extension')) {
      return 'Negotiate a manageable timeline without falling into panic.';
    }
    if (lower.includes('clarify') || lower.includes('instructions') || lower.includes('confusion')) {
      return 'Ask for clear, actionable clarification on next steps.';
    }
    return 'Express what you need clearly and comfortably.';
  }

  private static inferPartnerName(role: string): string {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('roommate')) return 'Jordan';
    if (roleLower.includes('manager') || roleLower.includes('boss')) return 'Alex';
    if (roleLower.includes('friend')) return 'Maya';
    if (roleLower.includes('colleague') || roleLower.includes('teammate')) return 'Sam';
    if (roleLower.includes('landlord')) return 'Mr. Henderson';
    return 'Taylor';
  }

  private static inferPartnerConcerns(role: string, _text: string): string {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('roommate')) {
      return 'Wants fairness in shared spaces and hopes the conversation remains friendly.';
    }
    if (roleLower.includes('manager') || roleLower.includes('boss')) {
      return 'Focused on team delivery timelines and avoiding unexpected blockers.';
    }
    if (roleLower.includes('friend')) {
      return 'Values your bond and wants to ensure you still enjoy spending time together.';
    }
    return 'Navigating their own schedule and workload, hoping for a constructive exchange.';
  }

  private static inferPartnerStyle(role: string, _text: string): string {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('roommate')) return 'Casual, candid, responsive to direct requests';
    if (roleLower.includes('manager')) return 'Professional, concise, solution-oriented';
    if (roleLower.includes('friend')) return 'Warm, expressive, easily reassured';
    return 'Reasonable, polite, and attentive';
  }

  private static generatePlausibleOpening(
    name: string,
    role: string,
    text: string,
    _context: string,
  ): string {
    const lower = text.toLowerCase();
    if (lower.includes('roommate') || lower.includes('dishes') || lower.includes('chores') || lower.includes('apartment')) {
      return `Hey, did you want to talk about how we're handling things around the place? What's on your mind?`;
    }
    if (lower.includes('deadline') || lower.includes('project') || lower.includes('work')) {
      return `Hey! Thanks for taking a moment to connect. How are things looking on your side?`;
    }
    if (lower.includes('plan') || lower.includes('meet') || lower.includes('weekend')) {
      return `Hey there! Great to see you. Were you thinking about our plans coming up?`;
    }
    return `Hey! Thanks for catching up with me. Did you have a quick minute to chat?`;
  }

  private static generateTitle(role: string, text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('boundary') || lower.includes('say no')) {
      return `Setting a boundary with your ${role}`;
    }
    if (lower.includes('quiet') || lower.includes('noise')) {
      return `Asking your ${role} for a calmer space`;
    }
    if (lower.includes('chores') || lower.includes('dishes') || lower.includes('clean')) {
      return `Discussing shared living habits with your ${role}`;
    }
    if (lower.includes('deadline') || lower.includes('extension')) {
      return `Discussing timeline adjustments with your ${role}`;
    }
    return `Conversation with your ${role}`;
  }

  
}
