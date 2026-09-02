import { Injectable, computed, inject, signal } from '@angular/core';
import { SteamService } from './steam.service';
import { UserProfile } from '../../models/user-profile.model';
import { Game } from '../../models/game.model';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SteamStateService {
  private readonly steamService = inject(SteamService);

  // Replace later when we support searching different users
  private readonly _steamId = signal('76561198127309108');
  // private readonly steamId = signal('76561198201368665');
  get steamId(): string {
    return this._steamId();
  }

  readonly profile = signal<UserProfile | null>(null);
  readonly games = signal<Game[]>([]);
  readonly recentlyPlayed = signal<Game[]>([]);
  readonly loading = signal(false);

  readonly totalGames = computed(() => this.games().length);

  readonly totalHours = computed(
    () => this.games().reduce((sum, game) => sum + game.playtimeMinutes, 0) / 60,
  );

  private readonly STATUS_KEY = 'game-status';

  private loadPersistedStatus(): Record<number, { isBacklog: boolean; isCompleted: boolean }> {
    try {
      const raw = localStorage.getItem(this.STATUS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private savePersistedStatus(
    status: Record<number, { isBacklog: boolean; isCompleted: boolean }>,
  ): void {
    localStorage.setItem(this.STATUS_KEY, JSON.stringify(status));
  }

  loadInitialData(): void {
    if (this.loading()) return;
    this.loading.set(true);

    const persisted = this.loadPersistedStatus();

    forkJoin({
      profile: this.steamService.getProfile(this._steamId()),
      games: this.steamService.getGames(this._steamId()),
      recentlyPlayed: this.steamService.getRecentlyPlayed(this._steamId()),
    })
      .pipe(
        switchMap(({ profile, games, recentlyPlayed }) => {
          this.profile.set(profile);

          this.games.set(
            games.map((game) => ({
              ...game,
              lastPlayed: game.lastPlayed ? new Date(game.lastPlayed) : null,
              isCompleted: persisted[game.appId]?.isCompleted ?? false,
              isBacklog: persisted[game.appId]?.isBacklog ?? false,
            })),
          );

          this.recentlyPlayed.set(
            recentlyPlayed.map((game) => ({
              ...game,
              isCompleted: persisted[game.appId]?.isCompleted ?? false,
              isBacklog: persisted[game.appId]?.isBacklog ?? false,
              lastPlayed: null,
            })),
          );

          return this.loadAchievements();
        }),
      )
      .subscribe({
        next: () => this.loading.set(false),
        error: (error) => {
          console.error('Failed to load Steam data:', error);
          this.loading.set(false);
        },
      });
  }

  toggleBacklog(appId: number): void {
    this.updateGameStatus(appId, 'isBacklog');
  }

  toggleCompleted(appId: number): void {
    this.updateGameStatus(appId, 'isCompleted');
  }

  private updateGameStatus(appId: number, key: 'isBacklog' | 'isCompleted'): void {
    const updateList = (list: Game[]) =>
      list.map((game) => (game.appId === appId ? { ...game, [key]: !game[key] } : game));

    this.games.update(updateList);
    this.recentlyPlayed.update(updateList);

    const updated =
      this.games().find((g) => g.appId === appId) ??
      this.recentlyPlayed().find((g) => g.appId === appId);

    if (updated) {
      const persisted = this.loadPersistedStatus();
      persisted[appId] = { isBacklog: updated.isBacklog, isCompleted: updated.isCompleted };
      this.savePersistedStatus(persisted);
    }
  }

  getGameById(appId: number) {
    return computed(() => this.games().find((game) => game.appId === appId));
  }

  private loadAchievements(): Observable<void> {
    const recentGames = this.recentlyPlayed();

    if (recentGames.length === 0) {
      return of(void 0);
    }

    return forkJoin(
      recentGames.map((game) =>
        this.steamService.getAchievements(this._steamId(), game.appId).pipe(
          map((achievementSummary) => ({ appId: game.appId, achievementSummary })),
          catchError((error) => {
            console.error(`Failed to load achievements for ${game.name}:`, error);
            return of(null);
          }),
        ),
      ),
    ).pipe(
      map((results) => {
        this.recentlyPlayed.update((games) =>
          games.map((game) => {
            const result = results.find((r) => r?.appId === game.appId);
            return result ? { ...game, achievementSummary: result.achievementSummary } : game;
          }),
        );
      }),
    );
  }
}
