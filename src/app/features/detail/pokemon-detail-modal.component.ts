import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ModalController } from '@ionic/angular/lazy';
import { Subject, takeUntil } from 'rxjs';

import { PokemonDetail } from '../../core/models/pokemon-detail.model';
import { GetPokemonDetailUseCase } from '../../application/pokemon/pokemon.usecases';
import {
  IsFavoriteUseCase,
  ToggleFavoriteUseCase,
} from '../../application/favorites/favorites.usecases';
import { PokemonDetailEntity } from '../../domain/entities/pokemon.entity';
import { typeHexColor, typeContrastTextClass } from '../../core/utils/type-color.mapper';

@Component({
  selector: 'app-pokemon-detail-modal',
  templateUrl: './pokemon-detail-modal.component.html',
  styleUrls: ['./pokemon-detail-modal.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailModalComponent implements OnInit, OnDestroy {
  @Input() pokemonId!: number | string;

  private readonly modalController = inject(ModalController);
  private readonly getDetail = inject(GetPokemonDetailUseCase);
  private readonly toggleFavorite = inject(ToggleFavoriteUseCase);
  private readonly isFavoriteUseCase = inject(IsFavoriteUseCase);

  readonly state = signal<'loading' | 'success' | 'error'>('loading');
  readonly detail = signal<PokemonDetailEntity | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly isFavorite = signal<boolean>(false);
  readonly favoriteIcon = signal<string>('heart-outline');
  readonly favoriteLabel = signal<string>('Add to favorites');

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.pokemonId === undefined || this.pokemonId === null) {
      this.state.set('error');
      this.errorMessage.set('Missing pokemon id.');
      return;
    }
    this.loadDetail();
    this.subscribeFavorite();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    void this.modalController.dismiss();
  }

  onRetry(): void {
    this.loadDetail();
  }

  onToggleFavorite(): void {
    const detail = this.detail();
    if (!detail) {
      return;
    }
    this.toggleFavorite.execute(detail.id).subscribe(() => {
      this.applyFavorite(detail.id);
    });
  }

  typeColor(type: string | null | undefined): string {
    return typeHexColor(type);
  }

  typeClass(type: string | null | undefined): string {
    if (!type) {
      return 'bg-type-normal';
    }
    return `bg-type-${type}`;
  }

  typeBadgeClass(type: string | null | undefined): string {
    return `${this.typeClass(type)} ${typeContrastTextClass(type)}`;
  }

  formatMove(name: string): string {
    return name
      .split('-')
      .map((part) =>
        part.length === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
      )
      .join(' ');
  }

  formatId(id: number): string {
    return id.toString().padStart(3, '0');
  }

  private loadDetail(): void {
    this.state.set('loading');
    this.errorMessage.set(null);
    this.getDetail.execute(this.pokemonId).subscribe({
      next: (detail: PokemonDetail) => {
        this.detail.set(new PokemonDetailEntity(detail));
        this.state.set('success');
        this.applyFavorite(detail.id);
      },
      error: () => {
        this.state.set('error');
        this.errorMessage.set('Could not load Pokemon details.');
      },
    });
  }

  private subscribeFavorite(): void {
    if (typeof this.pokemonId !== 'number') {
      return;
    }
    this.isFavoriteUseCase
      .execute(this.pokemonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.applyFavoriteValue(value));
  }

  private applyFavorite(id: number): void {
    const value = this.isFavoriteUseCase.snapshot(id);
    this.applyFavoriteValue(value);
  }

  private applyFavoriteValue(value: boolean): void {
    this.isFavorite.set(value);
    this.favoriteIcon.set(value ? 'heart' : 'heart-outline');
    this.favoriteLabel.set(value ? 'Remove from favorites' : 'Add to favorites');
  }
}
