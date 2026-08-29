export type CanonicalStatName =
  | 'hp'
  | 'attack'
  | 'defense'
  | 'special-attack'
  | 'special-defense'
  | 'speed';

export const CANONICAL_STAT_ORDER: readonly CanonicalStatName[] = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
];

export const STAT_DISPLAY_LABEL: Readonly<Record<CanonicalStatName, string>> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

export function toCanonicalStatName(rawName: string): CanonicalStatName | null {
  const normalized = rawName.trim().toLowerCase().replace(/\s+/g, '-');
  if ((CANONICAL_STAT_ORDER as readonly string[]).includes(normalized)) {
    return normalized as CanonicalStatName;
  }
  return null;
}

export function statDisplayLabel(rawName: string): string {
  const canonical = toCanonicalStatName(rawName);
  return canonical === null ? rawName : STAT_DISPLAY_LABEL[canonical];
}
