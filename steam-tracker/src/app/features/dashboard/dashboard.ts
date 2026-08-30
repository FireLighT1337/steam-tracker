import { Component, computed, inject, signal } from '@angular/core';
import { StatCard } from '../../shared/stat-card/stat-card';
import { GameCard } from '../../shared/game-card/game-card';
import { DashboardDataService } from '../../core/services/dashboard-data.service';
import { DashboardData } from '../../models/dashboard-data.model';
import { DecimalPipe } from '@angular/common';

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
  // Placeholder values for now
  private readonly dashboardDataService = inject(DashboardDataService);

  dashboardData = signal<DashboardData>(this.dashboardDataService.getDashboardData());

  profile = computed(() => this.dashboardData().profile);

  games = computed(() => this.dashboardData().games);

  gamesOwned = computed(() => this.games().length);

  completedGames = computed(() => this.games().filter((game) => game.isCompleted).length);

  backlogGames = computed(() => this.games().filter((game) => game.isBacklog).length);

  hoursPlayed = computed(() =>
    Math.round(this.games().reduce((total, game) => total + game.playtimeMinutes, 0) / 60),
  );

  stats = computed<Stat[]>(() => [
    {
      icon: 'bi-controller',
      title: 'Games',
      value: this.gamesOwned(),
    },
    {
      icon: 'bi-check-circle',
      title: 'Completed',
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

  recentlyPlayedGames = computed(() =>
    [...this.games()].sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime()).slice(0, 3),
  );

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
