/**
 * SophiaScenarioPresentation.test.ts — Unit tests for Sophia Scenario-Aware Wardrobe & Background Presentation
 */

import { describe, it, expect } from 'vitest';
import {
  getSophiaPresentationForScenario,
  inferPresentationArchetype,
  EVA_CORE_IDENTITY,
  EVA_PRESENTATION_CONFIGS,
  type SophiaScenarioPresentation,
} from '../../src/domain/entities/SophiaScenarioPresentation';
import { TOPICS, type ScenarioDefinition } from '../../src/domain/scenarios/topics';
import { ScenarioGenerator } from '../../src/domain/scenarios/ScenarioGenerator';

describe('SophiaScenarioPresentation Entity & Mapping Service', () => {
  it('maintains a consistent core identity across all configurations', () => {
    expect(EVA_CORE_IDENTITY.avatarName).toBe('Sophia');
    expect(EVA_CORE_IDENTITY.hairColorAndStyle).toContain('auburn-brown');
    expect(EVA_CORE_IDENTITY.eyeColor).toContain('hazel-brown');
    expect(EVA_CORE_IDENTITY.ageBracket).toBe('Early 30s');
  });

  describe('Interview / Professional Scenarios', () => {
    it('maps professional and interview scenarios to business attire and office background', () => {
      const interviewScenario: ScenarioDefinition = {
        id: 'test-interview',
        category: 'work-school',
        categoryLabel: 'Work or school',
        title: 'Behavioral Job Interview Practice',
        subtitle: 'Practicing answering leadership questions under pressure',
        userGoal: 'Present my leadership experience clearly and confidently',
        estimatedMinutes: 5,
        status: 'ready',
        accentColor: 'apricot',
        learning: {
          coreInsight: 'Interviews benefit from structured STAR-based responses.',
          doubleEmpathyPerspective: { yourNeed: 'Clarity', theirPerspective: 'Competence' },
          practicalApproaches: ['Be direct'],
          examplePhrases: { gentle: 'I led...', direct: 'My role was...' },
        },
        partner: {
          name: 'Sophia',
          role: 'Hiring Manager',
          avatarVariant: 'eva',
          defaultTone: 'Formal, focused',
          initialDialogue: 'Tell me about a time you handled conflict.',
        },
        defaultTakeawayScript: 'I handled the conflict by aligning on shared goals.',
      };

      const presentation = getSophiaPresentationForScenario(interviewScenario);

      expect(presentation.outfit).toBe('business-attire');
      expect(presentation.background).toBe('office');
      expect(presentation.outfitLabel).toBe('Professional Business Attire');
      expect(presentation.backgroundLabel).toBe('Office Background');
      expect(presentation.visualSummary).toBe(
        'Sophia • Professional Business Attire • Office Background',
      );
      expect(presentation.detailedVisualDescription).toContain('business blazer');
      expect(presentation.consistency.avatarName).toBe('Sophia');
    });
  });

  describe('Coffee Chat / Social Scenarios', () => {
    it('maps coffee chat scenarios to turtleneck and coffee shop background', () => {
      const coffeeScenario: ScenarioDefinition = {
        id: 'test-coffee-chat',
        category: 'friendships',
        categoryLabel: 'Friendships',
        title: 'Casual Coffee Chat with a Colleague',
        subtitle: 'Reconnecting over coffee after a long project milestone',
        userGoal: 'Enjoy an informal catch-up without work anxiety',
        estimatedMinutes: 4,
        status: 'ready',
        accentColor: 'lavender',
        learning: {
          coreInsight: 'Coffee chats foster connection through relaxed presence.',
          doubleEmpathyPerspective: { yourNeed: 'Relaxation', theirPerspective: 'Connection' },
          practicalApproaches: ['Listen actively'],
          examplePhrases: { gentle: 'How have you been?', direct: 'Great to catch up.' },
        },
        partner: {
          name: 'Sophia',
          role: 'Close Friend',
          avatarVariant: 'eva',
          defaultTone: 'Warm and friendly',
          initialDialogue: 'It is so great to grab coffee together!',
        },
        defaultTakeawayScript: 'It was wonderful to catch up today.',
      };

      const presentation = getSophiaPresentationForScenario(coffeeScenario);

      expect(presentation.outfit).toBe('turtleneck');
      expect(presentation.background).toBe('coffee-shop');
      expect(presentation.outfitLabel).toBe('Turtleneck');
      expect(presentation.backgroundLabel).toBe('Coffee Shop');
      expect(presentation.visualSummary).toBe('Sophia • Turtleneck • Coffee Shop');
      expect(presentation.detailedVisualDescription).toContain('turtleneck');
    });
  });

  describe('Boundaries / Difficult Conversations Scenarios', () => {
    it('maps boundaries scenarios to smart-casual blazer and quiet study/library background', () => {
      const boundaryTopic = TOPICS.find((t) => t.id === 'boundary-saying-no')!;
      expect(boundaryTopic).toBeDefined();

      const presentation = getSophiaPresentationForScenario(boundaryTopic);

      expect(presentation.outfit).toBe('smart-casual');
      expect(presentation.background).toBe('quiet-study');
      expect(presentation.outfitLabel).toBe('Smart-Casual Blazer');
      expect(presentation.backgroundLabel).toBe('Calm Library/Study');
      expect(presentation.visualSummary).toBe('Sophia • Smart-Casual Blazer • Calm Library/Study');
      expect(presentation.detailedVisualDescription).toContain('smart-casual blazer');
    });
  });

  describe('Healthcare / Appointments Scenarios', () => {
    it('maps healthcare appointment scenarios to clinical professional attire and consultation room', () => {
      const appointmentTopic = TOPICS.find((t) => t.id === 'appointments-clarification')!;
      expect(appointmentTopic).toBeDefined();

      const presentation = getSophiaPresentationForScenario(appointmentTopic);

      expect(presentation.outfit).toBe('clinical-professional');
      expect(presentation.background).toBe('consultation-room');
      expect(presentation.outfitLabel).toBe('Clinical & Professional Attire');
      expect(presentation.backgroundLabel).toBe('Consultation Room');
      expect(presentation.visualSummary).toBe(
        'Sophia • Clinical & Professional Attire • Consultation Room',
      );
      expect(presentation.detailedVisualDescription).toContain('clinical-professional');
    });
  });

  describe('Everyday / Casual Scenarios', () => {
    it('maps everyday small talk scenarios to comfortable warm knitwear and airy lounge', () => {
      const everydayTopic = TOPICS.find((t) => t.id === 'everyday-smalltalk')!;
      expect(everydayTopic).toBeDefined();

      const presentation = getSophiaPresentationForScenario(everydayTopic);

      expect(presentation.outfit).toBe('casual-knitwear');
      expect(presentation.background).toBe('warm-lounge');
      expect(presentation.outfitLabel).toBe('Comfortable Warm Knitwear');
      expect(presentation.backgroundLabel).toBe('Airy Lounge');
      expect(presentation.visualSummary).toBe('Sophia • Comfortable Warm Knitwear • Airy Lounge');
    });
  });

  describe('All Standard TOPICS Catalog Mapping', () => {
    it('maps every standard topic in TOPICS cleanly to an appropriate Sophia presentation', () => {
      for (const topic of TOPICS) {
        const presentation = getSophiaPresentationForScenario(topic);

        expect(presentation.scenarioId).toBe(topic.id);
        expect(presentation.outfit).toBeDefined();
        expect(presentation.background).toBeDefined();
        expect(presentation.outfitLabel.length).toBeGreaterThan(0);
        expect(presentation.backgroundLabel.length).toBeGreaterThan(0);
        expect(presentation.visualSummary).toContain('Sophia');
        expect(presentation.detailedVisualDescription).toContain('Sophia');
        expect(presentation.consistency.avatarName).toBe('Sophia');

        // Verify specific standard topics
        if (topic.id === 'work-written-notes') {
          expect(presentation.outfit).toBe('business-attire');
          expect(presentation.background).toBe('office');
        } else if (topic.id === 'friendship-quiet-place') {
          expect(presentation.outfit).toBe('turtleneck');
          expect(presentation.background).toBe('coffee-shop');
        } else if (topic.id === 'boundary-saying-no') {
          expect(presentation.outfit).toBe('smart-casual');
          expect(presentation.background).toBe('quiet-study');
        } else if (topic.id === 'everyday-smalltalk') {
          expect(presentation.outfit).toBe('casual-knitwear');
          expect(presentation.background).toBe('warm-lounge');
        } else if (topic.id === 'meeting-group-discussion') {
          expect(presentation.outfit).toBe('turtleneck');
          expect(presentation.background).toBe('coffee-shop');
        } else if (topic.id === 'appointments-clarification') {
          expect(presentation.outfit).toBe('clinical-professional');
          expect(presentation.background).toBe('consultation-room');
        }
      }
    });
  });

  describe('Custom Scenario Inference', () => {
    it('infers professional business attire and office background for interview situations', () => {
      const generated = ScenarioGenerator.generate({
        situationText:
          'I need to practice my upcoming job interview with a senior engineering manager for a tech lead position.',
      });

      const presentation = getSophiaPresentationForScenario(generated.scenario);
      expect(presentation.outfit).toBe('business-attire');
      expect(presentation.background).toBe('office');
      expect(presentation.outfitLabel).toBe('Professional Business Attire');
    });

    it('infers turtleneck and coffee shop for casual friend coffee chat situations', () => {
      const generated = ScenarioGenerator.generate({
        situationText:
          'Meeting my friend Maya for coffee and brunch to catch up on personal life after a busy month.',
      });

      const presentation = getSophiaPresentationForScenario(generated.scenario);
      expect(presentation.outfit).toBe('turtleneck');
      expect(presentation.background).toBe('coffee-shop');
    });

    it('infers smart-casual and quiet study for roommate boundary negotiation', () => {
      const generated = ScenarioGenerator.generate({
        situationText:
          'Having a difficult conversation with my roommate about quiet hours and setting boundaries regarding guests.',
      });

      const presentation = getSophiaPresentationForScenario(generated.scenario);
      expect(presentation.outfit).toBe('smart-casual');
      expect(presentation.background).toBe('quiet-study');
    });

    it('infers clinical-professional and consultation room for medical provider appointments', () => {
      const generated = ScenarioGenerator.generate({
        situationText:
          'Speaking with my doctor at the clinic to review medication side effects and ask clarification questions.',
      });

      const presentation = getSophiaPresentationForScenario(generated.scenario);
      expect(presentation.outfit).toBe('clinical-professional');
      expect(presentation.background).toBe('consultation-room');
    });

    it('infers casual knitwear and warm lounge for small talk with neighbors', () => {
      const generated = ScenarioGenerator.generate({
        situationText:
          'Making everyday casual small talk with my neighbor in the hallway about the weather and weekend plans.',
      });

      const presentation = getSophiaPresentationForScenario(generated.scenario);
      expect(presentation.outfit).toBe('casual-knitwear');
      expect(presentation.background).toBe('warm-lounge');
    });

    it('falls back sensibly to everyday casual knitwear when situation text is generic', () => {
      const genericScenario: ScenarioDefinition = {
        id: 'custom-generic-123',
        category: 'custom',
        categoryLabel: 'My Personal Scenario',
        title: 'General conversation',
        subtitle: 'Practicing a general conversation',
        userGoal: 'Communicate clearly',
        estimatedMinutes: 3,
        status: 'ready',
        accentColor: 'teal',
        learning: {
          coreInsight: 'Clear listening is key.',
          doubleEmpathyPerspective: { yourNeed: 'Clarity', theirPerspective: 'Listening' },
          practicalApproaches: ['Speak gently'],
          examplePhrases: { gentle: 'Hello', direct: 'Hi' },
        },
        partner: {
          name: 'Sophia',
          role: 'Conversational Partner',
          avatarVariant: 'eva',
          defaultTone: 'Calm',
          initialDialogue: 'Hello there, how are you today?',
        },
        defaultTakeawayScript: 'I appreciated our chat today.',
      };

      const presentation = getSophiaPresentationForScenario(genericScenario);
      expect(presentation.outfit).toBe('casual-knitwear');
      expect(presentation.background).toBe('warm-lounge');
    });
  });
});
