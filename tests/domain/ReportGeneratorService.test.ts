import { describe, it, expect } from 'vitest';
import { ReportGeneratorService } from '../../src/domain/services/ReportGeneratorService';
import { REPORT_GENERATION_STAGES } from '../../src/domain/entities/SessionReport';

describe('ReportGeneratorService & SessionReport Domain Suite', () => {
  const service = new ReportGeneratorService();

  const mockTurns = [
    {
      role: 'partner' as const,
      text: 'Hey! The lounge downstairs is pretty buzzing tonight, let’s grab a table by the stage!',
    },
    {
      role: 'user' as const,
      text: 'It is a bit loud in there for me. Could we find a quieter corner or sit outside on the patio instead?',
    },
    {
      role: 'partner' as const,
      text: 'Oh sure, the patio sounds nice! How has your week been going?',
    },
    {
      role: 'user' as const,
      text: 'It has been full but good. How about yours? Did you finish that project?',
    },
  ];

  it('defines 6 meaningful report-generation progress stages', () => {
    expect(REPORT_GENERATION_STAGES).toHaveLength(6);
    expect(REPORT_GENERATION_STAGES[0].id).toBe('building-transcript');
    expect(REPORT_GENERATION_STAGES[5].id).toBe('preparing-practice-goals');
    expect(REPORT_GENERATION_STAGES[5].progressPercent).toBe(100);
  });

  it('generates a complete, structured report matching the 9 required sections', () => {
    const report = service.generateReport({
      scenarioId: 'friendship-quiet-place',
      turns: mockTurns,
      durationSeconds: 120,
    });

    // 1. Session Snapshot
    expect(report.snapshot).toBeDefined();
    expect(report.snapshot.userTurnsCount).toBe(2);
    expect(report.snapshot.conversationDurationSeconds).toBe(120);
    expect(report.snapshot.overallToneSummary).toContain('calm');
    expect(report.snapshot.plainLanguageSummary.length).toBeGreaterThan(20);

    // 2. What You Did Well (Strengths-first, 3-5 items)
    expect(report.whatYouDidWell.length).toBeGreaterThanOrEqual(3);
    expect(report.whatYouDidWell.length).toBeLessThanOrEqual(5);

    // 3. What to Keep Doing (Repeatable communication habits)
    expect(report.whatToKeepDoing.length).toBeGreaterThanOrEqual(2);
    report.whatToKeepDoing.forEach((habit) => {
      expect(habit.habit).toBeDefined();
      expect(habit.whyItHelped).toBeDefined();
    });

    // 4. Exchange-by-Exchange Coaching
    expect(report.exchangeBreakdown).toHaveLength(2);
    const exchange1 = report.exchangeBreakdown[0];
    expect(exchange1.partnerSpeaker).toBeDefined();
    expect(exchange1.userMessage).toContain('loud');
    expect(exchange1.socialOrEmotionalCue).toBeDefined();
    expect(exchange1.partnerPotentialFeeling).toContain('May have been');
    expect(exchange1.whatUserDidWell).toBeDefined();
    expect(exchange1.coachingNote).toBeDefined();
    expect(exchange1.alternativeResponses.length).toBeGreaterThanOrEqual(2);

    // Multi-path alternative check: empathetic, curious, direct
    const types = exchange1.alternativeResponses.map((a) => a.type);
    expect(types).toContain('empathetic');
    expect(types).toContain('direct');

    // 5. Social and Emotional Cues (Broader patterns)
    expect(report.socialEmotionalCues.partnerEmotionalCues.length).toBeGreaterThan(0);
    expect(report.socialEmotionalCues.cuesUserRecognizedWell.length).toBeGreaterThan(0);
    expect(report.socialEmotionalCues.recurringPatterns.length).toBeGreaterThan(0);

    // 6. Skill Tags & Learning Patterns
    expect(report.skillTagSummary.topTags.length).toBeGreaterThan(0);
    expect(report.skillTagSummary.strongestAreas.length).toBeGreaterThan(0);
    expect(report.skillTagSummary.skills.length).toBeGreaterThan(0);

    // 7. Missed Opportunities
    expect(report.missedOpportunities.length).toBeGreaterThan(0);
    report.missedOpportunities.forEach((opp) => {
      expect(opp.opportunityPresent).toBeDefined();
      expect(opp.whyItMattered).toBeDefined();
      expect(opp.strongerReplyExample).toBeDefined();
      expect(opp.demonstratedPrinciple).toBeDefined();
    });

    // 8. Practice Goals for Next Time (1-3 goals)
    expect(report.practiceGoals.length).toBeGreaterThanOrEqual(1);
    expect(report.practiceGoals.length).toBeLessThanOrEqual(3);
    report.practiceGoals.forEach((goal) => {
      expect(goal.goal).toBeDefined();
      expect(goal.whyItHelped).toBeDefined();
      expect(goal.exampleTemplate).toBeDefined();
      expect(goal.nextConversationChallenge).toBeDefined();
    });

    // 9. Full Collapsible Transcript
    expect(report.fullTranscript).toHaveLength(4);
    expect(report.fullTranscript[0].role).toBe('partner');
    expect(report.fullTranscript[1].role).toBe('user');
  });

  it('uses tentative, neurodiversity-affirming language and avoids harsh grading', () => {
    const report = service.generateReport({
      scenarioId: 'friendship-quiet-place',
      turns: mockTurns,
    });

    const reportJson = JSON.stringify(report).toLowerCase();
    expect(reportJson).not.toContain('wrong response');
    expect(reportJson).not.toContain('failed to');
    expect(reportJson).not.toContain('score:');
    expect(reportJson).not.toContain('pass/fail');
  });
});
