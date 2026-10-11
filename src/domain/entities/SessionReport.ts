/**
 * SessionReport.ts — Domain Model & Types for Post-Conversation Guided Coaching Report
 *
 * Implements the domain contracts for:
 * 1. Session Snapshot
 * 2. What You Did Well (Strengths-first)
 * 3. What to Keep Doing (Repeatable communication habits)
 * 4. Exchange-by-Exchange Coaching (With multi-path alternatives & rationales)
 * 5. Social and Emotional Cues (Broader patterns & neurodiversity-aware observations)
 * 6. Skill Tags & Learning Patterns (Turn-level & aggregated)
 * 7. Missed Opportunities (Supportive, growth-oriented reflection)
 * 8. Practice Goals for Next Time (1-3 concrete, realistic goals)
 * 9. Collapsible Full Transcript
 */

export type SkillTag =
  | 'empathy'
  | 'reciprocity'
  | 'curiosity'
  | 'clarification'
  | 'emotional recognition'
  | 'tone matching'
  | 'perspective-taking'
  | 'validation'
  | 'conversational timing'
  | 'repair after awkwardness'
  | 'self-advocacy'
  | 'boundary awareness';

export type InterpretationConfidence = 'tentative' | 'moderate' | 'high';

export interface AlternativeResponseOption {
  type: 'empathetic' | 'curious' | 'direct';
  label: string;
  response: string;
  whyItWorks: string;
}

export interface ExchangeAnalysis {
  exchangeIndex: number;
  partnerSpeaker: string;
  partnerMessage: string;
  userMessage: string;
  skillTags: SkillTag[];
  whatUserDidWell: string;
  partnerPotentialFeeling: string;
  socialOrEmotionalCue: string;
  cueRecognized: boolean | 'partially';
  cueConfidence: InterpretationConfidence;
  whatMayHaveBeenMissed?: string;
  coachingNote: string;
  alternativeResponses: AlternativeResponseOption[];
}

export interface SessionSnapshot {
  scenarioTitle: string;
  categoryLabel: string;
  conversationDurationSeconds: number;
  userTurnsCount: number;
  overallToneSummary: string;
  plainLanguageSummary: string;
}

export interface RepeatableHabit {
  habit: string;
  whyItHelped: string;
  conversationMomentExample?: string;
}

export interface CuePatternSummary {
  partnerEmotionalCues: string[];
  partnerConversationalCues: string[];
  cuesUserRecognizedWell: string[];
  cuesUserMayHaveMissed: string[];
  recurringPatterns: string[];
}

export interface SkillSummary {
  tag: SkillTag;
  count: number;
  strengthStatus: 'strong' | 'developing' | 'practice_opportunity';
  description: string;
}

export interface MissedOpportunity {
  moment: string;
  opportunityPresent: string;
  whyItMattered: string;
  strongerReplyExample: string;
  demonstratedPrinciple: string;
}

export interface PracticeGoal {
  goal: string;
  whyItHelped: string;
  exampleTemplate: string;
  nextConversationChallenge: string;
}

export interface TranscriptTurn {
  id: string;
  role: 'partner' | 'user';
  speakerName: string;
  text: string;
  timestamp?: string;
}

export interface SessionReport {
  id: string;
  createdAt: string;
  scenarioId: string;
  snapshot: SessionSnapshot;
  whatYouDidWell: string[];
  whatToKeepDoing: RepeatableHabit[];
  exchangeBreakdown: ExchangeAnalysis[];
  socialEmotionalCues: CuePatternSummary;
  skillTagSummary: {
    topTags: SkillTag[];
    strongestAreas: string[];
    growthAreas: string[];
    skills: SkillSummary[];
  };
  missedOpportunities: MissedOpportunity[];
  practiceGoals: PracticeGoal[];
  fullTranscript: TranscriptTurn[];
}

export type ReportStageId =
  | 'building-transcript'
  | 'analyzing-cues'
  | 'identifying-strengths'
  | 'reviewing-opportunities'
  | 'writing-coaching'
  | 'preparing-practice-goals';

export interface ReportGenerationProgressStage {
  id: ReportStageId;
  label: string;
  description: string;
  progressPercent: number; // 0 to 100
}

export const REPORT_GENERATION_STAGES: ReportGenerationProgressStage[] = [
  {
    id: 'building-transcript',
    label: 'Building dialogue transcript',
    description: 'Organizing conversation turns and speech timing…',
    progressPercent: 15,
  },
  {
    id: 'analyzing-cues',
    label: 'Analyzing social & emotional cues',
    description: 'Exploring conversational tone, subtext, and potential intentions…',
    progressPercent: 35,
  },
  {
    id: 'identifying-strengths',
    label: 'Identifying what you did well',
    description: 'Highlighting communication strengths and positive connection moments…',
    progressPercent: 55,
  },
  {
    id: 'reviewing-opportunities',
    label: 'Reviewing missed opportunities',
    description: 'Reflecting on subtle invitations and alternative paths with care…',
    progressPercent: 75,
  },
  {
    id: 'writing-coaching',
    label: 'Writing coaching suggestions',
    description: 'Composing concrete, supportive exchange-by-exchange reflections…',
    progressPercent: 90,
  },
  {
    id: 'preparing-practice-goals',
    label: 'Preparing next-step practice goals',
    description: 'Crafting personalized, bite-sized goals for your next conversation…',
    progressPercent: 100,
  },
];
