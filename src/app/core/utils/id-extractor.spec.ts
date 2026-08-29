import { extractIdFromUrl } from './id-extractor';

describe('extractIdFromUrl', () => {
  it('returns the trailing numeric id from a pokeapi url', () => {
    expect(
      extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/'),
    ).toBe(25);
  });

  it('returns the id when there is no trailing slash', () => {
    expect(
      extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/133'),
    ).toBe(133);
  });

  it('returns null when the url is empty or missing', () => {
    expect(extractIdFromUrl(null)).toBeNull();
    expect(extractIdFromUrl(undefined)).toBeNull();
    expect(extractIdFromUrl('')).toBeNull();
    expect(extractIdFromUrl('   ')).toBeNull();
  });

  it('returns null when the trailing segment is not numeric', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/foo')).toBeNull();
  });
});
