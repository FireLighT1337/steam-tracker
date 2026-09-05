import { Achievement } from './achievement.model';

export interface AchievementSummary {
  progressPercent: number;
  rarestAchievements: Achievement[];
  achievements: Achievement[];
  private?: boolean;
}
