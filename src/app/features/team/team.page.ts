import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';

import { ActionSheetController, ModalController } from '@ionic/angular/lazy';

import {
  AddToTeamUseCase,
  ClearTeamUseCase,
  GetTeamUseCase,
  RemoveFromTeamUseCase,
  SwapTeamSlotUseCase,
} from '../../application/team/team.usecases';
import {
  ComputeTeamStatsUseCase,
  ComputeTeamTypeCoverageUseCase,
} from '../../application/team/team-coverage.usecases';
import { GetPokemonDetailUseCase } from '../../application/pokemon/pokemon.usecases';
import { TeamSlot, TEAM_MAX_SIZE } from '../../core/models/team.model';
import { PokemonDetail } from '../../core/models/pokemon-detail.model';
import { PokemonTypeName } from '../../core/models/pokemon-type.model';
import { TypeDefensiveCoverage } from '../../core/utils/type-effectiveness';
import { TeamSlotPokemon } from '../../shared/components/team-slot/team-slot.component';
import { TeamPickerModalComponent } from './team-picker-modal/team-picker-modal.component';

interface ResolvedSlot {
  readonly slot: TeamSlot;
  readonly pokemon: TeamSlotPokemon | null;
  readonly detail: PokemonDetail | null;
  readonly loading: boolean;
}

const EMPTY_SLOT_POKEMON: TeamSlotPokemon = {
  id: -1,
  name: '',
  imageUrl: '',
  types: [],
};

