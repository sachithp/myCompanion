const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

module.exports = function requireAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET)
    req.user = payload   // { userId, email, name, avatarUrl }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' })
  }
}
