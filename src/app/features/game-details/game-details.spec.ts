import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameDetails } from './game-details';
import { SteamStateService } from '../../core/services/steam-state.service';
import { SteamService } from '../../core/services/steam.service';
import { Game } from '../../models/game.model';

function makeGame(overrides: Partial<Game>): Game {
  return {
    appId: 1,
    name: 'Game',
    headerImage: 'img.jpg',
    playtimeMinutes: 0,
    lastPlayed: null,
    isCompleted: false,
    isBacklog: false,
    ...overrides,
  };
}

describe('GameDetails', () => {
  let fixture: ComponentFixture<GameDetails>;
  let component: GameDetails;
  let mockSteamState: {
    games: ReturnType<typeof vi.fn>;
    recentlyPlayed: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    steamId: string;
    toggleBacklog: ReturnType<typeof vi.fn>;
    toggleCompleted: ReturnType<typeof vi.fn>;
  };
  let mockSteamService: { getAchievements: ReturnType<typeof vi.fn> };
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function setup(games: Game[], recentlyPlayed: Game[], appId: number) {
    TestBed.resetTestingModule();

    paramMap$ = new BehaviorSubject(convertToParamMap({ appId: String(appId) }));

    mockSteamState = {
      games: vi.fn(() => games),
      recentlyPlayed: vi.fn(() => recentlyPlayed),
      loading: vi.fn(() => false),
      steamId: 'mock-steam-id',
      toggleBacklog: vi.fn(),
      toggleCompleted: vi.fn(),
    };

    mockSteamService = {
      getAchievements: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      imports: [GameDetails],
      providers: [
        { provide: SteamStateService, useValue: mockSteamState },
        { provide: SteamService, useValue: mockSteamService },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
      ],
    });

    fixture = TestBed.createComponent(GameDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('baseGame merge (owned games vs recently played)', () => {
    it('uses owned-games data when the game exists only there', () => {
      const owned = makeGame({ appId: 1, name: 'Owned Only' });
      setup([owned], [], 1);

      expect(component.game()?.name).toBe('Owned Only');
    });

    it('uses recently-played data when the game exists only there (Family Sharing case)', () => {
      const shared = makeGame({ appId: 5, name: 'The Witcher 3', playtimeTwoWeeks: 108 });
      setup([], [shared], 5);

      expect(component.game()?.name).toBe('The Witcher 3');
      expect(component.game()?.playtimeTwoWeeks).toBe(108);
    });

    it('prefers playtimeTwoWeeks from recentlyPlayed even when the base record comes from owned games (regression: Overwatch bug)', () => {
      const owned = makeGame({ appId: 1, name: 'Overwatch', playtimeTwoWeeks: undefined });
      const recent = makeGame({ appId: 1, name: 'Overwatch', playtimeTwoWeeks: 1500 });
      setup([owned], [recent], 1);

      expect(component.game()?.playtimeTwoWeeks).toBe(1500);
    });

    it('returns undefined when the game exists in neither list', () => {
      setup([makeGame({ appId: 1 })], [], 999);

      expect(component.game()).toBeUndefined();
    });
  });

  describe('achievement data', () => {
    it('overrides the base achievementSummary with freshly fetched data', () => {
      const owned = makeGame({
        appId: 1,
        achievementSummary: { progressPercent: 5, rarestAchievements: [], achievements: [] },
      });
      const fetched = { progressPercent: 42, rarestAchievements: [], achievements: [] };
      mockSteamService = { getAchievements: vi.fn(() => of(fetched)) };

      TestBed.resetTestingModule();
      paramMap$ = new BehaviorSubject(convertToParamMap({ appId: '1' }));
      mockSteamState = {
        games: vi.fn(() => [owned]),
        recentlyPlayed: vi.fn(() => []),
        loading: vi.fn(() => false),
        steamId: 'mock-steam-id',
        toggleBacklog: vi.fn(),
        toggleCompleted: vi.fn(),
      };
      TestBed.configureTestingModule({
        imports: [GameDetails],
        providers: [
          { provide: SteamStateService, useValue: mockSteamState },
          { provide: SteamService, useValue: mockSteamService },
          { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
        ],
      });
      fixture = TestBed.createComponent(GameDetails);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.game()?.achievementSummary?.progressPercent).toBe(42);
    });
  });

  describe('backlog / completed actions', () => {
    it('delegates toggleBacklog to the service with the current appId', () => {
      setup([makeGame({ appId: 7 })], [], 7);

      component.toggleBacklog();

      expect(mockSteamState.toggleBacklog).toHaveBeenCalledWith(7);
    });

    it('delegates toggleCompleted to the service with the current appId', () => {
      setup([makeGame({ appId: 7 })], [], 7);

      component.toggleCompleted();

      expect(mockSteamState.toggleCompleted).toHaveBeenCalledWith(7);
    });
  });

  describe('visible achievements pagination', () => {
    it('shows the first 10 achievements by default and reveals 10 more on demand', () => {
      const achievements = Array.from({ length: 25 }, (_, i) => ({
        apiName: `ach_${i}`,
        displayName: `Achievement ${i}`,
        description: null,
        icon: null,
        iconGray: null,
        achieved: false,
        unlockTime: null,
        globalPercent: null,
      }));
      const owned = makeGame({
        appId: 1,
        achievementSummary: { progressPercent: 0, rarestAchievements: [], achievements },
      });
      setup([owned], [], 1);

      expect(component.visibleAchievements().length).toBe(10);
      expect(component.hasMoreAchievements()).toBe(true);

      component.showMoreAchievements();

      expect(component.visibleAchievements().length).toBe(20);

      component.showMoreAchievements();

      expect(component.visibleAchievements().length).toBe(25);
      expect(component.hasMoreAchievements()).toBe(false);
    });
  });
});