@Component({
  selector: 'app-team-page',
  templateUrl: './team.page.html',
  styleUrls: ['./team.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPage implements OnInit, OnDestroy {
  private readonly getTeam = inject(GetTeamUseCase);
  private readonly addToTeam = inject(AddToTeamUseCase);
  private readonly removeFromTeam = inject(RemoveFromTeamUseCase);
  private readonly swapTeamSlot = inject(SwapTeamSlotUseCase);
  private readonly clearTeam = inject(ClearTeamUseCase);
  private readonly getDetail = inject(GetPokemonDetailUseCase);
  private readonly modalController = inject(ModalController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly computeCoverage = inject(ComputeTeamTypeCoverageUseCase);
  private readonly computeStats = inject(ComputeTeamStatsUseCase);

  readonly state = signal<'loading' | 'success' | 'empty' | 'error'>('loading');
  readonly slots = signal<ReadonlyArray<TeamSlot>>([]);
  readonly details = signal<Readonly<Record<number, PokemonDetail>>>({});
  readonly errorMessage = signal<string | null>(null);

  readonly filledSlots = computed<ReadonlyArray<TeamSlot>>(() =>
    [...this.slots()].sort((a, b) => a.index - b.index),
  );

  readonly hasTeam = computed(() => this.filledSlots().length > 0);

  readonly isFull = computed(() => this.filledSlots().length >= TEAM_MAX_SIZE);

  readonly resolvedSlots = computed<ReadonlyArray<ResolvedSlot>>(() => {
    const filled = this.filledSlots();
    const detailMap = this.details();
    const allSlots: ResolvedSlot[] = [];
    for (let index = 0; index < TEAM_MAX_SIZE; index += 1) {
      const occupied = filled.find((slot) => slot.index === index);
      if (occupied === undefined) {
        allSlots.push({
          slot: { index, pokemonId: -1 },
          pokemon: null,
          detail: null,
          loading: false,
        });
        continue;
      }
      const detail = detailMap[occupied.pokemonId] ?? null;
      if (detail === null) {
        allSlots.push({
          slot: occupied,
          pokemon: { ...EMPTY_SLOT_POKEMON, id: occupied.pokemonId },
          detail: null,
          loading: true,
        });
        continue;
      }
      allSlots.push({
        slot: occupied,
        pokemon: {
          id: detail.id,
          name: detail.name,
          imageUrl: detail.imageUrl,
          types: detail.types.map((type) => type.name),
        },
        detail,
        loading: false,
      });
    }
    return allSlots;
  });

  readonly coverage = computed<TypeDefensiveCoverage>(() =>
    this.computeCoverage.execute(this.collectMemberTypes(this.resolvedSlots())),
  );

  readonly teamStats = computed(() => {
    const filled = this.filledSlots();
    if (filled.length === 0) {
      return this.computeStats.execute([]);
    }
    const detailMap = this.details();
    const details: PokemonDetail[] = [];
    for (const slot of filled) {
      const detail = detailMap[slot.pokemonId];
      if (detail !== undefined) {
        details.push(detail);
      }
    }
    return this.computeStats.execute(details);
  });

  readonly progressText = computed(
    () => `${this.filledSlots().length}/${TEAM_MAX_SIZE}`,
  );

  readonly completionBadge = computed(() =>
    this.filledSlots().length === TEAM_MAX_SIZE ? 'Team Complete!' : null,
  );

  readonly radarSize = computed(() => {
    if (typeof window === 'undefined') {
      return 180;
    }
    return window.innerWidth >= 1024 ? 220 : 180;
  });

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.getTeam
      .execute()
      .pipe(takeUntil(this.destroy$))
      .subscribe((slots) => {
        this.slots.set(slots);
        if (slots.length === 0) {
          this.state.set('empty');
        } else {
          this.state.set('loading');
        }
        void this.loadDetails(slots);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackBySlot = (_: number, slot: ResolvedSlot): number => slot.slot.index;

  async onSlotOpen(index: number): Promise<void> {
    const allSlots = this.resolvedSlots();
    const slot = allSlots.find((entry) => entry.slot.index === index);
    if (slot === undefined) {
      return;
    }
    if (slot.pokemon === null) {
      await this.openPicker(index, false);
      return;
    }
    await this.promptSlotActions(index, slot.pokemon.name);
  }

  onSlotRemove(index: number): void {
    this.removeFromTeam.execute(index).subscribe((next) => {
      this.slots.set(next);
      void this.loadDetails(next);
    });
  }

  async onAddPokemon(): Promise<void> {
    const nextIndex = this.findFirstEmptyIndex();
    if (nextIndex === null) {
      return;
    }
    await this.openPicker(nextIndex, false);
  }

  onClearTeam(): void {
    this.clearTeam.execute().subscribe((next) => {
      this.slots.set(next);
      void this.loadDetails(next);
    });
  }

  private async loadDetails(slots: ReadonlyArray<TeamSlot>): Promise<void> {
    if (slots.length === 0) {
      this.details.set({});
      return;
    }
    const details: Array<PokemonDetail | null> = await Promise.all(
      slots.map((slot) =>
        firstValueFrom(this.getDetail.execute(slot.pokemonId)).catch(() => null),
      ),
    );
    const next: Record<number, PokemonDetail> = {};
    let hasError = false;
    for (const detail of details) {
      if (detail === null) {
        hasError = true;
        continue;
      }
      next[detail.id] = detail;
    }
    this.details.set(next);
    if (Object.keys(next).length === 0 && hasError) {
      this.errorMessage.set('Could not load team members.');
      this.state.set('error');
      return;
    }
    this.state.set(this.filledSlots().length === 0 ? 'empty' : 'success');
  }

  private async openPicker(
    slotIndex: number,
    excludeCurrent: boolean,
  ): Promise<void> {
    const excluded = excludeCurrent
      ? []
      : this.filledSlots().map((slot) => slot.pokemonId);
    const modal = await this.modalController.create({
      component: TeamPickerModalComponent,
      componentProps: { excludedIds: excluded },
      breakpoints: [0, 0.5, 0.95],
      initialBreakpoint: 0.95,
    });
    await modal.present();
    const { data } = await modal.onDidDismiss();
    const payload = data as { pokemonId?: number } | undefined;
    if (payload?.pokemonId === undefined) {
      return;
    }
    const isOccupied = this.filledSlots().some((slot) => slot.index === slotIndex);
    if (isOccupied) {
      this.swapTeamSlot.execute(slotIndex, payload.pokemonId).subscribe((next) => {
        this.slots.set(next);
        void this.loadDetails(next);
      });
    } else {
      this.addToTeam.execute(payload.pokemonId).subscribe((next) => {
        this.slots.set(next);
        void this.loadDetails(next);
      });
    }
  }

  private async promptSlotActions(index: number, pokemonName: string): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: pokemonName,
      buttons: [
        {
          text: 'Swap',
          icon: 'swap-horizontal-outline',
          handler: () => {
            void this.openPicker(index, true);
          },
        },
        {
          text: 'Remove',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.onSlotRemove(index),
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
  }

  private findFirstEmptyIndex(): number | null {
    const used = new Set(this.filledSlots().map((slot) => slot.index));
    for (let i = 0; i < TEAM_MAX_SIZE; i += 1) {
      if (!used.has(i)) {
        return i;
      }
    }
    return null;
  }

  private collectMemberTypes(
    slots: ReadonlyArray<ResolvedSlot>,
  ): ReadonlyArray<ReadonlyArray<PokemonTypeName>> {
    const groups: PokemonTypeName[][] = [];
    for (const slot of slots) {
      if (slot.detail !== null) {
        groups.push(slot.detail.types.map((type) => type.name));
      }
    }
    return groups;
  }

  formatId(id: number): string {
    return id.toString().padStart(3, '0');
  }
}
