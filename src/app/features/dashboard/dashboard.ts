import { Component, computed, inject } from '@angular/core';
import { StatCard } from '../../shared/stat-card/stat-card';
import { GameCard } from '../../shared/game-card/game-card';
import { DecimalPipe } from '@angular/common';
import { SteamStateService } from '../../core/services/steam-state.service';
import { Game } from '../../models/game.model';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface Stat {
  icon: string;
  title: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [StatCard, GameCard, DecimalPipe, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly steamState = inject(SteamStateService);

  constructor() {
    this.steamState.loadInitialData();
  }

  isLoggedIn = this.steamState.isLoggedInSignal;
  loading = this.steamState.loading;

  profile = this.steamState.profile;
  games = this.steamState.games;
  recentlyPlayed = this.steamState.recentlyPlayed;
  gamesOwned = this.steamState.totalGames;
  hoursPlayed = this.steamState.totalHours;

  private readonly allTrackedGames = computed(() => {
    const map = new Map<number, Game>();

    for (const game of this.games()) {
      map.set(game.appId, game);
    }

    for (const game of this.recentlyPlayed()) {
      map.set(game.appId, { ...map.get(game.appId), ...game });
    }

    return Array.from(map.values());
  });

  completedGames = computed(() => this.allTrackedGames().filter((game) => game.isCompleted).length);

  backlogGames = computed(() => this.allTrackedGames().filter((game) => game.isBacklog).length);

  backlogPreview = computed(() =>
    this.allTrackedGames()
      .filter((game) => game.isBacklog)
      .slice(0, 3),
  );

  recentlyCompletedGames = computed(() =>
    this.allTrackedGames()
      .filter((game) => game.isCompleted)
      .slice(0, 3),
  );

  topPlayedGames = computed(() =>
    [...this.games()]
      .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes)
      .slice(0, 5)
      .map((game) => ({ name: game.name, hours: Math.round(game.playtimeMinutes / 60) })),
  );

  stats = computed<Stat[]>(() => [
    {
      icon: 'bi-controller',
      title: 'Owned Games',
      value: this.gamesOwned(),
    },
    {
      icon: 'bi-check-circle',
      title: 'Marked Complete',
      value: this.completedGames(),
    },
    {
      icon: 'bi-bookmark',
      title: 'Backlog',
      value: this.backlogGames(),
    },
    {
      icon: 'bi-clock-history',
      title: 'Hours Played',
      value: Math.round(this.hoursPlayed()),
    },
  ]);

  recentlyPlayedGames = computed(() => this.recentlyPlayed());

  onImageError(event: Event, appId: number): void {
    const img = event.target as HTMLImageElement;
    const fallbackUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;

    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  }
}
