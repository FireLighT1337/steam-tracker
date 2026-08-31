import axios from 'axios';

console.log('!!! STEAM SERVICE LOADED !!!');

const STEAM_API_URL = 'https://api.steampowered.com';
const STEAM_STORE_API_URL = 'https://store.steampowered.com/api';

async function getProfile(steamId) {
  const response = await axios.get(`${STEAM_API_URL}/ISteamUser/GetPlayerSummaries/v0002/`, {
    params: {
      key: process.env.STEAM_API_KEY,
      steamids: steamId,
    },
  });

  return response.data;
}

async function getOwnedGames(steamId) {
  const response = await axios.get(`${STEAM_API_URL}/IPlayerService/GetOwnedGames/v0001/`, {
    params: {
      key: process.env.STEAM_API_KEY,
      steamid: steamId,
      include_appinfo: 1,
      include_played_free_games: 1,
    },
  });

  return response.data.response.games ?? [];
}

async function getStoreGame(appId) {
  const response = await axios.get(`${STEAM_STORE_API_URL}/appdetails`, {
    params: {
      appids: appId,
    },
  });

  const storeData = response.data[appId];

  if (!storeData?.success || !storeData.data) {
    return null;
  }

  const game = storeData.data;

  return {
    appId: game.steam_appid,
    name: game.name,
    headerImage: game.header_image,
    shortDescription: game.short_description,
    isFree: game.is_free,
    developers: game.developers ?? [],
    publishers: game.publishers ?? [],
  };
}

async function getPlayerAchievements(steamId, appId) {
  const response = await axios.get(
    `${STEAM_API_URL}/ISteamUserStats/GetPlayerAchievements/v0001/`,
    {
      params: {
        key: process.env.STEAM_API_KEY,
        steamid: steamId,
        appid: appId,
      },
    },
  );

  return response.data;
}

async function getGameSchema(appId) {
  const response = await axios.get(`${STEAM_API_URL}/ISteamUserStats/GetSchemaForGame/v2/`, {
    params: { key: process.env.STEAM_API_KEY, appid: appId, l: 'english' },
  });

  return response.data;
}

async function getGlobalAchievementPercentages(appId) {
  const response = await axios.get(
    `${STEAM_API_URL}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/`,
    {
      params: {
        gameid: appId,
      },
    },
  );

  return response.data;
}

async function getAchievements(steamId, appId) {
  const [playerData, schemaData, globalData] = await Promise.all([
    getPlayerAchievements(steamId, appId),
    getGameSchema(appId),
    getGlobalAchievementPercentages(appId),
  ]);

  const playerAchievements = playerData.playerstats?.achievements ?? [];

  const schemaAchievements = schemaData.game?.availableGameStats?.achievements ?? [];

  const globalAchievements = globalData.achievementpercentages?.achievements ?? [];

  const schemaMap = new Map(
    schemaAchievements.map((achievement) => [achievement.name, achievement]),
  );

  const globalMap = new Map(
    globalAchievements.map((achievement) => [achievement.name, achievement]),
  );

  const achievements = playerAchievements.map((achievement) => {
    const schema = schemaMap.get(achievement.apiname);
    const global = globalMap.get(achievement.apiname);

    return {
      apiName: achievement.apiname,
      displayName: schema?.displayName ?? achievement.apiname,
      description: schema?.description ?? null,
      icon: schema?.icon ?? null,
      iconGray: schema?.icongray ?? null,
      achieved: achievement.achieved === 1,
      unlockTime: achievement.unlocktime > 0 ? new Date(achievement.unlocktime * 1000) : null,
      globalPercent: global ? Number(global.percent) : null,
    };
  });

  const totalAchievements = achievements.length;

  const unlockedAchievements = achievements.filter((achievement) => achievement.achieved).length;

  const progressPercent =
    totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0;

  const rarestAchievements = achievements
    .filter((achievement) => achievement.achieved && achievement.globalPercent !== null)
    .sort((a, b) => a.globalPercent - b.globalPercent)
    .slice(0, 3);

  return {
    progressPercent,
    rarestAchievements,
  };
}

export {
  getProfile,
  getOwnedGames,
  getStoreGame,
  getPlayerAchievements,
  getGameSchema,
  getAchievements,
  getGlobalAchievementPercentages,
};
