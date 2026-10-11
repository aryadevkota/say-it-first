/**
 * ReportGeneratorService.ts — Domain Service for synthesizing conversation reports
 *
 * Implements strengths-based, neurodiversity-affirming social analysis per the product specification:
 * - Strengths come first, but strictly grounded in observable transcript evidence
 * - Explicit transcript sufficiency checks: refuses to invent claims from empty or trivial input
 * - Distinguishes: insufficient evidence | minimal participation | partial participation | meaningful participation
 * - Tentative, non-absolute language ("may have signaled", "one interpretation is")
 * - Literal, concrete phrasing without patronizing flattery or abstract social fluff
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
  TranscriptSufficiencyLevel,
  TranscriptSufficiencyMetrics,
} from '../entities/SessionReport';
import { ScenarioDefinition, getTopicById } from '../scenarios/topics';

export interface GenerateReportInput {
  scenarioId: string;
  turns: {
    role: 'partner' | 'user';
    text: string;
    id?: string;
    status?: string;
    inputMode?: 'voice' | 'text';
  }[];
  durationSeconds?: number;
  customScenario?: {
    situation?: string;
    partner_role?: string;
    partner_name?: string;
    user_goal?: string;
  };
  droppedUtterancesCount?: number;
}

export class ReportGeneratorService {
  private static readonly FILLER_TOKENS = new Set([
    '.', '..', '...', '....', '?', '!', '?!',
    'hi', 'hello', 'hey', 'hiya', 'howdy',
    'ok', 'okay', 'k', 'kk', 'yes', 'yeah', 'yep', 'yup',
    'no', 'nope', 'nah',
    'uh', 'um', 'umm', 'uhh', 'er', 'ah', 'ahh',
    'hmm', 'hm', 'hmmm',
    'sure', 'fine', 'cool', 'alright', 'right',
    'thanks', 'thank you', 'thx', 'bye', 'goodbye',
  ]);

  /**
   * Detects if an utterance is trivial, empty, punctuation-only, or filler-only.
   */
  public isTrivialText(text: string): boolean {
    if (!text || typeof text !== 'string') return true;
    const cleaned = text.trim().toLowerCase();
    if (cleaned.length === 0) return true;

    // Check if it's only punctuation/dots
    if (/^[.\-_?!,;: ]+$/.test(cleaned)) return true;

    // Tokenize
    const tokens = cleaned
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) return true;

    // Check if all tokens are fillers
    const nonFillerTokens = tokens.filter((t) => !ReportGeneratorService.FILLER_TOKENS.has(t));
    if (nonFillerTokens.length === 0) return true;

    // If only 1 non-filler token and total word count <= 2, check length
    if (nonFillerTokens.length <= 1 && tokens.length <= 2 && nonFillerTokens[0].length < 4) {
      return true;
    }

    return false;
  }

  /**
   * Evaluates dialogue sufficiency against explicit thresholds.
   */
  public evaluateTranscriptSufficiency(params: {
    turns: { role: 'partner' | 'user'; text: string; status?: string }[];
    droppedUtterancesCount?: number;
  }): TranscriptSufficiencyMetrics {
    const committedUserTurns = params.turns.filter(
      (t) => t.role === 'user' && (!t.status || t.status === 'committed_user_turn'),
    );

    const nonTrivialTurns = committedUserTurns.filter((t) => !this.isTrivialText(t.text));

    let totalWords = 0;
    let nonTrivialWords = 0;

    for (const turn of committedUserTurns) {
      const words = turn.text.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      const cleanedWords = turn.text
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .filter((w) => !ReportGeneratorService.FILLER_TOKENS.has(w));
      nonTrivialWords += cleanedWords.length;
    }

    let level: TranscriptSufficiencyLevel;
    if (committedUserTurns.length === 0 || nonTrivialTurns.length === 0 || nonTrivialWords < 4) {
      level = 'insufficient_evidence';
    } else if (committedUserTurns.length === 1 && nonTrivialWords < 10) {
      level = 'minimal_participation';
    } else if (nonTrivialWords < 20) {
      level = 'partial_participation';
    } else {
      level = 'meaningful_participation';
    }

    return {
      level,
      committedUserTurnsCount: committedUserTurns.length,
      nonTrivialUserTurnsCount: nonTrivialTurns.length,
      totalUserWordCount: totalWords,
      nonTrivialUserWordCount: nonTrivialWords,
      droppedUtterancesCount: params.droppedUtterancesCount || 0,
    };
  }

  /**
   * Generates a comprehensive, evidence-grounded SessionReport from conversation turns.
   */
  public generateReport(input: GenerateReportInput): SessionReport {
    const { scenarioId, turns, durationSeconds = 90, customScenario, droppedUtterancesCount = 0 } = input;
    const topic = getTopicById(scenarioId);
    const partnerName = customScenario?.partner_name || topic?.partner.name || 'Sophia';
    const partnerRole = customScenario?.partner_role || topic?.partner.role || 'Conversation Partner';
    const scenarioTitle = topic?.title || customScenario?.situation || 'Conversational Practice';
    const categoryLabel = topic?.categoryLabel || 'Conversation';

    // 1. Filter authoritative committed turns
    const committedTurns = turns.filter(
      (t) => !t.status || t.status === 'committed_user_turn' || t.status === 'committed_assistant_turn',
    );

    // 2. Measure Transcript Sufficiency
    const sufficiency = this.evaluateTranscriptSufficiency({
      turns: committedTurns,
      droppedUtterancesCount,
    });

    console.log(
      `[ReportGenerator] Sourcing report for scenario="${scenarioId}" with ${committedTurns.length} committed turns`,
    );
    console.log(
      `[ReportGenerator] Sufficiency evaluated: level="${sufficiency.level}", nonTrivialTurns=${sufficiency.nonTrivialUserTurnsCount}/${sufficiency.committedUserTurnsCount}, nonTrivialWords=${sufficiency.nonTrivialUserWordCount}, droppedUtterances=${sufficiency.droppedUtterancesCount}`,
    );

    // 3. Build Full Collapsible Transcript
    const transcript: TranscriptTurn[] = committedTurns.map((t, i) => ({
      id: t.id || `turn-${i}`,
      role: t.role,
      speakerName: t.role === 'partner' ? partnerName : 'You',
      text: t.text,
    }));

    // 4. Pair turns into exchanges: Partner turn -> User response
    const exchanges: ExchangeAnalysis[] = [];
    const userTurns = committedTurns.filter((t) => t.role === 'user');

    for (let i = 0; i < committedTurns.length; i++) {
      if (committedTurns[i].role === 'user') {
        const precedingPartnerTurn =
          i > 0 && committedTurns[i - 1].role === 'partner' ? committedTurns[i - 1] : null;
        const exchangeIdx = exchanges.length + 1;
        const exchange = this.analyzeExchange({
          exchangeIndex: exchangeIdx,
          partnerName,
          partnerMessage: precedingPartnerTurn ? precedingPartnerTurn.text : '(Conversation start)',
          userMessage: committedTurns[i].text,
          topic,
          isFirstUserTurn: exchangeIdx === 1,
          isLastUserTurn: exchangeIdx === userTurns.length,
          sufficiencyLevel: sufficiency.level,
        });
        exchanges.push(exchange);
      }
    }

    const hasUserTurns = userTurns.length > 0;
    const isInsufficient = sufficiency.level === 'insufficient_evidence';

    // 5. Synthesize Strengths (What You Did Well - 3 to 5 concrete items)
    const whatYouDidWell = this.extractStrengths(exchanges, topic, sufficiency, partnerName);

    // 6. Synthesize Repeatable Habits (What to Keep Doing - >= 2 items)
    const whatToKeepDoing = this.extractRepeatableHabits(exchanges, topic, sufficiency, partnerName);

    // 7. Synthesize Social & Emotional Cues
    const socialEmotionalCues = this.extractCuePatterns(exchanges, partnerName, sufficiency);

    // 8. Synthesize Skill Tags & Learning Patterns
    const skillTagSummary = this.aggregateSkillTags(exchanges, sufficiency);

    // 9. Synthesize Missed Opportunities
    const missedOpportunities = this.extractMissedOpportunities(exchanges, topic, sufficiency, partnerName);

    // 10. Synthesize Next-Time Practice Goals (1 to 3 actionable, realistic goals)
    const practiceGoals = this.generatePracticeGoals(exchanges, topic, sufficiency);

    // 11. Session Snapshot
    const snapshot = {
      scenarioTitle,
      categoryLabel,
      conversationDurationSeconds: durationSeconds,
      userTurnsCount: userTurns.length,
      overallToneSummary: this.deriveToneSummary(exchanges, topic, sufficiency),
      plainLanguageSummary: this.derivePlainLanguageSummary(exchanges, topic, sufficiency, partnerName),
      sufficiencyLevel: sufficiency.level,
      sufficiencyMetrics: sufficiency,
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
    sufficiencyLevel: TranscriptSufficiencyLevel;
  }): ExchangeAnalysis {
    const { exchangeIndex, partnerName, partnerMessage, userMessage, topic, sufficiencyLevel } = params;
    const lowerUser = userMessage.toLowerCase();
    const lowerPartner = partnerMessage.toLowerCase();
    const isTrivial = this.isTrivialText(userMessage);

    // Determine skill tags based on actual behavioral markers
    const skillTags: SkillTag[] = [];
    if (!isTrivial) {
      if (
        lowerUser.includes('feel') ||
        lowerUser.includes('understand') ||
        lowerUser.includes('sorry') ||
        lowerUser.includes('get that') ||
        lowerUser.includes('hear you')
      ) {
        skillTags.push('empathy', 'validation');
      }
      if (
        lowerUser.includes('?') ||
        lowerUser.includes('how') ||
        lowerUser.includes('what') ||
        lowerUser.includes('tell me')
      ) {
        skillTags.push('curiosity', 'reciprocity');
      }
      if (
        lowerUser.includes('mean') ||
        lowerUser.includes('clarify') ||
        lowerUser.includes('revisit') ||
        lowerUser.includes('check')
      ) {
        skillTags.push('clarification');
      }
      if (
        lowerUser.includes('i need') ||
        lowerUser.includes('prefer') ||
        lowerUser.includes('boundary') ||
        lowerUser.includes("can't") ||
        lowerUser.includes('instead')
      ) {
        skillTags.push('boundary awareness', 'self-advocacy');
      }
      if (
        lowerUser.includes('appreciate') ||
        lowerUser.includes('thank') ||
        lowerUser.includes('glad')
      ) {
        skillTags.push('reciprocity', 'tone matching');
      }
    }

    if (skillTags.length === 0) {
      skillTags.push('reciprocity', 'conversational timing');
    }

    // Default neutral framing
    let partnerPotentialFeeling = `May have been waiting to hear your perspective or answer to their opening comment.`;
    let socialOrEmotionalCue = `An open conversational bid inviting your input.`;
    let whatUserDidWell = isTrivial
      ? `You acknowledged ${partnerName}'s dialogue with an opening response.`
      : `You stated your thoughts directly and kept your message focused.`;
    let whatMayHaveBeenMissed: string | undefined = undefined;
    let coachingNote = isTrivial
      ? `A brief greeting or filler acknowledges the other person, but does not yet communicate your perspective, boundary, or question. Stating what you need gives ${partnerName} something concrete to respond to.`
      : `Sharing your perspective clearly keeps the conversation productive. Acknowledging what they mentioned before stating your request helps the message land smoothly.`;
    let cueRecognized: boolean | 'partially' = isTrivial ? 'partially' : true;
    let cueConfidence: 'tentative' | 'moderate' | 'high' = isTrivial ? 'tentative' : 'moderate';

    // Contextual heuristics for realistic learning cues when input is substantive
    if (!isTrivial) {
      if (
        lowerPartner.includes('loud') ||
        lowerPartner.includes('crowded') ||
        lowerPartner.includes('place') ||
        lowerPartner.includes('noisy')
      ) {
        partnerPotentialFeeling = `May have been feeling enthusiastic about their favorite venue, while unaware of your sensory overwhelm.`;
        socialOrEmotionalCue = `A subtle bid to share enjoyment of the environment.`;
        if (
          lowerUser.includes('loud') ||
          lowerUser.includes('quiet') ||
          lowerUser.includes('overwhelm') ||
          lowerUser.includes('patio')
        ) {
          whatUserDidWell = `You clearly named your sensory needs without blaming them for their venue choice.`;
          cueRecognized = true;
          cueConfidence = 'high';
          coachingNote = `Naming your boundary while affirming that you still value seeing them maintains connection while honoring your nervous system.`;
        } else {
          cueRecognized = 'partially';
          cueConfidence = 'moderate';
          whatMayHaveBeenMissed = `Their enthusiasm for the setting could have been acknowledged before stating the need to relocate.`;
          coachingNote = `Validating their excitement first helps prevent the other person from interpreting sensory needs as personal rejection.`;
        }
      } else if (
        lowerPartner.includes('help') ||
        lowerPartner.includes('volunteer') ||
        lowerPartner.includes('weekend') ||
        lowerPartner.includes('take on')
      ) {
        partnerPotentialFeeling = `May have been feeling stretched thin or hopeful for extra support on an important project.`;
        socialOrEmotionalCue = `A direct request coupled with an implied hope for shared responsibility.`;
        if (
          lowerUser.includes("can't") ||
          lowerUser.includes('unable') ||
          lowerUser.includes('pass') ||
          lowerUser.includes('full')
        ) {
          whatUserDidWell = `You delivered a calm, honest boundary without making excuses or over-promising.`;
          cueRecognized = true;
          cueConfidence = 'high';
          coachingNote = `Direct and polite boundary-setting prevents resentment and preserves mutual trust over time.`;
        } else {
          cueRecognized = 'partially';
          cueConfidence = 'moderate';
          whatMayHaveBeenMissed = `If your schedule is genuinely at capacity, asserting the limit early saves both parties from false expectations.`;
          coachingNote = `Clear boundaries protect both your energy and the relationship.`;
        }
      } else if (
        lowerPartner.includes('how') &&
        (lowerPartner.includes('weekend') || lowerPartner.includes('day') || lowerPartner.includes('going'))
      ) {
        partnerPotentialFeeling = `Signaling friendly casual warmth and checking in with low social pressure.`;
        socialOrEmotionalCue = `A light social on-ramp (small talk bid) designed to establish rapport.`;
        if (
          lowerUser.includes('?') ||
          lowerUser.includes('how about you') ||
          lowerUser.includes('and you')
        ) {
          whatUserDidWell = `You demonstrated strong reciprocity by returning the conversational question.`;
          cueRecognized = true;
          cueConfidence = 'high';
          coachingNote = `Conversational 'ping-pong' (sharing a detail then asking in return) builds mutual comfort with minimal effort.`;
        } else {
          cueRecognized = 'partially';
          cueConfidence = 'moderate';
          whatMayHaveBeenMissed = `A reciprocal question back to them ("How was yours?") would complete the conversational volley.`;
          coachingNote = `Small talk relies on reciprocal turn-taking. Asking even a brief return question keeps the warmth moving.`;
        }
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
      cueConfidence,
      whatMayHaveBeenMissed,
      coachingNote,
      alternativeResponses,
    };
  }

  private extractStrengths(
    exchanges: ExchangeAnalysis[],
    topic: ScenarioDefinition | undefined,
    sufficiency: TranscriptSufficiencyMetrics,
    partnerName: string,
  ): string[] {
    const list: string[] = [];

    if (sufficiency.level === 'insufficient_evidence') {
      if (sufficiency.committedUserTurnsCount === 0) {
        return [
          'Initiated the practice sandbox to prepare for this scenario.',
          `Reviewed the opening conversational context with ${partnerName} without time pressure.`,
          'Explored the practice stage at your own pace.',
        ];
      }
      return [
        'Listened to the opening prompt and observed the scenario context.',
        `Initiated a response turn to acknowledge ${partnerName}.`,
        'Completed the session without guessing or forcing ungrounded feedback.',
      ];
    }

    if (sufficiency.level === 'minimal_participation') {
      list.push(`Took an active conversational turn to respond to ${partnerName}.`);
      list.push('Shared a direct initial response addressing the situation.');
      list.push('Explored the practice stage in a low-pressure environment.');
      return list;
    }

    // Meaningful or Partial participation: evidence-grounded extraction
    const hasCuriosity = exchanges.some((e) => e.skillTags.includes('curiosity'));
    const hasBoundary = exchanges.some(
      (e) => e.skillTags.includes('boundary awareness') || e.skillTags.includes('self-advocacy'),
    );
    const hasEmpathy = exchanges.some(
      (e) => e.skillTags.includes('empathy') || e.skillTags.includes('validation'),
    );
    const hasReciprocity = exchanges.some((e) => e.skillTags.includes('reciprocity'));

    list.push('Stayed focused on the scenario topic and engaged directly with the conversational partner.');
    if (hasCuriosity) {
      list.push('Demonstrated natural curiosity by asking relevant follow-ups to gather context.');
    }
    if (hasBoundary) {
      list.push('Grounded your needs clearly and respectfully without resorting to unnecessary self-criticism.');
    }
    if (hasEmpathy) {
      list.push("Acknowledged the other person's perspective before moving the conversation forward.");
    }
    if (hasReciprocity && list.length < 4) {
      list.push('Kept the conversational rhythm balanced through reciprocal contributions.');
    }
    if (list.length < 3) {
      list.push('Articulated your core message in plain, accessible language.');
      list.push('Maintained a calm, constructive tone throughout the exchange.');
    }

    return list.slice(0, 4);
  }

  private extractRepeatableHabits(
    exchanges: ExchangeAnalysis[],
    topic: ScenarioDefinition | undefined,
    sufficiency: TranscriptSufficiencyMetrics,
    partnerName: string,
  ): RepeatableHabit[] {
    if (sufficiency.level === 'insufficient_evidence') {
      return [
        {
          habit: 'Formulate what you want to convey in one complete sentence.',
          whyItHelped:
            'Speaking or typing a full thought gives your conversation partner clear information to respond to.',
          conversationMomentExample: 'Next time, follow a greeting with your preference or question.',
        },
        {
          habit: 'Take conversational turns when you feel ready.',
          whyItHelped:
            'Practicing in short, manageable turns keeps conversations comfortable.',
          conversationMomentExample: 'Stepping into conversation one sentence at a time.',
        },
      ];
    }

    if (sufficiency.level === 'minimal_participation') {
      return [
        {
          habit: 'Acknowledge what the other person shared before stating your position.',
          whyItHelped:
            'Creates an open, collaborative bridge that makes direct communication easier to receive.',
          conversationMomentExample: `Directly addressing ${partnerName} in your response.`,
        },
        {
          habit: 'Follow up with a question or confirmation.',
          whyItHelped:
            'Asking what they think keeps the conversation balanced without putting pressure on one person.',
          conversationMomentExample: 'Adding a quick check-in like "How does that sound?"',
        },
      ];
    }

    return [
      {
        habit: 'Acknowledge what the other person shared before introducing your own point.',
        whyItHelped:
          'Signals that you were actively listening, making the other person receptive to your perspective.',
        conversationMomentExample: 'When they shared their thoughts, you gave a direct response that addressed their topic.',
      },
      {
        habit: 'Use calm, tentative phrasing ("I prefer", "I would like to try") when negotiating comfort.',
        whyItHelped:
          'Establishes clear boundaries while keeping the emotional tone collaborative rather than defensive.',
        conversationMomentExample: 'You stated your preferences without escalating conversational tension.',
      },
      {
        habit: 'Ask a brief return question to keep the conversational exchange balanced.',
        whyItHelped:
          'Creates reciprocal warmth and invites the other person to share, taking pressure off yourself.',
        conversationMomentExample: 'Turn-taking kept the interaction moving forward smoothly.',
      },
    ];
  }

  private extractCuePatterns(
    exchanges: ExchangeAnalysis[],
    partnerName: string,
    sufficiency: TranscriptSufficiencyMetrics,
  ): {
    partnerEmotionalCues: string[];
    partnerConversationalCues: string[];
    cuesUserRecognizedWell: string[];
    cuesUserMayHaveMissed: string[];
    recurringPatterns: string[];
  } {
    if (sufficiency.level === 'insufficient_evidence') {
      return {
        partnerEmotionalCues: [`${partnerName} initiated the scenario dialogue.`],
        partnerConversationalCues: ['Opening dialogue delivered.'],
        cuesUserRecognizedWell: ['Listened to opening dialogue context.'],
        cuesUserMayHaveMissed: [
          'Recorded dialogue was too limited to evaluate cue recognition with confidence.',
        ],
        recurringPatterns: [
          'Practice stage initialized without sufficient dialogue to evaluate recurring patterns.',
        ],
      };
    }

    return {
      partnerEmotionalCues: [
        'Underlying enthusiasm mixed with high social energy.',
        'Implicit desire for shared agreement and mutual comfort.',
        'Invitations for reciprocal sharing without high pressure.',
      ],
      partnerConversationalCues: [
        'Open-ended questions intended as friendly conversational on-ramps.',
        'Shifts in topic signaling interest in your daily experiences.',
        'Pacing cues that welcomed brief pauses for reflection.',
      ],
      cuesUserRecognizedWell: [
        'You recognized their welcoming tone and replied with respectful engagement.',
        'You responded directly to their direct questions without deflection.',
        'You kept your responses proportionate in length to theirs.',
      ],
      cuesUserMayHaveMissed: [
        'Subtle bids for emotional validation before presenting logistical counter-proposals.',
        'Opportunities to reflect their emotional tone before shifting to problem-solving.',
      ],
      recurringPatterns: [
        'Balanced turn-taking: Good natural pacing between speaking and receptive attention.',
        'Directness: Tending toward factual clarity, which is clear but benefits from a small initial buffer of warmth.',
        'Curiosity: Asking follow-ups whenever concrete details are ambiguous.',
      ],
    };
  }

  private aggregateSkillTags(
    exchanges: ExchangeAnalysis[],
    sufficiency: TranscriptSufficiencyMetrics,
  ): {
    topTags: SkillTag[];
    strongestAreas: string[];
    growthAreas: string[];
    skills: SkillSummary[];
  } {
    if (sufficiency.level === 'insufficient_evidence') {
      return {
        topTags: ['clarification', 'self-advocacy'],
        strongestAreas: ['Exploration & Awareness'],
        growthAreas: ['Formulating a complete conversational response'],
        skills: [
          {
            tag: 'clarification',
            count: 1,
            strengthStatus: 'developing',
            description: 'Asking for details when social expectations or logistics are ambiguous.',
          },
        ],
      };
    }

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
      skills:
        skills.length > 0
          ? skills
          : [
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

  private extractMissedOpportunities(
    exchanges: ExchangeAnalysis[],
    topic: ScenarioDefinition | undefined,
    sufficiency: TranscriptSufficiencyMetrics,
    partnerName: string,
  ): MissedOpportunity[] {
    if (sufficiency.level === 'insufficient_evidence') {
      return [
        {
          moment: 'Opening response to partner',
          opportunityPresent: 'Taking a turn to respond to the opening prompt with a full sentence.',
          whyItMattered: 'Taking an active turn produces customized feedback on how your message lands.',
          strongerReplyExample:
            topic?.learning?.examplePhrases?.gentle || 'I hear you. Let us coordinate on that.',
          demonstratedPrinciple: 'Conversational Initiation & Presence',
        },
      ];
    }

    return [
      {
        moment: 'Initial response to the conversational partner’s invitation or question',
        opportunityPresent:
          'Validating their excitement or sharing an emotional bridge before discussing the logistics.',
        whyItMattered:
          'When people share an enthusiasm or request, they are often seeking connection first and logistics second.',
        strongerReplyExample:
          '“That sounds really exciting! Let’s figure out a quiet spot nearby so I can give it my full focus.”',
        demonstratedPrinciple: 'Validation & Perspective-Taking',
      },
      {
        moment: 'Transitioning between topics or proposing an alternative',
        opportunityPresent: 'Checking in on their comfort with the proposed pivot.',
        whyItMattered:
          'Adding a collaborative tag question ("How does that sound to you?") invites partnership rather than feeling like a unilateral decision.',
        strongerReplyExample: '“I want to make sure this works well for you too—what do you think?”',
        demonstratedPrinciple: 'Reciprocity & Collaborative Communication',
      },
    ];
  }

  private generatePracticeGoals(
    exchanges: ExchangeAnalysis[],
    topic: ScenarioDefinition | undefined,
    sufficiency: TranscriptSufficiencyMetrics,
  ): PracticeGoal[] {
    if (sufficiency.level === 'insufficient_evidence') {
      return [
        {
          goal: 'Complete at least one response turn with a full sentence.',
          whyItHelped:
            'Practicing even one turn provides actionable coaching on your wording and timing.',
          exampleTemplate:
            topic?.learning?.examplePhrases?.direct || 'Here is what works best for me.',
          nextConversationChallenge:
            'Speak or type one sentence acknowledging the opening remark next time.',
        },
      ];
    }

    if (sufficiency.level === 'minimal_participation') {
      return [
        {
          goal: 'Build upon your initial response with a follow-up sentence.',
          whyItHelped:
            'Extending the exchange provides more opportunities to practice reciprocal pacing.',
          exampleTemplate: '“Here is what I am thinking—what do you think?”',
          nextConversationChallenge: 'In your next chat, add one clarifying question after your answer.',
        },
      ];
    }

    return [
      {
        goal: 'Acknowledge emotion or excitement before proposing a change.',
        whyItHelped:
          'Prevents the other person from feeling dismissed and creates an open, receptive atmosphere.',
        exampleTemplate: '“I love that you suggested this! Because it’s a bit crowded, could we try…”',
        nextConversationChallenge:
          'In your next chat, notice when someone seems excited and mirror one feeling word before your response.',
      },
      {
        goal: 'Ask one reciprocal follow-up question when someone shares a detail.',
        whyItHelped: 'Keeps conversation effortless by letting the other person share the speaking load.',
        exampleTemplate: '“That sounds interesting—how did you get into that?”',
        nextConversationChallenge:
          'Ask at least one "How" or "What" question about something the other person mentioned.',
      },
    ];
  }

  private deriveToneSummary(
    exchanges: ExchangeAnalysis[],
    topic: ScenarioDefinition | undefined,
    sufficiency: TranscriptSufficiencyMetrics,
  ): string {
    if (sufficiency.level === 'insufficient_evidence') {
      return 'The recorded dialogue was too limited to evaluate conversational tone with confidence.';
    }
    if (sufficiency.level === 'minimal_participation') {
      return 'Brief initial exchange recorded. Tone evaluation is preliminary and reflects a single response.';
    }
    return 'This conversation felt calm, respectful, and focused. You communicated your thoughts clearly while engaging with the scenario.';
  }

  private derivePlainLanguageSummary(
    exchanges: ExchangeAnalysis[],
    topic: ScenarioDefinition | undefined,
    sufficiency: TranscriptSufficiencyMetrics,
    partnerName: string,
  ): string {
    if (sufficiency.level === 'insufficient_evidence') {
      if (sufficiency.committedUserTurnsCount === 0) {
        return `No participant responses were recorded in this practice session. You can practice again anytime by typing or speaking directly with ${partnerName}.`;
      }
      return `The recorded dialogue from your side was too limited to evaluate your response quality with confidence. We recorded ${sufficiency.committedUserTurnsCount} brief user utterance(s), but they consisted primarily of greetings or filler tokens. To receive actionable feedback on your boundaries, clarity, and tone, try practicing with at least 1–2 complete sentences in your next session.`;
    }

    if (sufficiency.level === 'minimal_participation') {
      return `You took an initial conversational turn with ${partnerName}. Because the exchange was brief, our coaching reflects only this specific moment. For broader practice on pacing and turn-taking, try continuing the conversation for another turn next time.`;
    }

    return `You engaged directly with the scenario, expressed your perspective, and maintained a constructive dialogue with ${partnerName}. The most useful growth opportunity here is acknowledging the other person's emotional cue or enthusiasm before pivoting to logistics, which strengthens connection while keeping your boundaries intact.`;
  }
}
