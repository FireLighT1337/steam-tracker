import express from 'express';
import jwt from 'jsonwebtoken';
import steam from '../config/steam-auth.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:4200';
const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'steam_auth';

router.get('/steam', async (req, res) => {
  try {
    const redirectUrl = await steam.getRedirectUrl();
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Failed to generate Steam redirect URL:', error);
    res.status(500).send('Failed to start Steam login');
  }
});

router.get('/steam/return', async (req, res) => {
  try {
    const user = await steam.authenticate(req);
    const steamId = user.steamid;

    const token = jwt.sign({ steamId }, JWT_SECRET, { expiresIn: '30d' });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Steam auth error details:', error);
    res.redirect(`${FRONTEND_URL}/dashboard?login=failed`);
  }
});

router.get('/me', (req, res) => {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.json({ steamId: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ steamId: decoded.steamId });
  } catch {
    res.json({ steamId: null });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

export default router;
