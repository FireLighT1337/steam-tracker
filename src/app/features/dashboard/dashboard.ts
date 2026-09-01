import { Component, computed, inject, signal } from '@angular/core';
import { StatCard } from '../../shared/stat-card/stat-card';
import { GameCard } from '../../shared/game-card/game-card';
import { DecimalPipe } from '@angular/common';
import { SteamService } from '../../core/services/steam.service';
import { UserProfile } from '../../models/user-profile.model';
import { Game } from '../../models/game.model';

interface Stat {
  icon: string;
  title: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [StatCard, GameCard, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly steamService = inject(SteamService);
  private readonly steamId = '76561198127309108';
  // private readonly steamId = '76561198201368665';

  private loadProfile(): void {
    this.steamService.getProfile(this.steamId).subscribe({
      next: (profile) => {
        this.profile.set(profile);
      },
      error: (error) => {
        console.error('Failed to load Steam profile:', error);
      },
    });
  }

  private loadAchievements(): void {
    this.recentlyPlayed().forEach((game) => {
      this.steamService.getAchievements(this.steamId, game.appId).subscribe({
        next: (achievementSummary) => {
          this.recentlyPlayed.update((games) =>
            games.map((currentGame) =>
              currentGame.appId === game.appId
                ? { ...currentGame, achievementSummary }
                : currentGame,
            ),
          );
        },
        error: (error) => {
          console.error(`Failed to load achievements for ${game.name}:`, error);
        },
      });
    });
  }

  private loadGames(): void {
    this.steamService.getGames(this.steamId).subscribe({
      next: (games) => {
        this.games.set(
          games.map((game) => ({
            ...game,
            lastPlayed: game.lastPlayed ? new Date(game.lastPlayed) : null,
            isCompleted: false,
            isBacklog: false,
          })),
        );
      },
      error: (error) => {
        console.error('Failed to load Steam games:', error);
      },
    });
  }

  private loadRecentlyPlayedGames(): void {
    this.steamService.getRecentlyPlayed(this.steamId).subscribe({
      next: (games) => {
        this.recentlyPlayed.set(
          games.map((game) => ({
            ...game,
            isCompleted: false,
            isBacklog: false,
            lastPlayed: null,
          })),
        );

        this.loadAchievements();
      },
      error: (error) => {
        console.error('Failed to load recently played games:', error);
      },
    });
  }

  constructor() {
    this.loadProfile();
    this.loadGames();
    this.loadRecentlyPlayedGames();
  }

  profile = signal<UserProfile | null>(null);

  games = signal<Game[]>([]);

  recentlyPlayed = signal<Game[]>([]);

  gamesOwned = computed(() => this.games().length);

  completedGames = computed(() => this.games().filter((game) => game.isCompleted).length);

  backlogGames = computed(() => this.games().filter((game) => game.isBacklog).length);

  hoursPlayed = computed(() =>
    Math.round(this.games().reduce((total, game) => total + game.playtimeMinutes, 0) / 60),
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
      value: this.hoursPlayed(),
    },
  ]);

  recentlyPlayedGames = computed(() => this.recentlyPlayed());

  backlogPreview = computed(() =>
    this.games()
      .filter((game) => game.isBacklog)
      .slice(0, 3),
  );

  recentlyCompletedGames = computed(() =>
    this.games()
      .filter((game) => game.isCompleted)
      .slice(0, 3),
  );
}
