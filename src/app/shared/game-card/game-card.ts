import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { Game } from '../../models/game.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game-card',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
})
export class GameCard {
  game = input.required<Game>();
  achievementsLoading = input<boolean>(false);
  showTotalPlaytimeOnly = input<boolean>(false);

  private readonly imageSources = computed(() => {
    const appId = this.game().appId;
    const base = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appId}`;

    return Array.from(
      new Set([this.game().headerImage, `${base}/header.jpg`, `${base}/capsule_616x353.jpg`]),
    );
  });

  private readonly imageAttemptIndex = signal(0);
  imageFailed = signal(false);

  currentImageSrc = computed(() => this.imageSources()[this.imageAttemptIndex()]);

  onImageError(): void {
    const next = this.imageAttemptIndex() + 1;

    if (next < this.imageSources().length) {
      this.imageAttemptIndex.set(next);
    } else {
      this.imageFailed.set(true);
    }
  }
}
