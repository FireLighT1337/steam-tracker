import { Game } from './game.model';
import { UserProfile } from './user-profile.model';

export interface DashboardData {
  profile: UserProfile;
  games: Game[];
}
