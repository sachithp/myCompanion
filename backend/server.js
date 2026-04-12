require('dotenv').config({ override: true })
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')

const { initDb } = require('./database/db')
const personasRouter = require('./routes/personas')
const conversationsRouter = require('./routes/conversations')

const app = express()
const PORT = process.env.PORT || 3001

// In production (Railway), DATA_DIR points to the mounted persistent volume.
// In development it falls back to the local backend directory.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname)
const uploadsDir = path.join(DATA_DIR, 'uploads', 'photos')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer storage for photo uploads
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

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}))
app.use(express.json({ limit: '10mb' })) // allow base64 photos in import payload
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')))

initDb()

// API routes
app.use('/api/personas', personasRouter)
app.use('/api/conversations', conversationsRouter)

// Photo upload endpoint
app.post('/api/upload/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ path: `/uploads/photos/${req.file.filename}` })
})

// Serve the built React frontend in production
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
