import { POKEMON_TYPE_HEX } from '../models/pokemon-type.model';
import {
  buildTypeBadgeClass,
  typeContrastTextClass,
  typeHexColor,
} from './type-color.mapper';

describe('type-color.mapper', () => {
  it('returns the official hex for known types', () => {
    expect(typeHexColor('fire')).toBe(POKEMON_TYPE_HEX.fire);
    expect(typeHexColor('water')).toBe(POKEMON_TYPE_HEX.water);
    expect(typeHexColor('psychic')).toBe(POKEMON_TYPE_HEX.psychic);
  });

  it('falls back to normal-type color when input is missing or unknown', () => {
    expect(typeHexColor(null)).toBe(POKEMON_TYPE_HEX.normal);
    expect(typeHexColor(undefined)).toBe(POKEMON_TYPE_HEX.normal);
    expect(typeHexColor('shadow')).toBe(POKEMON_TYPE_HEX.normal);
  });

  it('builds tailwind utility class names', () => {
    expect(buildTypeBadgeClass('fire')).toBe('bg-type-fire');
    expect(buildTypeBadgeClass('Electric')).toBe('bg-type-electric');
    expect(buildTypeBadgeClass(null)).toBe('bg-type-normal');
  });

  describe('typeContrastTextClass', () => {
    it('returns dark text on light type backgrounds', () => {
      expect(typeContrastTextClass('electric')).toBe('text-gray-900');
      expect(typeContrastTextClass('ice')).toBe('text-gray-900');
      expect(typeContrastTextClass('ground')).toBe('text-gray-900');
      expect(typeContrastTextClass('steel')).toBe('text-gray-900');
      expect(typeContrastTextClass('fairy')).toBe('text-gray-900');
      expect(typeContrastTextClass('normal')).toBe('text-gray-900');
      expect(typeContrastTextClass('grass')).toBe('text-gray-900');
    });

    it('returns white text on dark type backgrounds', () => {
      expect(typeContrastTextClass('fire')).toBe('text-white');
      expect(typeContrastTextClass('water')).toBe('text-white');
      expect(typeContrastTextClass('fighting')).toBe('text-white');
      expect(typeContrastTextClass('poison')).toBe('text-white');
      expect(typeContrastTextClass('psychic')).toBe('text-white');
      expect(typeContrastTextClass('ghost')).toBe('text-white');
      expect(typeContrastTextClass('dragon')).toBe('text-white');
      expect(typeContrastTextClass('dark')).toBe('text-white');
    });

    it('falls back to the normal-type contrast when input is missing or unknown', () => {
      expect(typeContrastTextClass(null)).toBe(typeContrastTextClass('normal'));
      expect(typeContrastTextClass(undefined)).toBe(typeContrastTextClass('normal'));
      expect(typeContrastTextClass('shadow')).toBe(typeContrastTextClass('normal'));
    });
  });
});
