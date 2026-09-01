import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { UserProfile } from '../../models/user-profile.model';
import { AchievementSummary } from '../../models/achievement-summary.model';
import { SteamGame } from '../../models/steam-game.model';

@Injectable({
  providedIn: 'root',
})
export class SteamService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api/steam';

  getProfile(steamId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile/${steamId}`);
  }

  getGames(steamId: string): Observable<SteamGame[]> {
    return this.http.get<SteamGame[]>(`${this.apiUrl}/games/${steamId}`);
  }

  getAchievements(steamId: string, appId: number): Observable<AchievementSummary> {
    return this.http.get<AchievementSummary>(`${this.apiUrl}/achievements/${steamId}/${appId}`);
  }

  getRecentlyPlayed(steamId: string): Observable<SteamGame[]> {
    return this.http.get<SteamGame[]>(`${this.apiUrl}/recently-played/${steamId}`);
  }
}
