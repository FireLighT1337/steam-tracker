import { AchievementSummary } from './achievement-summary.model';

export interface SteamGame {
  appId: number;
  name: string;
  headerImage: string;
  playtimeMinutes: number;
  lastPlayed: Date | null;
  achievementSummary?: AchievementSummary;
}
