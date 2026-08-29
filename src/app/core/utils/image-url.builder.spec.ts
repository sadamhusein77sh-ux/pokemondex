import {
  buildOfficialArtworkUrl,
  buildPlaceholderUrl,
  buildSpriteFallbackUrls,
} from './image-url.builder';

describe('image-url.builder', () => {
  it('builds the official artwork url', () => {
    expect(buildOfficialArtworkUrl(25)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    );
  });

  it('builds a static and animated fallback chain', () => {
    expect(buildSpriteFallbackUrls(133)).toEqual([
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png',
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.gif',
    ]);
  });

  it('builds a safe placeholder url from a name', () => {
    expect(buildPlaceholderUrl('Mr. Mime')).toBe(
      'https://placehold.co/200x200/png?text=mrmime',
    );
    expect(buildPlaceholderUrl('???')).toBe(
      'https://placehold.co/200x200/png?text=pokemon',
    );
  });
});
