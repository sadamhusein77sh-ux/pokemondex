import { PokemonDetailEntity } from './pokemon.entity';

const baseDetail = {
  id: 25,
  name: 'pikachu',
  imageUrl: 'https://example.test/pikachu.png',
  types: [
    { name: 'electric' as const, url: 'x' },
  ],
  height: 4,
  weight: 60,
  abilities: [{ name: 'static', isHidden: false }],
  stats: [
    { name: 'hp', baseValue: 35 },
    { name: 'attack', baseValue: 55 },
    { name: 'speed', baseValue: 90 },
  ],
  moves: [{ name: 'thunderbolt' }],
  spriteFallbacks: [],
};

describe('PokemonDetailEntity', () => {
  it('exposes the id and capitalized name', () => {
    const entity = new PokemonDetailEntity(baseDetail);
    expect(entity.id).toBe(25);
    expect(entity.capitalizedName).toBe('Pikachu');
  });

  it('returns primary type name and total base stats', () => {
    const entity = new PokemonDetailEntity(baseDetail);
    expect(entity.primaryTypeName).toBe('electric');
    expect(entity.totalBaseStat).toBe(180);
    expect(entity.statMax).toBe(90);
  });

  it('formats bar widths relative to the highest stat', () => {
    const entity = new PokemonDetailEntity(baseDetail);
    expect(entity.statBarWidth(90)).toBe('100.0%');
    expect(entity.statBarWidth(35)).toBe('38.9%');
    expect(entity.statBarWidth(999, 200)).toBe('100.0%');
    expect(entity.statBarWidth(-10, 100)).toBe('0.0%');
  });

  it('maps stat labels through the display helper', () => {
    const entity = new PokemonDetailEntity(baseDetail);
    expect(entity.statLabel('special-attack')).toBe('Sp. Atk');
  });

  it('returns null primary type when no types are listed', () => {
    const entity = new PokemonDetailEntity({ ...baseDetail, types: [] });
    expect(entity.primaryTypeName).toBeNull();
  });
});
