import { Injectable, inject } from '@angular/core';
import { forkJoin, map, switchMap } from 'rxjs';

import { SteamService } from './steam.service';
import { DashboardData } from '../../models/dashboard-data.model';
import { Game } from '../../models/game.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardDataService {
  private readonly steamService = inject(SteamService);

  getDashboardData(steamId: string) {
    return forkJoin({
      profile: this.steamService.getProfile(steamId),
      games: this.steamService.getGames(steamId),
    }).pipe(
      switchMap(({ profile, games }) => {
        const mappedGames: Game[] = games.map((game) => ({
          ...game,
          isCompleted: false,
          isBacklog: false,
        }));

        const recentlyPlayed = [...mappedGames]
          .sort((a, b) => (b.lastPlayed?.getTime() ?? 0) - (a.lastPlayed?.getTime() ?? 0))
          .slice(0, 3);

        const achievementRequests = recentlyPlayed.map((game) =>
          this.steamService.getAchievements(steamId, game.appId).pipe(
            map((achievementSummary) => ({
              appId: game.appId,
              achievementSummary,
            })),
          ),
        );

        return forkJoin(achievementRequests).pipe(
          map((achievementResults) => {
            const gamesWithAchievements = mappedGames.map((game) => {
              const achievement = achievementResults.find((result) => result.appId === game.appId);

              return achievement
                ? {
                    ...game,
                    achievementSummary: achievement.achievementSummary,
                  }
                : game;
            });

            return {
              profile,
              games: gamesWithAchievements,
            } satisfies DashboardData;
          }),
        );
      }),
    );
  }
}
