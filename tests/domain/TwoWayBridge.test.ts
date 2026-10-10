import { describe, it, expect } from 'vitest';
import {
  createTwoWayBridge,
  isValidTwoWayBridge,
} from '../../src/domain/entities/TwoWayBridge';

describe('TwoWayBridge', () => {
  it('creates an immutable and valid TwoWayBridge with trimmed strings', () => {
    const bridge = createTwoWayBridge(
      '  Self-advocacy to ensure delivery accuracy.  ',
      ' An administrative demand on the manager. ',
    );

    expect(bridge.userIntent).toBe('Self-advocacy to ensure delivery accuracy.');
    expect(bridge.receivedImpact).toBe('An administrative demand on the manager.');
    expect(Object.isFrozen(bridge)).toBe(true);
    expect(isValidTwoWayBridge(bridge)).toBe(true);
  });

  it('rejects empty or whitespace-only userIntent', () => {
    expect(() => createTwoWayBridge('', 'Valid impact')).toThrow(
      'TwoWayBridge: userIntent must be a non-empty string.',
    );
    expect(() => createTwoWayBridge('   ', 'Valid impact')).toThrow(
      'TwoWayBridge: userIntent must be a non-empty string.',
    );
  });

  it('rejects empty or whitespace-only receivedImpact', () => {
    expect(() => createTwoWayBridge('Valid intent', '')).toThrow(
      'TwoWayBridge: receivedImpact must be a non-empty string.',
    );
    expect(() => createTwoWayBridge('Valid intent', '   ')).toThrow(
      'TwoWayBridge: receivedImpact must be a non-empty string.',
    );
  });

  it('isValidTwoWayBridge returns false for invalid structures', () => {
    expect(isValidTwoWayBridge({ userIntent: '', receivedImpact: 'ok' })).toBe(false);
    expect(isValidTwoWayBridge({ userIntent: 'ok', receivedImpact: '   ' })).toBe(false);
    expect(isValidTwoWayBridge({ userIntent: 'ok', receivedImpact: 123 as unknown as string })).toBe(false);
  });
});
