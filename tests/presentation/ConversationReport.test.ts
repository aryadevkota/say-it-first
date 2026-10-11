import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { ReportGenerationView } from '../../src/presentation/components/ReportGenerationView';
import { ConversationReportPage } from '../../src/presentation/components/ConversationReportPage';
import { ReportGeneratorService } from '../../src/domain/services/ReportGeneratorService';

describe('Report UI Components Suite', () => {
  const service = new ReportGeneratorService();
  const mockReport = service.generateReport({
    scenarioId: 'friendship-quiet-place',
    turns: [
      { role: 'partner', text: 'Hey, this place is so energetic!' },
      { role: 'user', text: 'It is a bit loud. Could we sit by the patio?' },
    ],
    durationSeconds: 95,
  });

  describe('ReportGenerationView', () => {
    it('renders the animated progress bar and meaningful stage indicators', () => {
      const html = renderToString(
        React.createElement(ReportGenerationView, {
          scenarioTitle: 'Finding a Quiet Place with a Friend',
          onGenerationComplete: vi.fn(),
        }),
      );

      expect(html).toContain('data-testid="report-generation-screen"');
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('Building dialogue transcript');
      expect(html).toContain('Finding a Quiet Place with a Friend');
      expect(html).toContain('Synthesizing Your Session');
    });
  });

  describe('ConversationReportPage', () => {
    it('renders all 9 sections of the structured coaching report', () => {
      const html = renderToString(
        React.createElement(ConversationReportPage, {
          report: mockReport,
          onRestartPractice: vi.fn(),
          onReturnDashboard: vi.fn(),
        }),
      );

      // Section 1: Session Snapshot
      expect(html).toContain('data-testid="section-session-snapshot"');
      expect(html).toContain('1. Session Snapshot');

      // Section 2: What You Did Well
      expect(html).toContain('data-testid="section-what-you-did-well"');
      expect(html).toContain('2. What You Did Well');

      // Section 3: What to Keep Doing
      expect(html).toContain('data-testid="section-what-to-keep-doing"');
      expect(html).toContain('3. What to Keep Doing');

      // Section 4: Exchange-by-Exchange Coaching
      expect(html).toContain('data-testid="section-exchange-by-exchange"');
      expect(html).toContain('4. Exchange-by-Exchange Coaching');
      expect(html).toContain('data-testid="exchange-card-1"');

      // Section 5: Social and Emotional Cues
      expect(html).toContain('data-testid="section-social-emotional-cues"');
      expect(html).toContain('5. Social and Emotional Cues');

      // Section 6: Skill Tags
      expect(html).toContain('data-testid="section-skill-tags"');
      expect(html).toContain('6. Skill Tags &amp; Learning Patterns');

      // Section 7: Missed Opportunities
      expect(html).toContain('data-testid="section-missed-opportunities"');
      expect(html).toContain('7. Missed Opportunities for Connection');

      // Section 8: Practice Goals
      expect(html).toContain('data-testid="section-practice-goals"');
      expect(html).toContain('8. Practice Goals for Next Time');

      // Section 9: Full Transcript
      expect(html).toContain('data-testid="section-full-transcript"');
      expect(html).toContain('9. Original Dialogue');
    });

    it('renders alternative response paths with clear explanations', () => {
      const html = renderToString(
        React.createElement(ConversationReportPage, {
          report: mockReport,
          onRestartPractice: vi.fn(),
          onReturnDashboard: vi.fn(),
        }),
      );

      expect(html).toContain('Stronger Alternative Paths:');
      expect(html).toContain('Why this works:');
      expect(html).toContain('A more empathetic approach');
    });

    it('renders the insufficient evidence banner when user participation is minimal or filler-only', () => {
      const emptyReport = service.generateReport({
        scenarioId: 'friendship-quiet-place',
        turns: [
          { role: 'partner', text: 'Hey, this place is so energetic!' },
          { role: 'user', text: '...' },
        ],
        durationSeconds: 30,
      });

      const html = renderToString(
        React.createElement(ConversationReportPage, {
          report: emptyReport,
          onRestartPractice: vi.fn(),
          onReturnDashboard: vi.fn(),
        }),
      );

      expect(html).toContain('data-testid="insufficient-evidence-banner"');
      expect(html).toContain('Limited Recorded Dialogue');
    });
  });
});
