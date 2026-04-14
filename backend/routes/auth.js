const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../database/db')

const router = express.Router()

const JWT_SECRET   = process.env.JWT_SECRET   || 'dev-secret-change-in-production'
const FRONTEND_URL = process.env.FRONTEND_URL  || 'http://localhost:5173'
const BACKEND_URL  = process.env.BACKEND_URL   || 'http://localhost:3001'

// ── Google OAuth strategy ────────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${BACKEND_URL}/api/auth/google/callback`,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const db        = getDb()
      const googleId  = profile.id
      const email     = profile.emails?.[0]?.value  || null
      const name      = profile.displayName          || null
      const avatarUrl = profile.photos?.[0]?.value  || null

      let user = db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId)

      if (!user) {
        const id = uuidv4()
        db.prepare(
          'INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
        ).run(id, googleId, email, name, avatarUrl)
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
      } else {
        // Refresh display name and avatar in case they changed in Google
        db.prepare('UPDATE users SET name = ?, avatar_url = ?, email = ? WHERE id = ?')
          .run(name, avatarUrl, email, user.id)
        user = { ...user, name, avatar_url: avatarUrl, email }
      }

      done(null, user)
    } catch (err) {
      done(err)
    }
  }
))

// Passport session helpers — used only during the OAuth dance
passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
  try {
    const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id)
    done(null, user || false)
  } catch (err) {
    done(err)
  }
})

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/auth/google — kick off the OAuth consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

// GET /api/auth/google/callback — Google redirects here with the auth code
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=auth_failed`,
  }),
  (req, res) => {
    const { id, email, name, avatar_url } = req.user
    const token = jwt.sign(
      { userId: id, email, name, avatarUrl: avatar_url },
      JWT_SECRET,
      { expiresIn: '30d' }
    )
    // Send token to the SPA via a redirect — the callback page picks it up
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`)
  }
)

// GET /api/auth/me — verify the JWT and return the current user's profile
router.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET)
    res.json({
      userId:    payload.userId,
      email:     payload.email,
      name:      payload.name,
      avatarUrl: payload.avatarUrl,
    })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

module.exports = router
