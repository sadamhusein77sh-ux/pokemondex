import {
  CANONICAL_STAT_ORDER,
  STAT_DISPLAY_LABEL,
  statDisplayLabel,
  toCanonicalStatName,
} from './stat-name.mapper';

describe('stat-name.mapper', () => {
  it('maps every canonical stat name to a display label', () => {
    for (const name of CANONICAL_STAT_ORDER) {
      expect(STAT_DISPLAY_LABEL[name]).toBeTruthy();
    }
  });

  it('returns canonical name for well-known inputs', () => {
    expect(toCanonicalStatName('hp')).toBe('hp');
    expect(toCanonicalStatName('special-attack')).toBe('special-attack');
    expect(toCanonicalStatName('Special Defense')).toBe('special-defense');
  });

  it('returns null for unknown stat names', () => {
    expect(toCanonicalStatName('mystery-stat')).toBeNull();
  });

  it('returns a display label for known stats and the raw name otherwise', () => {
    expect(statDisplayLabel('attack')).toBe('Attack');
    expect(statDisplayLabel('special-defense')).toBe('Sp. Def');
    expect(statDisplayLabel('unknown')).toBe('unknown');
  });
});
