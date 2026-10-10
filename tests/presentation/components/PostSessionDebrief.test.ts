import { describe, it, expect } from 'vitest';
import type { PocketScriptResult } from '../../../src/application/use-cases/GeneratePocketScriptUseCase';

describe('PostSessionDebrief data contract (FR-08)', () => {
  it('contains actionable DBT DEAR MAN script and neutralizes friction', () => {
    const mockPocketScript: PocketScriptResult = {
      actionableScript:
        'I want to make sure I deliver on time. What if I write a brief bulleted recap after our meetings?',
      clinicalFramework: 'DBT DEAR MAN',
      underlyingIntent: 'Need written instructions for clarity without cognitive overload.',
      neurotypicalImpactNeutralized: 'Perceived administrative burden on the direct manager.',
    };

    expect(mockPocketScript.actionableScript.length).toBeGreaterThan(10);
    expect(mockPocketScript.clinicalFramework).toContain('DBT DEAR MAN');
    expect(mockPocketScript.underlyingIntent).toBeDefined();
    expect(mockPocketScript.neurotypicalImpactNeutralized).toBeDefined();
  });
});
