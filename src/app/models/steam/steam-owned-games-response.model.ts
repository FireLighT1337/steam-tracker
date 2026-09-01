import { SteamOwnedGame } from './steam-owned-game.model';

export interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamOwnedGame[];
  };
}
