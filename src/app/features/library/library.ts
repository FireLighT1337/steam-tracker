import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { GameCard } from '../../shared/game-card/game-card';
import { SteamStateService } from '../../core/services/steam-state.service';
import { Game } from '../../models/game.model';

type SortOption = 'name-asc' | 'name-desc' | 'playtime-desc' | 'playtime-asc';
type StatusFilter = 'all' | 'backlog' | 'completed';

@Component({
  selector: 'app-library',
  imports: [GameCard],
  templateUrl: './library.html',
  styleUrl: './library.css',
})
export class Library {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly steamState = inject(SteamStateService);

  games = this.steamState.games;
  loading = this.steamState.loading;
  loadingAchievementIds = this.steamState.loadingAchievementIds;

  statusFilter = toSignal(
    this.route.data.pipe(map((data) => (data['statusFilter'] as StatusFilter) ?? 'all')),
    { initialValue: 'all' as StatusFilter },
  );

  pageTitle = computed(() => {
    switch (this.statusFilter()) {
      case 'backlog':
        return 'Backlog';
      case 'completed':
        return 'Completed Games';
      default:
        return 'All Games';
    }
  });

  private readonly initialQueryParams = this.route.snapshot.queryParamMap;

  searchTerm = signal(this.initialQueryParams.get('q') ?? '');
  sortOption = signal<SortOption>(
    (this.initialQueryParams.get('sort') as SortOption | null) ?? 'name-asc',
  );
  currentPage = signal(Number(this.initialQueryParams.get('page')) || 1);
  readonly pageSize = 21;

  private readonly allTrackedGames = computed(() => {
    const map = new Map<number, Game>();

    for (const game of this.games()) {
      map.set(game.appId, game);
    }

    for (const game of this.steamState.recentlyPlayed()) {
      map.set(game.appId, { ...map.get(game.appId), ...game });
    }

    return Array.from(map.values());
  });

  statusFilteredGames = computed(() => {
    const games = this.allTrackedGames();

    switch (this.statusFilter()) {
      case 'backlog':
        return games.filter((game) => game.isBacklog);
      case 'completed':
        return games.filter((game) => game.isCompleted);
      default:
        return games;
    }
  });

  filteredGames = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const games = this.statusFilteredGames();

    if (!term) return games;

    return games.filter((game) => game.name.toLowerCase().includes(term));
  });

  sortedGames = computed(() => {
    const games = [...this.filteredGames()];

    switch (this.sortOption()) {
      case 'name-asc':
        return games.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return games.sort((a, b) => b.name.localeCompare(a.name));
      case 'playtime-desc':
        return games.sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);
      case 'playtime-asc':
        return games.sort((a, b) => a.playtimeMinutes - b.playtimeMinutes);
      default:
        return games;
    }
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedGames().length / this.pageSize)));

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  pagedGames = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.sortedGames().slice(start, start + this.pageSize);
  });

  private initialized = false;

  constructor() {
    // Reset to page 1 whenever search, sort, or status filter changes, but not on initial load,
    // since the initial page number may have been restored from the URL
    effect(() => {
      this.searchTerm();
      this.sortOption();
      this.statusFilter();

      if (this.initialized) {
        this.currentPage.set(1);
      } else {
        this.initialized = true;
      }
    });

    // Keep the URL's query params in sync with current state, so browser back/forward
    // and direct links restore the exact view the user was on
    effect(() => {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          page: this.currentPage(),
          sort: this.sortOption(),
          q: this.searchTerm() || null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });

    // Lazily load achievements only for games on the currently visible page
    effect(() => {
      const ids = this.pagedGames().map((g) => g.appId);
      this.steamState.loadAchievementsForGames(ids);
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onSortChange(value: SortOption): void {
    this.sortOption.set(value);
  }

  setStatusFilter(filter: StatusFilter): void {
    const path = filter === 'all' ? '/library' : `/${filter}`;
    this.router.navigate([path]);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update((p) => p + 1);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update((p) => p - 1);
  }
}
