import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Library } from './library';
import { SteamStateService } from '../../core/services/steam-state.service';
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

describe('Library', () => {
  let fixture: ComponentFixture<Library>;
  let component: Library;
  let mockSteamState: {
    games: ReturnType<typeof vi.fn>;
    recentlyPlayed: ReturnType<typeof vi.fn>;
    loading: ReturnType<typeof vi.fn>;
    loadingAchievementIds: ReturnType<typeof vi.fn>;
    loadAchievementsForGames: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };

  const ownedGames = [
    makeGame({ appId: 1, name: 'Balatro', playtimeMinutes: 1200, isBacklog: true }),
    makeGame({ appId: 2, name: 'Age of Empires II', playtimeMinutes: 1920, isCompleted: true }),
    makeGame({ appId: 3, name: 'Assetto Corsa Competizione', playtimeMinutes: 240 }),
  ];

  function setup(
    statusFilter: 'all' | 'backlog' | 'completed' = 'all',
    queryParams: Record<string, string> = {},
  ) {
    TestBed.resetTestingModule();
    mockSteamState = {
      games: vi.fn(() => ownedGames),
      recentlyPlayed: vi.fn(() => []),
      loading: vi.fn(() => false),
      loadingAchievementIds: vi.fn(() => new Set<number>()),
      loadAchievementsForGames: vi.fn(),
    };

    mockRouter = { navigate: vi.fn(() => Promise.resolve(true)) };

    TestBed.configureTestingModule({
      imports: [Library],
      providers: [
        { provide: SteamStateService, useValue: mockSteamState },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ statusFilter }),
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(Library);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => setup());

  describe('status filtering', () => {
    it('shows all games by default', () => {
      expect(component.statusFilteredGames().length).toBe(3);
    });

    it('shows only backlog games when statusFilter is backlog', () => {
      setup('backlog');
      expect(component.statusFilteredGames()).toEqual([ownedGames[0]]);
    });

    it('shows only completed games when statusFilter is completed', () => {
      setup('completed');
      expect(component.statusFilteredGames()).toEqual([ownedGames[1]]);
    });
  });

  describe('search filtering', () => {
    it('filters case-insensitively by name substring', () => {
      component.onSearchChange('balatro');
      expect(component.filteredGames().map((g) => g.name)).toEqual(['Balatro']);
    });

    it('returns everything when the search term is empty', () => {
      component.onSearchChange('');
      expect(component.filteredGames().length).toBe(3);
    });

    it('returns nothing when nothing matches', () => {
      component.onSearchChange('nonexistent game title');
      expect(component.filteredGames().length).toBe(0);
    });
  });

  describe('sorting', () => {
    it('sorts by name ascending by default', () => {
      expect(component.sortedGames().map((g) => g.name)).toEqual([
        'Age of Empires II',
        'Assetto Corsa Competizione',
        'Balatro',
      ]);
    });

    it('sorts by playtime descending', () => {
      component.onSortChange('playtime-desc');
      expect(component.sortedGames().map((g) => g.appId)).toEqual([2, 1, 3]);
    });

    it('sorts by playtime ascending', () => {
      component.onSortChange('playtime-asc');
      expect(component.sortedGames().map((g) => g.appId)).toEqual([3, 1, 2]);
    });
  });

  describe('pagination', () => {
    it('restores the page number from the initial URL query params', () => {
      setup('all', { page: '2' });
      expect(component.currentPage()).toBe(2);
    });

    it('resets to page 1 when the search term changes after initial load', () => {
      component.goToPage(2);
      component.onSearchChange('a');
      TestBed.flushEffects();
      expect(component.currentPage()).toBe(1);
    });

    it('does not go below page 1', () => {
      component.prevPage();
      expect(component.currentPage()).toBe(1);
    });

    it('does not go past the last page', () => {
      component.nextPage(); // only 3 games / pageSize 20 → totalPages is 1
      expect(component.currentPage()).toBe(1);
    });
  });

  describe('setStatusFilter', () => {
    it('navigates to /library for "all"', () => {
      component.setStatusFilter('all');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/library']);
    });

    it('navigates to /backlog for "backlog"', () => {
      component.setStatusFilter('backlog');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/backlog']);
    });
  });
});
