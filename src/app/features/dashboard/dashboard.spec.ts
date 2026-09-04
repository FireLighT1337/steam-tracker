import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from './dashboard';
import { SteamStateService } from '../../core/services/steam-state.service';
import { Game } from '../../models/game.model';
import { UserProfile } from '../../models/user-profile.model';

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

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let component: Dashboard;
  let mockSteamState: {
    profile: ReturnType<typeof signal<UserProfile | null>>;
    games: ReturnType<typeof signal<Game[]>>;
    recentlyPlayed: ReturnType<typeof signal<Game[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    totalGames: ReturnType<typeof vi.fn>;
    totalHours: ReturnType<typeof vi.fn>;
    isLoggedInSignal: ReturnType<typeof signal<boolean>>;
    initialize: ReturnType<typeof vi.fn>;
    loadInitialData: ReturnType<typeof vi.fn>;
  };

  const ownedOnly = makeGame({
    appId: 1,
    name: 'Owned Only',
    isBacklog: true,
    playtimeMinutes: 600,
  });
  const recentOnly = makeGame({
    appId: 2,
    name: 'Recent Only (Family Shared)',
    isCompleted: true,
    playtimeMinutes: 9000,
  });
  const inBoth = makeGame({ appId: 3, name: 'In Both', playtimeMinutes: 1200 });

  function setup(games: Game[], recentlyPlayed: Game[]) {
    TestBed.resetTestingModule();

    mockSteamState = {
      profile: signal<UserProfile | null>(null),
      games: signal(games),
      recentlyPlayed: signal(recentlyPlayed),
      loading: signal(false),
      totalGames: vi.fn(() => games.length),
      totalHours: vi.fn(() => games.reduce((sum, g) => sum + g.playtimeMinutes, 0) / 60),
      isLoggedInSignal: signal(false),
      initialize: vi.fn(),
      loadInitialData: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [{ provide: SteamStateService, useValue: mockSteamState }, provideRouter([])],
    });

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('completedGames / backlogGames counts (regression: must include recentlyPlayed-only games)', () => {
    it('counts a backlog game that only exists in owned games', () => {
      setup([ownedOnly], []);
      expect(component.backlogGames()).toBe(1);
    });

    it('counts a completed game that only exists in recentlyPlayed (Family Sharing case)', () => {
      setup([], [recentOnly]);
      expect(component.completedGames()).toBe(1);
    });

    it('counts correctly across both lists combined', () => {
      setup([ownedOnly, inBoth], [recentOnly]);
      expect(component.backlogGames()).toBe(1);
      expect(component.completedGames()).toBe(1);
    });
  });

  describe('backlogPreview / recentlyCompletedGames', () => {
    it('only includes games flagged as backlog', () => {
      setup([ownedOnly, inBoth], [recentOnly]);
      expect(component.backlogPreview().every((g) => g.isBacklog)).toBe(true);
      expect(component.backlogPreview().length).toBe(1);
    });

    it('caps the preview list at 3 games', () => {
      const many = Array.from({ length: 5 }, (_, i) =>
        makeGame({ appId: 100 + i, name: `Backlog Game ${i}`, isBacklog: true }),
      );
      setup(many, []);
      expect(component.backlogPreview().length).toBe(3);
    });
  });

  describe('topPlayedGames', () => {
    it('returns at most 5 games, sorted by playtime descending, with hours rounded', () => {
      const many = Array.from({ length: 8 }, (_, i) =>
        makeGame({ appId: i, name: `Game ${i}`, playtimeMinutes: (i + 1) * 100 }),
      );
      setup(many, []);

      const top = component.topPlayedGames();
      expect(top.length).toBe(5);
      expect(top[0].name).toBe('Game 7'); // highest playtime
      expect(top[0].hours).toBe(Math.round(800 / 60));
      expect(top[4].name).toBe('Game 3'); // 5th highest
    });
  });

  describe('isLoggedIn', () => {
    it('reflects the underlying steam state signal', () => {
      setup([], []);
      expect(component.isLoggedIn()).toBe(false);

      mockSteamState.isLoggedInSignal.set(true);
      expect(component.isLoggedIn()).toBe(true);
    });
  });

  describe('onImageError', () => {
    it('falls back to header.jpg on first failure', () => {
      setup([], []);
      const img = { src: '' } as HTMLImageElement;
      const event = { target: img } as unknown as Event;

      component.onImageError(event, 42);

      expect(img.src).toBe(
        'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/42/header.jpg',
      );
    });

    it('does not loop if the fallback URL itself is already the current src', () => {
      setup([], []);
      const fallbackUrl =
        'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/42/header.jpg';
      const img = { src: fallbackUrl } as HTMLImageElement;
      const event = { target: img } as unknown as Event;

      component.onImageError(event, 42);

      expect(img.src).toBe(fallbackUrl);
    });
  });
});
