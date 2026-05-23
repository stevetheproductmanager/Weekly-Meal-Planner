import express from 'express';
import passport from 'passport';

const router = express.Router();

const CLIENT_ORIGIN = process.env.NODE_ENV === 'production'
  ? '/'
  : (process.env.CLIENT_URL || 'http://localhost:5173');

// Kick off Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Google redirects here after auth
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${CLIENT_ORIGIN}?auth=failed` }),
  (req, res) => {
    // Successful auth — redirect to the app
    // In dev: redirect to Vite client (5173). In prod: same server, so '/' works.
    res.redirect(CLIENT_ORIGIN);
  }
);

// Sign out
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
