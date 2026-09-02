import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { SteamStateService } from '../../core/services/steam-state.service';
import { SteamService } from '../../core/services/steam.service';
import { Game } from '../../models/game.model';

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

  toggleBacklog(): void {
    this.steamState.toggleBacklog(this.appId());
  }

  toggleCompleted(): void {
    this.steamState.toggleCompleted(this.appId());
  }

  visibleAchievementCount = signal(10);

  visibleAchievements = computed(() => {
    const achievements = this.game()?.achievementSummary?.achievements ?? [];
    return achievements.slice(0, this.visibleAchievementCount());
  });

  hasMoreAchievements = computed(() => {
    const total = this.game()?.achievementSummary?.achievements?.length ?? 0;
    return this.visibleAchievementCount() < total;
  });

  showMoreAchievements(): void {
    this.visibleAchievementCount.update((count) => count + 10);
  }

  onHeroImageError(event: Event, appId: number): void {
    const img = event.target as HTMLImageElement;
    const fallbackUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  }
}
