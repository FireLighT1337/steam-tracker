import SteamAuth from 'node-steam-openid';

const steam = new SteamAuth({
  realm: process.env.BACKEND_URL ?? 'http://localhost:3000',
  returnUrl: `${process.env.BACKEND_URL ?? 'http://localhost:3000'}/auth/steam/return`,
  apiKey: process.env.STEAM_API_KEY,
});

export default steam;
