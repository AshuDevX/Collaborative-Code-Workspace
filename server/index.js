require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')

const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const { authMiddleware } = require('./middleware/auth')
const { setupSocketHandlers } = require('./socket/handlers')

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', authMiddleware, projectRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'))
    }
  })
}

// Setup WebSocket handlers
setupSocketHandlers(io)

// Connect DB and start server
const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codecollab'

async function start() {
  try {
    if (MONGO_URI !== 'memory') {
      await mongoose.connect(MONGO_URI)
      console.log('✓ MongoDB connected')
    }
  } catch (err) {
    console.warn('⚠ MongoDB not available, using in-memory store')
  }

  server.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
    console.log(`✓ WebSocket server ready`)
  })
}

start()

module.exports = { app, io }
