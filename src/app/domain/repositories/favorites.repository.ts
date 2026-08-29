import { Observable } from 'rxjs';

export abstract class FavoritesRepository {
  abstract loadFavorites(): Observable<ReadonlyArray<number>>;
  abstract addFavorite(id: number): Observable<ReadonlyArray<number>>;
  abstract removeFavorite(id: number): Observable<ReadonlyArray<number>>;
  abstract isFavorite(id: number): boolean;
  abstract watchFavorites(): Observable<ReadonlyArray<number>>;
}
