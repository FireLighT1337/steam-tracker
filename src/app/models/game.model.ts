import { SteamGame } from './steam-game.model';

export interface Game extends SteamGame {
  isCompleted: boolean;
  isBacklog: boolean;
}
