require('dotenv').config({ override: true })
const express  = require('express')
const cors     = require('cors')
const path     = require('path')
const fs       = require('fs')
const multer   = require('multer')
const session  = require('express-session')
const passport = require('passport')
const { v4: uuidv4 } = require('uuid')

const { initDb } = require('./database/db')
const personasRouter      = require('./routes/personas')
const conversationsRouter = require('./routes/conversations')
const authRouter          = require('./routes/auth')
const settingsRouter      = require('./routes/settings')
const requireAuth         = require('./middleware/auth')

const app  = express()
const PORT = process.env.PORT || 3001

// In production (Railway), DATA_DIR points to the mounted persistent volume.
// In development it falls back to the local backend directory.
const DATA_DIR   = process.env.DATA_DIR || path.join(__dirname)
const uploadsDir = path.join(DATA_DIR, 'uploads', 'photos')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// ── Multer — photo uploads ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')))

// express-session is required for Passport's OAuth state/nonce during the
// Google OAuth dance. It is NOT used for long-term auth (JWTs handle that).
app.use(session({
  secret:            process.env.SESSION_SECRET || 'session-secret-change-in-production',
  resave:            false,
  saveUninitialized: false,
  cookie: { maxAge: 10 * 60 * 1000 }, // 10 minutes — only needed for the OAuth round-trip
}))

app.use(passport.initialize())
app.use(passport.session())

initDb()

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter)
app.use('/api/personas',      requireAuth, personasRouter)
app.use('/api/conversations', requireAuth, conversationsRouter)
app.use('/api/settings',      requireAuth, settingsRouter)

// Photo upload — protected
app.post('/api/upload/photo', requireAuth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ path: `/uploads/photos/${req.file.filename}` })
})

// ── Serve the built React frontend in production ───────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  // SPA fallback — let React Router handle all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`myCompanion backend running on http://localhost:${PORT}`)
  console.log(`Data directory: ${DATA_DIR}`)
})
