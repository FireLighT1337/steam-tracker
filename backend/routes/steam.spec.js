import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import * as steamService from '../services/steam-service.js';

describe('GET /api/steam/profile/:steamId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the mapped profile when the player exists', async () => {
    vi.spyOn(steamService, 'getProfile').mockResolvedValue({
      player: {
        steamid: '123',
        personaname: 'TestUser',
        avatarfull: 'avatar.jpg',
        profileurl: 'https://steamcommunity.com/id/testuser',
        loccountrycode: 'US',
      },
      steamLevel: 42,
    });

    const res = await request(app).get('/api/steam/profile/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      steamId: '123',
      username: 'TestUser',
      avatar: 'avatar.jpg',
      steamLevel: 42,
      profileUrl: 'https://steamcommunity.com/id/testuser',
      country: 'US',
    });
  });

  it('returns 404 when the player is not found', async () => {
    vi.spyOn(steamService, 'getProfile').mockResolvedValue({
      player: null,
      steamLevel: 0,
    });

    const res = await request(app).get('/api/steam/profile/123');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Steam user not found.' });
  });

  it('returns 500 when the Steam API call throws', async () => {
    vi.spyOn(steamService, 'getProfile').mockRejectedValue(new Error('Steam API down'));

    const res = await request(app).get('/api/steam/profile/123');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch Steam profile.' });
  });
});

describe('GET /api/steam/games/:steamId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps owned games to the expected shape', async () => {
    vi.spyOn(steamService, 'getOwnedGames').mockResolvedValue([
      { appid: 10, name: 'Game A', playtime_forever: 120, rtime_last_played: 1700000000 },
      { appid: 20, name: 'Game B', playtime_forever: 0, rtime_last_played: 0 },
    ]);

    const res = await request(app).get('/api/steam/games/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        appId: 10,
        name: 'Game A',
        headerImage:
          'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/10/capsule_616x353.jpg',
        playtimeMinutes: 120,
        lastPlayed: '2023-11-14T22:13:20.000Z',
      },
      {
        appId: 20,
        name: 'Game B',
        headerImage:
          'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/20/capsule_616x353.jpg',
        playtimeMinutes: 0,
        lastPlayed: null,
      },
    ]);
  });

  it('returns 500 when the Steam API call throws', async () => {
    vi.spyOn(steamService, 'getOwnedGames').mockRejectedValue(new Error('down'));

    const res = await request(app).get('/api/steam/games/123');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch Steam games.' });
  });
});

describe('GET /api/steam/recently-played/:steamId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('maps recently played games including playtimeTwoWeeks', async () => {
    vi.spyOn(steamService, 'getRecentlyPlayedGames').mockResolvedValue([
      { appid: 30, name: 'Game C', playtime_forever: 500, playtime_2weeks: 60 },
    ]);

    const res = await request(app).get('/api/steam/recently-played/123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        appId: 30,
        name: 'Game C',
        headerImage:
          'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/30/capsule_616x353.jpg',
        playtimeMinutes: 500,
        playtimeTwoWeeks: 60,
        lastPlayed: null,
      },
    ]);
  });

  it('returns 500 when the Steam API call throws', async () => {
    vi.spyOn(steamService, 'getRecentlyPlayedGames').mockRejectedValue(new Error('down'));

    const res = await request(app).get('/api/steam/recently-played/123');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch recently played games.' });
  });
});

describe('GET /api/steam/achievements/:steamId/:appId', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns achievement data from the service as-is', async () => {
    const mockData = {
      progressPercent: 42,
      rarestAchievements: [{ apiName: 'ach_1', displayName: 'First', globalPercent: 1.2 }],
      achievements: [{ apiName: 'ach_1', displayName: 'First', achieved: true }],
    };
    vi.spyOn(steamService, 'getAchievements').mockResolvedValue(mockData);

    const res = await request(app).get('/api/steam/achievements/123/456');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockData);
  });

  it('returns 500 when the Steam API call throws', async () => {
    vi.spyOn(steamService, 'getAchievements').mockRejectedValue(new Error('down'));

    const res = await request(app).get('/api/steam/achievements/123/456');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch Steam achievements.' });
  });
});
