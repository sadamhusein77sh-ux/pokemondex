import { POKEMON_TYPE_HEX, PokemonTypeName } from '../models/pokemon-type.model';

export function typeHexColor(typeName: string | null | undefined): string {
  if (!typeName) {
    return '#A8A878';
  }
  const key = typeName.toLowerCase() as PokemonTypeName;
  return POKEMON_TYPE_HEX[key] ?? '#A8A878';
}

export function buildTypeBadgeClass(typeName: string | null | undefined): string {
  if (!typeName) {
    return 'bg-type-normal';
  }
  return `bg-type-${typeName.toLowerCase()}`;
}

/**
 * Returns a Tailwind text-color class that keeps a type chip label readable
 * against the official Pokemon type background color. Light chips (electric,
 * ice, ground, steel, fairy) get dark text; everything else keeps white text.
 */
export function typeContrastTextClass(
  typeName: string | null | undefined,
): string {
  return isLightHex(typeHexColor(typeName)) ? 'text-gray-900' : 'text-white';
}

function isLightHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return false;
  }
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 / 255;
  return brightness > 0.6;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) {
    return null;
  }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}
