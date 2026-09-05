import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { map, switchMap } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { SteamStateService } from '../../core/services/steam-state.service';
import { SteamService } from '../../core/services/steam.service';
import { Game } from '../../models/game.model';

type AchievementSortOption = 'default' | 'rarest' | 'alphabetical';

@Component({
  selector: 'app-game-details',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './game-details.html',
  styleUrl: './game-details.css',
})
export class GameDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly steamState = inject(SteamStateService);
  private readonly steamService = inject(SteamService);
  private readonly location = inject(Location);

  loading = this.steamState.loading;

  appId = toSignal(this.route.paramMap.pipe(map((params) => Number(params.get('appId')))), {
    initialValue: 0,
  });

  private readonly baseGame = computed((): Game | undefined => {
    const fromGames = this.steamState.games().find((g) => g.appId === this.appId());
    const fromRecent = this.steamState.recentlyPlayed().find((g) => g.appId === this.appId());

    if (!fromGames && !fromRecent) return undefined;

    const source = fromGames ?? fromRecent!;

    return {
      ...source,
      playtimeTwoWeeks: fromRecent?.playtimeTwoWeeks ?? fromGames?.playtimeTwoWeeks,
    };
  });

  private readonly fetchedAchievements = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) =>
        this.steamService.getAchievements(this.steamState.steamId, Number(params.get('appId'))),
      ),
    ),
    { initialValue: undefined },
  );

  game = computed(() => {
    const base = this.baseGame();
    if (!base) return undefined;

    return {
      ...base,
      achievementSummary: this.fetchedAchievements() ?? base.achievementSummary,
    };
  });

  unlockedCount = computed(
    () => this.game()?.achievementSummary?.achievements?.filter((a) => a.achieved).length ?? 0,
  );

  totalCount = computed(() => this.game()?.achievementSummary?.achievements?.length ?? 0);

  isFullyCompleted = computed(
    () => (this.game()?.achievementSummary?.progressPercent ?? 0) === 100,
  );

  isFamilyShared = computed(() => {
    const id = this.appId();
    const inOwnedGames = this.steamState.games().some((g) => g.appId === id);
    return !inOwnedGames;
  });

  toggleBacklog(): void {
    this.steamState.toggleBacklog(this.appId());
  }

  toggleCompleted(): void {
    this.steamState.toggleCompleted(this.appId());
  }

  visibleAchievementCount = signal(10);
  achievementSortOption = signal<AchievementSortOption>('default');

  private readonly sortedAchievements = computed(() => {
    const achievements = this.game()?.achievementSummary?.achievements ?? [];

    switch (this.achievementSortOption()) {
      case 'rarest':
        return [...achievements].sort((a, b) => {
          if (a.globalPercent === null) return 1;
          if (b.globalPercent === null) return -1;
          return a.globalPercent - b.globalPercent;
        });
      case 'alphabetical':
        return [...achievements].sort((a, b) => a.displayName.localeCompare(b.displayName));
      default:
        return achievements;
    }
  });

  visibleAchievements = computed(() => {
    return this.sortedAchievements().slice(0, this.visibleAchievementCount());
  });

  hasMoreAchievements = computed(() => {
    return this.visibleAchievementCount() < this.sortedAchievements().length;
  });

  showMoreAchievements(): void {
    this.visibleAchievementCount.update((count) => count + 10);
  }

  onAchievementSortChange(value: AchievementSortOption): void {
    this.achievementSortOption.set(value);
    this.visibleAchievementCount.set(10);
  }

  onHeroImageError(event: Event, appId: number): void {
    const img = event.target as HTMLImageElement;
    const fallbackUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  }

  goBack(): void {
    this.location.back();
  }
}
