import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Game } from '../../models/game.model';

@Component({
  selector: 'app-game-card',
  imports: [DecimalPipe],
  templateUrl: './game-card.html',
  styleUrl: './game-card.css',
})
export class GameCard {
  game = input.required<Game>();
}
