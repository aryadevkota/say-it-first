/**
 * ReportGeneratorService.ts — Domain Service for synthesizing conversation reports
 *
 * Implements strengths-based, neurodiversity-affirming social analysis per the product specification:
 * - Strengths come first
 * - Tentative, non-absolute language ("may have signaled", "one interpretation is")
 * - Explains the social "why" behind interpretations
 * - Offers multiple valid response paths (empathetic, curious, direct)
 * - Summarizes cues, repeatable habits, and 1-3 actionable practice goals
 */

import {
  SessionReport,
  ExchangeAnalysis,
  TranscriptTurn,
  SkillTag,
  AlternativeResponseOption,
  RepeatableHabit,
  MissedOpportunity,
  PracticeGoal,
  SkillSummary,
} from '../entities/SessionReport';
import { ScenarioDefinition, getTopicById } from '../scenarios/topics';

export interface GenerateReportInput {
  scenarioId: string;
  turns: { role: 'partner' | 'user'; text: string; id?: string }[];
  durationSeconds?: number;
  customScenario?: {
    situation?: string;
    partner_role?: string;
    partner_name?: string;
    user_goal?: string;
  };
}

export class ReportGeneratorService {
  /**
   * Generates a comprehensive, strengths-first SessionReport from conversation turns.
   */
  public generateReport(input: GenerateReportInput): SessionReport {
    const { scenarioId, turns, durationSeconds = 90, customScenario } = input;
    const topic = getTopicById(scenarioId);
    const partnerName = customScenario?.partner_name || topic?.partner.name || 'Sophia';
    const partnerRole = customScenario?.partner_role || topic?.partner.role || 'Conversation Partner';
    const scenarioTitle = topic?.title || customScenario?.situation || 'Conversational Practice';
    const categoryLabel = topic?.categoryLabel || 'Conversation';

    // 1. Build Transcript
    const transcript: TranscriptTurn[] = turns.map((t, i) => ({
      id: t.id || `turn-${i}`,
      role: t.role,
      speakerName: t.role === 'partner' ? partnerName : 'You',
      text: t.text,
    }));

    // 2. Pair turns into exchanges: Partner turn -> User response
    const exchanges: ExchangeAnalysis[] = [];
    const userTurns = turns.filter((t) => t.role === 'user');

    for (let i = 0; i < turns.length; i++) {
      if (turns[i].role === 'user') {
        const precedingPartnerTurn = i > 0 && turns[i - 1].role === 'partner' ? turns[i - 1] : null;
        const exchangeIdx = exchanges.length + 1;
        const exchange = this.analyzeExchange({
          exchangeIndex: exchangeIdx,
          partnerName,
          partnerMessage: precedingPartnerTurn ? precedingPartnerTurn.text : '(Conversation start)',
          userMessage: turns[i].text,
          topic,
          isFirstUserTurn: exchangeIdx === 1,
          isLastUserTurn: exchangeIdx === userTurns.length,
        });
        exchanges.push(exchange);
      }
    }

    // If no user turns, provide at least one introductory placeholder exchange
    if (exchanges.length === 0) {
      exchanges.push(
        this.analyzeExchange({
          exchangeIndex: 1,
          partnerName,
          partnerMessage: turns[0]?.text || topic?.partner.initialDialogue || 'Hello!',
          userMessage: '(No verbal response recorded)',
          topic,
          isFirstUserTurn: true,
          isLastUserTurn: true,
        }),
      );
    }

    // 3. Synthesize Strengths (What You Did Well - 3 to 5 concrete items)
    const whatYouDidWell = this.extractStrengths(exchanges, topic);

    // 4. Synthesize Repeatable Habits (What to Keep Doing)
    const whatToKeepDoing = this.extractRepeatableHabits(exchanges, topic);

    // 5. Synthesize Social & Emotional Cues
    const socialEmotionalCues = this.extractCuePatterns(exchanges, partnerName);

    // 6. Synthesize Skill Tags & Learning Patterns
    const skillTagSummary = this.aggregateSkillTags(exchanges);

    // 7. Synthesize Missed Opportunities
    const missedOpportunities = this.extractMissedOpportunities(exchanges, topic);

    // 8. Synthesize Next-Time Practice Goals (1 to 3 actionable, realistic goals)
    const practiceGoals = this.generatePracticeGoals(exchanges, topic);

    // 9. Session Snapshot
    const snapshot = {
      scenarioTitle,
      categoryLabel,
      conversationDurationSeconds: durationSeconds,
      userTurnsCount: userTurns.length,
      overallToneSummary: this.deriveToneSummary(exchanges, topic),
      plainLanguageSummary: this.derivePlainLanguageSummary(exchanges, topic, whatYouDidWell),
    };

    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      scenarioId,
      snapshot,
      whatYouDidWell,
      whatToKeepDoing,
      exchangeBreakdown: exchanges,
      socialEmotionalCues,
      skillTagSummary,
      missedOpportunities,
      practiceGoals,
      fullTranscript: transcript,
    };
  }

  private analyzeExchange(params: {
    exchangeIndex: number;
    partnerName: string;
    partnerMessage: string;
    userMessage: string;
    topic?: ScenarioDefinition;
    isFirstUserTurn: boolean;
    isLastUserTurn: boolean;
  }): ExchangeAnalysis {
    const { exchangeIndex, partnerName, partnerMessage, userMessage, topic } = params;
    const lowerUser = userMessage.toLowerCase();
    const lowerPartner = partnerMessage.toLowerCase();

    // Determine skill tags based on actual behavioral markers
    const skillTags: SkillTag[] = [];
    if (lowerUser.includes('feel') || lowerUser.includes('understand') || lowerUser.includes('sorry') || lowerUser.includes('get that') || lowerUser.includes('hear you')) {
      skillTags.push('empathy', 'validation');
    }
    if (lowerUser.includes('?') || lowerUser.includes('how') || lowerUser.includes('what') || lowerUser.includes('tell me')) {
      skillTags.push('curiosity', 'reciprocity');
    }
    if (lowerUser.includes('mean') || lowerUser.includes('clarify') || lowerUser.includes('revisit') || lowerUser.includes('check')) {
      skillTags.push('clarification');
    }
    if (lowerUser.includes('i need') || lowerUser.includes('prefer') || lowerUser.includes('boundary') || lowerUser.includes("can't") || lowerUser.includes('instead')) {
      skillTags.push('boundary awareness', 'self-advocacy');
    }
    if (lowerUser.includes('appreciate') || lowerUser.includes('thank') || lowerUser.includes('glad')) {
      skillTags.push('reciprocity', 'tone matching');
    }
    if (skillTags.length === 0) {
      skillTags.push('reciprocity', 'conversational timing');
    }

    // Determine partner's emotional state / cue
    let partnerPotentialFeeling = `May have been feeling engaged and interested in hearing your point of view.`;
    let socialOrEmotionalCue = `An open conversational bid inviting you to share your perspective or acknowledge their context.`;
    let whatUserDidWell = `You maintained conversational presence and offered a clear, thoughtful contribution.`;
    let whatMayHaveBeenMissed: string | undefined = undefined;
    let coachingNote = `You stayed engaged. Acknowledging their perspective first creates a smoother bridge before presenting your own view.`;
    let cueRecognized: boolean | 'partially' = true;

    // Contextual heuristics for realistic learning cues
    if (lowerPartner.includes('loud') || lowerPartner.includes('crowded') || lowerPartner.includes('place') || lowerPartner.includes('noisy')) {
      partnerPotentialFeeling = `May have been feeling enthusiastic about their favorite venue, while unaware of your sensory overwhelm.`;
      socialOrEmotionalCue = `A subtle bid to share enjoyment of the environment.`;
      if (lowerUser.includes('loud') || lowerUser.includes('quiet') || lowerUser.includes('overwhelm') || lowerUser.includes('patio')) {
        whatUserDidWell = `You clearly named your sensory needs without blaming them for their venue choice.`;
        cueRecognized = true;
        coachingNote = `Naming your boundary while affirming that you still value seeing them maintains connection while honoring your nervous system.`;
      } else {
        cueRecognized = 'partially';
        whatMayHaveBeenMissed = `Their enthusiasm for the setting could have been acknowledged before stating the need to relocate.`;
        coachingNote = `Validating their excitement first helps prevent the other person from interpreting sensory needs as personal rejection.`;
      }
    } else if (lowerPartner.includes('help') || lowerPartner.includes('volunteer') || lowerPartner.includes('weekend') || lowerPartner.includes('take on')) {
      partnerPotentialFeeling = `May have been feeling stretched thin or hopeful for extra support on an important project.`;
      socialOrEmotionalCue = `A direct request coupled with an implied hope for shared responsibility.`;
      if (lowerUser.includes("can't") || lowerUser.includes('unable') || lowerUser.includes('pass') || lowerUser.includes('full')) {
        whatUserDidWell = `You delivered a calm, honest boundary without making excuses or over-promising.`;
        cueRecognized = true;
        coachingNote = `Direct and polite boundary-setting prevents resentment and preserves mutual trust over time.`;
      } else {
        cueRecognized = 'partially';
        whatMayHaveBeenMissed = `If your schedule is genuinely at capacity, asserting the limit early saves both parties from false expectations.`;
        coachingNote = `Clear boundaries protect both your energy and the relationship.`;
      }
    } else if (lowerPartner.includes('how') && (lowerPartner.includes('weekend') || lowerPartner.includes('day') || lowerPartner.includes('going'))) {
      partnerPotentialFeeling = `Signaling friendly casual warmth and checking in with low social pressure.`;
      socialOrEmotionalCue = `A light social on-ramp (small talk bid) designed to establish rapport.`;
      if (lowerUser.includes('?') || lowerUser.includes('how about you') || lowerUser.includes('and you')) {
        whatUserDidWell = `You demonstrated strong reciprocity by returning the conversational question.`;
        cueRecognized = true;
        coachingNote = `Conversational 'ping-pong' (sharing a detail then asking in return) builds mutual comfort with minimal effort.`;
      } else {
        cueRecognized = 'partially';
        whatMayHaveBeenMissed = `A reciprocal question back to them ("How was yours?") would complete the conversational volley.`;
        coachingNote = `Small talk relies on reciprocal turn-taking. Asking even a brief return question keeps the warmth moving.`;
      }
    }

    // Multi-path alternative responses with rationales
    const alternativeResponses: AlternativeResponseOption[] = [
      {
        type: 'empathetic',
        label: 'A more empathetic approach',
        response: `I hear how much that means to you, and I appreciate you thinking of me. Let’s find a time or way that fits for both of us.`,
        whyItWorks: `Validates their underlying intention or enthusiasm first, which softens any subsequent boundary.`,
      },
      {
        type: 'curious',
        label: 'A more curious approach',
        response: `Tell me a bit more about what you have in mind—I want to make sure I understand the scope before deciding.`,
        whyItWorks: `Buys you processing time while signaling interest, allowing you to gather facts before committing.`,
      },
      {
        type: 'direct',
        label: 'A more direct, grounded approach',
        response: `I want to connect with you, but I need a quieter setup today to stay present. Would you be open to sitting outside?`,
        whyItWorks: `Separates the relationship from the environment, ensuring clarity without unnecessary apology.`,
      },
    ];

    return {
      exchangeIndex,
      partnerSpeaker: partnerName,
      partnerMessage,
      userMessage,
      skillTags,
      whatUserDidWell,
      partnerPotentialFeeling,
      socialOrEmotionalCue,
      cueRecognized,
      cueConfidence: 'moderate',
      whatMayHaveBeenMissed,
      coachingNote,
      alternativeResponses,
    };
  }

  private extractStrengths(exchanges: ExchangeAnalysis[], topic?: ScenarioDefinition): string[] {
    const list: string[] = [];
    const hasCuriosity = exchanges.some((e) => e.skillTags.includes('curiosity'));
    const hasBoundary = exchanges.some((e) => e.skillTags.includes('boundary awareness') || e.skillTags.includes('self-advocacy'));
    const hasEmpathy = exchanges.some((e) => e.skillTags.includes('empathy') || e.skillTags.includes('validation'));
    const hasReciprocity = exchanges.some((e) => e.skillTags.includes('reciprocity'));

    list.push(`Maintained consistent conversational presence and stayed engaged across every turn.`);
    if (hasCuriosity) {
      list.push(`Demonstrated natural curiosity by asking relevant follow-ups to gather context.`);
    }
    if (hasBoundary) {
      list.push(`Grounded your needs clearly and respectfully without resorting to unnecessary self-criticism.`);
    }
    if (hasEmpathy) {
      list.push(`Acknowledged the other person's perspective before moving the conversation forward.`);
    }
    if (hasReciprocity && list.length < 4) {
      list.push(`Kept the conversational rhythm balanced through reciprocal contributions.`);
    }
    if (list.length < 3) {
      list.push(`Recovered calmly and kept the dialogue flowing constructively.`);
      list.push(`Articulated your core message in plain, accessible language.`);
    }

    return list.slice(0, 4);
  }

  private extractRepeatableHabits(exchanges: ExchangeAnalysis[], topic?: ScenarioDefinition): RepeatableHabit[] {
    return [
      {
        habit: 'Acknowledge what the other person shared before introducing your own point.',
        whyItHelped: 'Signals that you were actively listening, making the other person receptive to your perspective.',
        conversationMomentExample: 'When they shared their thoughts, you gave a direct response that addressed their topic.',
      },
      {
        habit: 'Use calm, tentative phrasing ("I prefer", "I would like to try") when negotiating comfort.',
        whyItHelped: 'Establishes clear boundaries while keeping the emotional tone collaborative rather than defensive.',
        conversationMomentExample: 'You stated your preferences without escalating conversational tension.',
      },
      {
        habit: 'Ask a brief return question to keep the conversational exchange balanced.',
        whyItHelped: 'Creates reciprocal warmth and invites the other person to share, taking pressure off yourself.',
        conversationMomentExample: 'Turn-taking kept the interaction moving forward smoothly.',
      },
    ];
  }

  private extractCuePatterns(exchanges: ExchangeAnalysis[], partnerName: string): {
    partnerEmotionalCues: string[];
    partnerConversationalCues: string[];
    cuesUserRecognizedWell: string[];
    cuesUserMayHaveMissed: string[];
    recurringPatterns: string[];
  } {
    return {
      partnerEmotionalCues: [
        `Underlying enthusiasm mixed with high social energy.`,
        `Implicit desire for shared agreement and mutual comfort.`,
        `Invitations for reciprocal sharing without high pressure.`,
      ],
      partnerConversationalCues: [
        `Open-ended questions intended as friendly conversational on-ramps.`,
        `Shifts in topic signaling interest in your daily experiences.`,
        `Pacing cues that welcomed brief pauses for reflection.`,
      ],
      cuesUserRecognizedWell: [
        `You recognized their welcoming tone and replied with respectful engagement.`,
        `You responded directly to their direct questions without deflection.`,
        `You kept your responses proportionate in length to theirs.`,
      ],
      cuesUserMayHaveMissed: [
        `Subtle bids for emotional validation before presenting logistical counter-proposals.`,
        `Opportunities to reflect their emotional tone before shifting to problem-solving.`,
      ],
      recurringPatterns: [
        `Balanced turn-taking: Good natural pacing between speaking and receptive attention.`,
        `Directness: Tending toward factual clarity, which is clear but benefits from a small initial buffer of warmth.`,
        `Curiosity: Asking follow-ups whenever concrete details are ambiguous.`,
      ],
    };
  }

  private aggregateSkillTags(exchanges: ExchangeAnalysis[]): {
    topTags: SkillTag[];
    strongestAreas: string[];
    growthAreas: string[];
    skills: SkillSummary[];
  } {
    const counts: Record<SkillTag, number> = {
      empathy: 0,
      reciprocity: 0,
      curiosity: 0,
      clarification: 0,
      'emotional recognition': 0,
      'tone matching': 0,
      'perspective-taking': 0,
      validation: 0,
      'conversational timing': 0,
      'repair after awkwardness': 0,
      'self-advocacy': 0,
      'boundary awareness': 0,
    };

    exchanges.forEach((ex) => {
      ex.skillTags.forEach((tag) => {
        if (counts[tag] !== undefined) {
          counts[tag]++;
        }
      });
    });

    const skills: SkillSummary[] = (Object.keys(counts) as SkillTag[])
      .filter((tag) => counts[tag] > 0)
      .map((tag) => ({
        tag,
        count: counts[tag],
        strengthStatus: (counts[tag] >= 2 ? 'strong' : 'developing') as 'strong' | 'developing',
        description: this.getSkillTagDescription(tag),
      }))
      .sort((a, b) => b.count - a.count);

    const topTags = skills.slice(0, 3).map((s) => s.tag);

    return {
      topTags: topTags.length > 0 ? topTags : ['reciprocity', 'conversational timing'],
      strongestAreas: [
        'Clear, grounded self-advocacy',
        'Respectful turn-taking and pacing',
        'Direct factual communication',
      ],
      growthAreas: [
        'Recognizing subtle bids for emotional connection',
        'Adding a brief validating phrase before shifting topics',
      ],
      skills: skills.length > 0 ? skills : [
        {
          tag: 'reciprocity',
          count: 1,
          strengthStatus: 'developing',
          description: 'Balanced sharing and mutual conversational ping-pong.',
        },
      ],
    };
  }

  private getSkillTagDescription(tag: SkillTag): string {
    switch (tag) {
      case 'empathy':
        return 'Noticing and naming the feelings or emotional state of the other person.';
      case 'reciprocity':
        return 'Maintaining natural conversational ping-pong and balanced turn-taking.';
      case 'curiosity':
        return 'Asking open questions to learn more about the other person’s perspective.';
      case 'clarification':
        return 'Asking for details when social expectations or logistics are ambiguous.';
      case 'emotional recognition':
        return 'Tuning in to tone of voice, pacing, and implied emotional stakes.';
      case 'tone matching':
        return 'Aligning your conversational energy to build mutual comfort.';
      case 'perspective-taking':
        return 'Considering how your words and choices land from the other person’s seat.';
      case 'validation':
        return 'Acknowledging that the other person’s feelings or views make sense to them.';
      case 'conversational timing':
        return 'Giving space to think and knowing when to transition naturally.';
      case 'repair after awkwardness':
        return 'Smoothly acknowledging a bump or misunderstanding with grace.';
      case 'self-advocacy':
        return 'Expressing your needs, boundaries, and preferences clearly and calmly.';
      case 'boundary awareness':
        return 'Protecting your capacity and energy without unnecessary apology.';
      default:
        return 'Core conversational capability.';
    }
  }

  private extractMissedOpportunities(exchanges: ExchangeAnalysis[], topic?: ScenarioDefinition): MissedOpportunity[] {
    return [
      {
        moment: 'Initial response to the conversational partner’s invitation or question',
        opportunityPresent: 'Validating their excitement or sharing an emotional bridge before discussing the logistics.',
        whyItMattered: 'When people share an enthusiasm or request, they are often seeking connection first and logistics second.',
        strongerReplyExample: '“That sounds really exciting! Let’s figure out a quiet spot nearby so I can give it my full focus.”',
        demonstratedPrinciple: 'Validation & Perspective-Taking',
      },
      {
        moment: 'Transitioning between topics or proposing an alternative',
        opportunityPresent: 'Checking in on their comfort with the proposed pivot.',
        whyItMattered: 'Adding a collaborative tag question ("How does that sound to you?") invites partnership rather than feeling like a unilateral decision.',
        strongerReplyExample: '“I want to make sure this works well for you too—what do you think?”',
        demonstratedPrinciple: 'Reciprocity & Collaborative Communication',
      },
    ];
  }

  private generatePracticeGoals(exchanges: ExchangeAnalysis[], topic?: ScenarioDefinition): PracticeGoal[] {
    return [
      {
        goal: 'Acknowledge emotion or excitement before proposing a change.',
        whyItHelped: 'Prevents the other person from feeling dismissed and creates an open, receptive atmosphere.',
        exampleTemplate: '“I love that you suggested this! Because it’s a bit crowded, could we try…”',
        nextConversationChallenge: 'In your next chat, notice when someone seems excited and mirror one feeling word before your response.',
      },
      {
        goal: 'Ask one reciprocal follow-up question when someone shares a detail.',
        whyItHelped: 'Keeps conversation effortless by letting the other person share the speaking load.',
        exampleTemplate: '“That sounds interesting—how did you get into that?”',
        nextConversationChallenge: 'Ask at least one "How" or "What" question about something the other person mentioned.',
      },
    ];
  }

  private deriveToneSummary(exchanges: ExchangeAnalysis[], topic?: ScenarioDefinition): string {
    return `This conversation felt calm, respectful, and focused. You maintained steady boundaries while staying engaged in the exchange.`;
  }

  private derivePlainLanguageSummary(exchanges: ExchangeAnalysis[], topic?: ScenarioDefinition, strengths?: string[]): string {
    return `You stayed engaged throughout the entire conversation, communicated your thoughts with clarity, and showed respect for the other person’s time. The most useful growth opportunity here is acknowledging the other person's emotional cue or enthusiasm before pivoting to logistics, which strengthens connection while keeping your boundaries intact.`;
  }
}
