import { describe, it, expect } from 'vitest';
import { ScenarioGenerator } from '../../src/domain/scenarios/ScenarioGenerator';

describe('ScenarioGenerator', () => {
  it('generates a full scenario from free-form text input', () => {
    const result = ScenarioGenerator.generate({
      situationText: "My roommate plays loud music late while I'm trying to sleep. I want to ask them to use headphones after 10 PM without getting defensive.",
      partnerRole: 'Roommate',
      relationshipContext: 'Living together for 6 months, mostly friendly',
      userGoal: 'Agree on quiet hours after 10 PM',
      avoidConstraints: 'Do not escalate into anger or personal attacks',
    });

    expect(result.scenario.id).toMatch(/^custom-/);
    expect(result.scenario.category).toBe('custom');
    expect(result.scenario.categoryLabel).toBe('My Personal Scenario');
    expect(result.scenario.title).toBeTruthy();
    expect(result.scenario.partner.name).toBeTruthy();
    expect(result.scenario.partner.role).toContain('Roommate');
    expect(result.scenario.partner.initialDialogue).toBeTruthy();
    expect(result.userProvidedFacts.partnerRole).toBe('Roommate');
    expect(result.userProvidedFacts.userGoal).toBe('Agree on quiet hours after 10 PM');
    expect(result.inferredDetails.partnerConcerns).toBeTruthy();
  });

  it('infers partner and goal when optional fields are omitted', () => {
    const result = ScenarioGenerator.generate({
      situationText: "I need to ask my boss for a raise during our 1-on-1 meeting next Tuesday.",
    });

    expect(result.scenario.id).toMatch(/^custom-/);
    expect(result.scenario.partner.role.toLowerCase()).toContain('manager');
    expect(result.scenario.partner.initialDialogue).toBeTruthy();
    expect(result.userProvidedFacts.situation).toContain('boss for a raise');
  });

  it('rejects empty situation text with a clear descriptive error', () => {
    expect(() => {
      ScenarioGenerator.generate({
        situationText: '   ',
      });
    }).toThrow('Please provide a description of the situation');
  });

  it('parses structured JSON inputs correctly', () => {
    const jsonInput = JSON.stringify({
      context: 'Landlord is delaying repair of the heating system',
      desiredOutcome: 'Get a firm date for technician visit',
    });

    const result = ScenarioGenerator.generate({
      situationText: jsonInput,
      partnerRole: 'Landlord',
    });

    expect(result.scenario.title).toBeTruthy();
    expect(result.scenario.partner.role).toBe('Landlord');
  });
});
