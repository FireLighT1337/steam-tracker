import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SteamService } from './steam.service';
import { environment } from '../../../environments/environment';
import { SteamGame } from '../../models/steam-game.model';

describe('SteamService', () => {
  let service: SteamService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SteamService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SteamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProfile', () => {
    it('GETs the profile endpoint for the given steamId', () => {
      service.getProfile('123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/profile/123`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('getGames', () => {
    it('GETs the owned games endpoint for the given steamId', () => {
      service.getGames('123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/games/123`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getGame', () => {
    it('resolves to the game matching the given appId', () => {
      const games: SteamGame[] = [
        { appId: 1, name: 'A', headerImage: 'a.jpg', playtimeMinutes: 10, lastPlayed: null },
        { appId: 2, name: 'B', headerImage: 'b.jpg', playtimeMinutes: 20, lastPlayed: null },
      ];

      let result: SteamGame | undefined;
      service.getGame('123', 2).subscribe((game) => (result = game));

      httpMock.expectOne(`${environment.apiUrl}/games/123`).flush(games);

      expect(result?.name).toBe('B');
    });

    it('resolves to undefined when no game matches the appId', () => {
      let result: SteamGame | undefined;
      service.getGame('123', 999).subscribe((game) => (result = game));

      httpMock.expectOne(`${environment.apiUrl}/games/123`).flush([]);

      expect(result).toBeUndefined();
    });
  });

  describe('getAchievements', () => {
    it('GETs the achievements endpoint for the given steamId and appId', () => {
      service.getAchievements('123', 456).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/achievements/123/456`);
      expect(req.request.method).toBe('GET');
      req.flush({ progressPercent: 0, rarestAchievements: [], achievements: [] });
    });
  });

  describe('getRecentlyPlayed', () => {
    it('GETs the recently-played endpoint for the given steamId', () => {
      service.getRecentlyPlayed('123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/recently-played/123`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('getCurrentUser', () => {
    it('GETs the auth/me endpoint with credentials included', () => {
      service.getCurrentUser().subscribe();

      const req = httpMock.expectOne(`${environment.authBaseUrl}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ steamId: null });
    });
  });

  describe('logout', () => {
    it('POSTs to the auth/logout endpoint with credentials included', () => {
      service.logout().subscribe();

      const req = httpMock.expectOne(`${environment.authBaseUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ success: true });
    });
  });
});
