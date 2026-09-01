export interface Achievement {
  apiName: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  iconGray: string | null;
  achieved: boolean;
  unlockTime: string | null;
  globalPercent: number | null;
}
