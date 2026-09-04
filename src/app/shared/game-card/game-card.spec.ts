import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameCard } from './game-card';
import { SteamStateService } from '../../core/services/steam-state.service';
import { Game } from '../../models/game.model';

const mockGame: Game = {
  appId: 12345,
  name: 'Test Game',
  headerImage: 'https://example.com/custom-header.jpg',
  playtimeMinutes: 120,
  playtimeTwoWeeks: 30,
  lastPlayed: null,
  isCompleted: false,
  isBacklog: false,
};

const mockSteamState = {
  toggleBacklog: vi.fn(),
  toggleCompleted: vi.fn(),
};

describe('GameCard', () => {
  let fixture: ComponentFixture<GameCard>;
  let component: GameCard;

  beforeEach(async () => {
    mockSteamState.toggleBacklog.mockClear();
    mockSteamState.toggleCompleted.mockClear();

    await TestBed.configureTestingModule({
      imports: [GameCard],
      providers: [provideRouter([]), { provide: SteamStateService, useValue: mockSteamState }],
    }).compileComponents();

    fixture = TestBed.createComponent(GameCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('game', mockGame);
    fixture.detectChanges();
  });

  describe('image fallback chain', () => {
    it("starts with the game's own headerImage", () => {
      expect(component.currentImageSrc()).toBe(mockGame.headerImage);
    });

    it('falls back to header.jpg after the first image fails', () => {
      component.onImageError();

      expect(component.currentImageSrc()).toBe(
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${mockGame.appId}/header.jpg`,
      );
      expect(component.imageFailed()).toBe(false);
    });

    it('falls back to capsule_616x353.jpg after the second image fails', () => {
      component.onImageError();
      component.onImageError();

      expect(component.currentImageSrc()).toBe(
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${mockGame.appId}/capsule_616x353.jpg`,
      );
    });

    it('marks the image as failed once every fallback is exhausted', () => {
      component.onImageError();
      component.onImageError();
      component.onImageError();

      expect(component.imageFailed()).toBe(true);
    });

    it('skips a fallback URL that duplicates an already-listed source', () => {
      const dedupedGame: Game = {
        ...mockGame,
        headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${mockGame.appId}/header.jpg`,
      };
      fixture.componentRef.setInput('game', dedupedGame);
      fixture.detectChanges();

      component.onImageError();

      // headerImage was identical to the header.jpg fallback, so the Set
      // dedup should skip straight to capsule on the very first failure.
      expect(component.currentImageSrc()).toBe(
        `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${mockGame.appId}/capsule_616x353.jpg`,
      );
    });
  });

  describe('status action buttons', () => {
    it('toggles backlog and stops the click from bubbling to the card link', () => {
      const event = new MouseEvent('click');
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      component.toggleBacklog(event);

      expect(mockSteamState.toggleBacklog).toHaveBeenCalledWith(mockGame.appId);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('toggles completed and stops the click from bubbling to the card link', () => {
      const event = new MouseEvent('click');
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');

      component.toggleCompleted(event);

      expect(mockSteamState.toggleCompleted).toHaveBeenCalledWith(mockGame.appId);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });
});
