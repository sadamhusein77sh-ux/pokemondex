import { FavoritesDomain } from './favorites.domain';

describe('FavoritesDomain', () => {
  describe('toggle', () => {
    it('adds the id when not present', () => {
      expect(FavoritesDomain.toggle([1, 2], 3)).toEqual([1, 2, 3]);
    });

    it('removes the id when present', () => {
      expect(FavoritesDomain.toggle([1, 2, 3], 2)).toEqual([1, 3]);
    });
  });

  describe('isFavorite', () => {
    it('returns true when id is present', () => {
      expect(FavoritesDomain.isFavorite([1, 2], 2)).toBe(true);
    });

    it('returns false when id is missing', () => {
      expect(FavoritesDomain.isFavorite([1, 2], 9)).toBe(false);
    });
  });

  describe('add', () => {
    it('appends new ids without mutating', () => {
      const original = [1, 2];
      const result = FavoritesDomain.add(original, 3);
      expect(result).toEqual([1, 2, 3]);
      expect(result).not.toBe(original);
    });

    it('returns the same logical list when id already exists', () => {
      expect(FavoritesDomain.add([1, 2, 3], 2)).toEqual([1, 2, 3]);
    });
  });

  describe('remove', () => {
    it('removes the id and keeps the rest', () => {
      expect(FavoritesDomain.remove([1, 2, 3], 2)).toEqual([1, 3]);
    });

    it('returns the same list when id is missing', () => {
      expect(FavoritesDomain.remove([1, 2], 9)).toEqual([1, 2]);
    });
  });
});
