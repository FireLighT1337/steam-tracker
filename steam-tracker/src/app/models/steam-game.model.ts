export interface SteamGame {
  appId: number;
  name: string;
  headerImage: string;

  playtimeMinutes: number;
  achievementPercentage: number;

  lastPlayed: Date;
}
