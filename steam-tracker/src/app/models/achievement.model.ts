export interface Achievement {
  name: string;
  description: string;
  icon: string;

  isUnlocked: boolean;
  unlockPercentage: number;
}
