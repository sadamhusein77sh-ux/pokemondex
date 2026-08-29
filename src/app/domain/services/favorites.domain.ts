export class FavoritesDomain {
  static toggle(current: ReadonlyArray<number>, id: number): ReadonlyArray<number> {
    if (current.includes(id)) {
      return current.filter((existing) => existing !== id);
    }
    return [...current, id];
  }

  static isFavorite(current: ReadonlyArray<number>, id: number): boolean {
    return current.includes(id);
  }

  static add(current: ReadonlyArray<number>, id: number): ReadonlyArray<number> {
    if (current.includes(id)) {
      return current;
    }
    return [...current, id];
  }

  static remove(current: ReadonlyArray<number>, id: number): ReadonlyArray<number> {
    return current.filter((existing) => existing !== id);
  }
}
