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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'photos')
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

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

initDb()

// Routes
app.use('/api/personas', personasRouter)
app.use('/api/conversations', conversationsRouter)

// Photo upload endpoint
app.post('/api/upload/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  res.json({ path: `/uploads/photos/${req.file.filename}` })
})

app.listen(PORT, () => {
  console.log(`myCompanion backend running on http://localhost:${PORT}`)
})
