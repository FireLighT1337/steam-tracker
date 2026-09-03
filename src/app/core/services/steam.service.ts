import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { UserProfile } from '../../models/user-profile.model';
import { AchievementSummary } from '../../models/achievement-summary.model';
import { SteamGame } from '../../models/steam-game.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SteamService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  getProfile(steamId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile/${steamId}`);
  }

  getGames(steamId: string): Observable<SteamGame[]> {
    return this.http.get<SteamGame[]>(`${this.apiUrl}/games/${steamId}`);
  }

  getGame(steamId: string, appId: number): Observable<SteamGame | undefined> {
    return this.getGames(steamId).pipe(map((games) => games.find((game) => game.appId === appId)));
  }

  getAchievements(steamId: string, appId: number): Observable<AchievementSummary> {
    return this.http.get<AchievementSummary>(`${this.apiUrl}/achievements/${steamId}/${appId}`);
  }

  getRecentlyPlayed(steamId: string): Observable<SteamGame[]> {
    return this.http.get<SteamGame[]>(`${this.apiUrl}/recently-played/${steamId}`);
  }

  getCurrentUser(): Observable<{ steamId: string | null }> {
    return this.http.get<{ steamId: string | null }>(`${environment.authBaseUrl}/auth/me`, {
      withCredentials: true,
    });
  }

  logout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${environment.authBaseUrl}/auth/logout`,
      {},
      { withCredentials: true },
    );
  }
}
