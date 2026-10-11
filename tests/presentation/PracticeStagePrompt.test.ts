import { describe, it, expect } from 'vitest';
import { buildScenarioPersonaPrompt } from '../../src/presentation/components/PracticeStage';
import { TOPICS } from '../../src/domain/scenarios/topics';

describe('buildScenarioPersonaPrompt', () => {
  it('constructs a rich, scenario-aligned prompt with partner role and constraints', () => {
    const topic = TOPICS[0]; // 'work-written-notes'
    const prompt = buildScenarioPersonaPrompt(topic);

    expect(prompt).toContain(topic.partner.name);
    expect(prompt).toContain(topic.partner.role);
    expect(prompt).toContain(topic.title);
    expect(prompt).toContain(topic.userGoal);
    expect(prompt).toContain('Stay strictly in character');
    expect(prompt).toContain('Speak concisely (1 to 3 spoken sentences per turn)');
  });

  it('incorporates custom scenario situation and avoid constraints when available', () => {
    const customTopic = {
      ...TOPICS[0],
      partner: {
        ...TOPICS[0].partner,
        name: 'Jordan',
        role: 'Senior Architect',
      },
      customMetadata: {
        userProvidedSituation: 'Discussing scope changes before Friday code freeze',
        avoidConstraints: 'Do not agree to weekend overtime',
        sourceType: 'manual' as const,
        createdTimestamp: Date.now(),
      },
    };

    const prompt = buildScenarioPersonaPrompt(customTopic);
    expect(prompt).toContain('Jordan');
    expect(prompt).toContain('Senior Architect');
    expect(prompt).toContain('Discussing scope changes before Friday code freeze');
    expect(prompt).toContain('Do not agree to weekend overtime');
  });
});
