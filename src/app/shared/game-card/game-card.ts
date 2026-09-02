import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
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

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const fallbackUrl = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${this.game().appId}/header.jpg`;

    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  }
}
