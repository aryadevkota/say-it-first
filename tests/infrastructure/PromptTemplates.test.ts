import { describe, it, expect } from 'vitest';
import {
  CONVERSATION_SYSTEM_PROMPT,
  buildSystemPrompt,
} from '../../src/infrastructure/adapters/llm/PromptTemplates';
import { createAffectVector } from '../../src/domain/entities/AffectVector';

describe('PromptTemplates', () => {
  it('contains master system prompt keywords verbatim from §6', () => {
    expect(CONVERSATION_SYSTEM_PROMPT).toContain('simulation and affective computing engine');
    expect(CONVERSATION_SYSTEM_PROMPT).toContain('DBT DEAR MAN');
    expect(CONVERSATION_SYSTEM_PROMPT).toContain('Tension >= 9.0');
    expect(CONVERSATION_SYSTEM_PROMPT).toContain('two_way_bridge');
    expect(CONVERSATION_SYSTEM_PROMPT).toContain('pocket_script_pivot');
  });

  it('interpolates parameters and formats VAD coordinates to 3 decimals', () => {
    const vad = createAffectVector(-0.238, 0.402, 0.248);
    const rendered = buildSystemPrompt({
      scenarioId: 'workplace_written_specs',
      personaName: 'Alex (Direct Manager)',
      systemContext: 'Balancing quarterly product rollout deadline.',
      currentVad: vad,
    });

    expect(rendered).toContain('SCENARIO ID: workplace_written_specs');
    expect(rendered).toContain('PERSONA ARCHETYPE: Alex (Direct Manager)');
    expect(rendered).toContain('PERSONA CONTEXT: Balancing quarterly product rollout deadline.');
    expect(rendered).toContain('Valence=-0.238, Arousal=0.402');
    expect(rendered).toContain('Dominance=0.248');
  });
});
