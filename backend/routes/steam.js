import express from 'express';
import * as steamService from '../services/steam-service.js';

const router = express.Router();

router.get('/profile/:steamId', async (req, res) => {
  const { steamId } = req.params;

  try {
    const { player, steamLevel } = await steamService.getProfile(steamId);

    if (!player) {
      return res.status(404).json({
        error: 'Steam user not found.',
      });
    }

    res.json({
      steamId: player.steamid,
      username: player.personaname,
      avatar: player.avatarfull,
      steamLevel,
      profileUrl: player.profileurl,
      country: player.loccountrycode ?? null,
    });
  } catch (error) {
    console.error(
      'Steam profile error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch Steam profile.',
    });
  }
});

router.get('/games/:steamId', async (req, res) => {
  const { steamId } = req.params;

  try {
    const games = await steamService.getOwnedGames(steamId);

    const mappedGames = games.map((game) => ({
      appId: game.appid,
      name: game.name,
      headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
      playtimeMinutes: game.playtime_forever,
      lastPlayed: game.rtime_last_played ? new Date(game.rtime_last_played * 1000) : null,
    }));

    res.json(mappedGames);
  } catch (error) {
    console.error(
      'Steam games error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch Steam games.',
    });
  }
});

router.get('/store/:appId', async (req, res) => {
  const { appId } = req.params;

  try {
    const game = await steamService.getStoreGame(appId);

    if (!game) {
      return res.status(404).json({
        error: 'Game store data not found.',
      });
    }

    res.json(game);
  } catch (error) {
    console.error(
      'Steam store error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch Steam store data.',
    });
  }
});

router.get('/achievements/schema/:appId', async (req, res) => {
  const { appId } = req.params;

  try {
    const data = await steamService.getGameSchema(appId);

    res.json(data);
  } catch (error) {
    console.error(
      'Steam schema error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch achievement schema.',
    });
  }
});

router.get('/achievements/global/:appId', async (req, res) => {
  const { appId } = req.params;

  try {
    const data = await steamService.getGlobalAchievementPercentages(appId);

    res.json(data);
  } catch (error) {
    console.error(
      'Steam global achievement error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch global achievement percentages.',
    });
  }
});

router.get('/achievements/:steamId/:appId', async (req, res) => {
  const { steamId, appId } = req.params;

  try {
    const achievements = await steamService.getAchievements(steamId, appId);

    res.json(achievements);
  } catch (error) {
    console.error(
      'Steam achievement error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch Steam achievements.',
    });
  }
});

router.get('/recently-played/:steamId', async (req, res) => {
  const { steamId } = req.params;

  try {
    const games = await steamService.getRecentlyPlayedGames(steamId);

    res.json(
      games.map((game) => ({
        appId: game.appid,
        name: game.name,
        headerImage: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`,
        playtimeMinutes: game.playtime_forever,
        playtimeTwoWeeks: game.playtime_2weeks,
        lastPlayed: null,
      })),
    );
  } catch (error) {
    console.error(
      'Steam recently played error:',
      error.response?.status,
      error.response?.data || error.message,
    );

    res.status(500).json({
      error: 'Failed to fetch recently played games.',
    });
  }
});

export default router;
