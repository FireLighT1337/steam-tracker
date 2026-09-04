import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SteamStateService } from './steam-state.service';
import { SteamService } from './steam.service';
import { Game } from '../../models/game.model';

const ownedGame: Game = {
  appId: 1,
  name: 'Owned Only Game',
  headerImage: 'owned.jpg',
  playtimeMinutes: 60,
  lastPlayed: null,
  isCompleted: false,
  isBacklog: false,
};

const recentOnlyGame: Game = {
  appId: 2,
  name: 'Recent Only Game (e.g. Family Shared)',
  headerImage: 'recent.jpg',
  playtimeMinutes: 30,
  playtimeTwoWeeks: 30,
  lastPlayed: null,
  isCompleted: false,
  isBacklog: false,
};

describe('SteamStateService', () => {
  let service: SteamStateService;
  let mockSteamService: {
    getAchievements: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSteamService = {
      getAchievements: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [SteamStateService, { provide: SteamService, useValue: mockSteamService }],
    });

    service = TestBed.inject(SteamStateService);
  });

  describe('toggleBacklog / toggleCompleted', () => {
    it('toggles a game that exists only in the owned games list', () => {
      service.games.set([ownedGame]);
      service.recentlyPlayed.set([]);

      service.toggleBacklog(1);

      expect(service.games()[0].isBacklog).toBe(true);
    });

    it('toggles a game that exists only in the recently-played list (e.g. Family Sharing)', () => {
      service.games.set([]);
      service.recentlyPlayed.set([recentOnlyGame]);

      service.toggleBacklog(2);

      expect(service.recentlyPlayed()[0].isBacklog).toBe(true);
    });

    it('does not throw or infinite-loop when toggling a game absent from both lists', () => {
      service.games.set([ownedGame]);
      service.recentlyPlayed.set([]);

      expect(() => service.toggleCompleted(999)).not.toThrow();
      // Neither list should have been mutated for a non-matching appId
      expect(service.games()[0].isCompleted).toBe(false);
    });
  });

  describe('loadAchievementsForGames', () => {
    it('does not call the API for a game whose achievements are already loaded', () => {
      const gameWithAchievements: Game = {
        ...ownedGame,
        achievementSummary: { progressPercent: 50, rarestAchievements: [], achievements: [] },
      };
      service.games.set([gameWithAchievements]);

      service.loadAchievementsForGames([ownedGame.appId]);

      expect(mockSteamService.getAchievements).not.toHaveBeenCalled();
    });

    it('reuses achievement data already loaded via recentlyPlayed instead of calling the API again', () => {
      const recentWithAchievements: Game = {
        ...recentOnlyGame,
        achievementSummary: { progressPercent: 75, rarestAchievements: [], achievements: [] },
      };
      service.games.set([{ ...ownedGame, appId: 2 }]);
      service.recentlyPlayed.set([recentWithAchievements]);

      service.loadAchievementsForGames([2]);

      expect(mockSteamService.getAchievements).not.toHaveBeenCalled();
      expect(service.games().find((g) => g.appId === 2)?.achievementSummary?.progressPercent).toBe(
        75,
      );
    });

    it('does not mutate the games array when the matching game is absent from it (regression: infinite loop bug)', () => {
      const recentWithAchievements: Game = {
        ...recentOnlyGame,
        achievementSummary: { progressPercent: 40, rarestAchievements: [], achievements: [] },
      };
      service.games.set([ownedGame]); // note: appId 2 is NOT in games()
      service.recentlyPlayed.set([recentWithAchievements]);

      const gamesArrayBefore = service.games();

      service.loadAchievementsForGames([2]);

      // The array reference must be unchanged — a new reference here is exactly
      // what caused the effect -> update -> effect infinite loop previously.
      expect(service.games()).toBe(gamesArrayBefore);
    });

    it('fetches achievements from the API for a game with no cached data anywhere', () => {
      mockSteamService.getAchievements.mockReturnValue(
        of({ progressPercent: 10, rarestAchievements: [], achievements: [] }),
      );
      service.games.set([ownedGame]);
      service.recentlyPlayed.set([]);

      service.loadAchievementsForGames([ownedGame.appId]);

      expect(mockSteamService.getAchievements).toHaveBeenCalledWith(
        expect.any(String),
        ownedGame.appId,
      );
    });
  });
});
