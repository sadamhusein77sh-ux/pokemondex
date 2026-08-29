export function buildOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function buildSpriteFallbackUrls(id: number): ReadonlyArray<string> {
  return [
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.gif`,
  ];
}

export function buildPlaceholderUrl(name: string): string {
  const stripped = name.replace(/[^a-z0-9]+/gi, '').toLowerCase();
  const safe = stripped.length > 0 ? stripped : 'pokemon';
  return `https://placehold.co/200x200/png?text=${safe}`;
}
