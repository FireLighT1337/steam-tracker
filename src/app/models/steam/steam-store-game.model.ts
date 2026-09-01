export interface SteamStoreGame {
  appId: number;
  name: string;
  headerImage: string;
  shortDescription: string;
  isFree: boolean;
  developers: string[];
  publishers: string[];
}
