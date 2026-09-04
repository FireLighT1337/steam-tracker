import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getAchievements } from './steam-service.js';

vi.mock('axios');

describe('getAchievements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('merges player, schema, and global data into a unified achievement list', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('GetPlayerAchievements')) {
        return Promise.resolve({
          data: {
            playerstats: {
              achievements: [
                { apiname: 'ach_1', achieved: 1, unlocktime: 1700000000 },
                { apiname: 'ach_2', achieved: 0, unlocktime: 0 },
              ],
            },
          },
        });
      }
      if (url.includes('GetSchemaForGame')) {
        return Promise.resolve({
          data: {
            game: {
              availableGameStats: {
                achievements: [
                  {
                    name: 'ach_1',
                    displayName: 'First Blood',
                    description: 'Kill someone',
                    icon: 'a.png',
                    icongray: 'a_gray.png',
                  },
                  {
                    name: 'ach_2',
                    displayName: 'Veteran',
                    description: 'Play a lot',
                    icon: 'b.png',
                    icongray: 'b_gray.png',
                  },
                ],
              },
            },
          },
        });
      }
      if (url.includes('GetGlobalAchievementPercentagesForApp')) {
        return Promise.resolve({
          data: {
            achievementpercentages: {
              achievements: [
                { name: 'ach_1', percent: 12.5 },
                { name: 'ach_2', percent: 90.1 },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await getAchievements('76561198000000000', '440');

    expect(result.progressPercent).toBe(50); // 1 of 2 achieved
    expect(result.rarestAchievements).toHaveLength(1);
    expect(result.rarestAchievements[0].apiName).toBe('ach_1'); // only achieved one, and rarer
  });

  it('computes progressPercent as 0 when there are no achievements at all', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('GetPlayerAchievements')) {
        return Promise.resolve({ data: { playerstats: { achievements: [] } } });
      }
      if (url.includes('GetSchemaForGame')) {
        return Promise.resolve({ data: { game: {} } });
      }
      if (url.includes('GetGlobalAchievementPercentagesForApp')) {
        return Promise.resolve({ data: { achievementpercentages: { achievements: [] } } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await getAchievements('76561198000000000', '440');

    expect(result.progressPercent).toBe(0);
    expect(result.rarestAchievements).toEqual([]);
  });

  it('sorts rarestAchievements by lowest global percent first, capped at 3', async () => {
    const achieved = [
      { apiname: 'a', achieved: 1, unlocktime: 1 },
      { apiname: 'b', achieved: 1, unlocktime: 1 },
      { apiname: 'c', achieved: 1, unlocktime: 1 },
      { apiname: 'd', achieved: 1, unlocktime: 1 },
    ];
    const schema = achieved.map((a) => ({
      name: a.apiname,
      displayName: a.apiname,
      description: '',
      icon: '',
      icongray: '',
    }));
    const global = [
      { name: 'a', percent: 50 },
      { name: 'b', percent: 5 },
      { name: 'c', percent: 20 },
      { name: 'd', percent: 1 },
    ];

    axios.get.mockImplementation((url) => {
      if (url.includes('GetPlayerAchievements')) {
        return Promise.resolve({ data: { playerstats: { achievements: achieved } } });
      }
      if (url.includes('GetSchemaForGame')) {
        return Promise.resolve({
          data: { game: { availableGameStats: { achievements: schema } } },
        });
      }
      if (url.includes('GetGlobalAchievementPercentagesForApp')) {
        return Promise.resolve({ data: { achievementpercentages: { achievements: global } } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await getAchievements('76561198000000000', '440');

    expect(result.rarestAchievements.map((a) => a.apiName)).toEqual(['d', 'b', 'c']);
  });

  it('returns an empty player-achievements stub for a game with no stats (400/403 from Steam)', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('GetPlayerAchievements')) {
        const error = new Error('Bad Request');
        error.response = { status: 400 };
        return Promise.reject(error);
      }
      if (url.includes('GetSchemaForGame')) {
        return Promise.resolve({ data: { game: {} } });
      }
      if (url.includes('GetGlobalAchievementPercentagesForApp')) {
        return Promise.resolve({ data: { achievementpercentages: { achievements: [] } } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await getAchievements('76561198000000000', '1422450'); // e.g. Deadlock

    expect(result.progressPercent).toBe(0);
    expect(result.rarestAchievements).toEqual([]);
  });
});

describe('getGlobalAchievementPercentages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns real data when Steam responds successfully', async () => {
    axios.get.mockResolvedValue({
      data: { achievementpercentages: { achievements: [{ name: 'a', percent: 10 }] } },
    });

    const { getGlobalAchievementPercentages } = await import('./steam-service.js');
    const result = await getGlobalAchievementPercentages('440');

    expect(result).toEqual({
      achievementpercentages: { achievements: [{ name: 'a', percent: 10 }] },
    });
  });

  it('returns an empty stub on a 400 response instead of throwing', async () => {
    const error = new Error('Bad Request');
    error.response = { status: 400 };
    axios.get.mockRejectedValue(error);

    const { getGlobalAchievementPercentages } = await import('./steam-service.js');
    const result = await getGlobalAchievementPercentages('1422450'); // e.g. Deadlock

    expect(result).toEqual({ achievementpercentages: { achievements: [] } });
  });

  it('returns an empty stub on a 403 response instead of throwing', async () => {
    const error = new Error('Forbidden');
    error.response = { status: 403 };
    axios.get.mockRejectedValue(error);

    const { getGlobalAchievementPercentages } = await import('./steam-service.js');
    const result = await getGlobalAchievementPercentages('1422450');

    expect(result).toEqual({ achievementpercentages: { achievements: [] } });
  });

  it('rethrows for any other error status', async () => {
    const error = new Error('Server Error');
    error.response = { status: 500 };
    axios.get.mockRejectedValue(error);

    const { getGlobalAchievementPercentages } = await import('./steam-service.js');

    await expect(getGlobalAchievementPercentages('440')).rejects.toThrow('Server Error');
  });
});

describe('getGameSchema', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns real schema data when Steam responds successfully', async () => {
    axios.get.mockResolvedValue({
      data: { game: { availableGameStats: { achievements: [{ name: 'a' }] } } },
    });

    const { getGameSchema } = await import('./steam-service.js');
    const result = await getGameSchema('440');

    expect(result).toEqual({ game: { availableGameStats: { achievements: [{ name: 'a' }] } } });
  });

  it('returns an empty stub on a 400/403 response instead of throwing', async () => {
    const error = new Error('Bad Request');
    error.response = { status: 400 };
    axios.get.mockRejectedValue(error);

    const { getGameSchema } = await import('./steam-service.js');
    const result = await getGameSchema('1422450');

    expect(result).toEqual({ game: {} });
  });
});
