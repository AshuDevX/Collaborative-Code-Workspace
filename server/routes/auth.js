const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const { User, memStore } = require('../models')
const { signToken } = require('../middleware/auth')

const isMongoConnected = () => mongoose.connection.readyState === 1

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Username and password required' })
    }
    if (username.length < 2) return res.status(400).json({ error: 'Username too short' })
    if (password.length < 3) return res.status(400).json({ error: 'Password too short' })

    const colors = ['#7c3aed','#06b6d4','#10b981','#f97316','#ec4899','#eab308','#8b5cf6']
    const color = colors[Math.floor(Math.random() * colors.length)]

    if (isMongoConnected()) {
      const exists = await User.findOne({ username })
      if (exists) return res.status(409).json({ error: 'Username already taken' })
      const user = await User.create({ username, password, color })
      const token = signToken({ id: user._id.toString(), username, color })
      return res.status(201).json({ token, user: user.toPublic() })
    } else {
      if (memStore.usersByUsername.has(username)) {
        return res.status(409).json({ error: 'Username already taken' })
      }
      const id = memStore.genId()
      const hashedPw = await bcrypt.hash(password, 10)
      const user = { id, username, password: hashedPw, color }
      memStore.users.set(id, user)
      memStore.usersByUsername.set(username, id)
      const token = signToken({ id, username, color })
      return res.status(201).json({ token, user: { id, username, color } })
    }
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    if (isMongoConnected()) {
      const user = await User.findOne({ username })
      if (!user) return res.status(401).json({ error: 'Invalid credentials' })
      const valid = await user.comparePassword(password)
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
      const token = signToken({ id: user._id.toString(), username: user.username, color: user.color })
      return res.json({ token, user: user.toPublic() })
    } else {
      const userId = memStore.usersByUsername.get(username)
      if (!userId) {
        // Auto-register in dev mode
        const id = memStore.genId()
        const colors = ['#7c3aed','#06b6d4','#10b981','#f97316','#ec4899','#eab308','#8b5cf6']
        const color = colors[Math.floor(Math.random() * colors.length)]
        const hashedPw = await bcrypt.hash(password, 10)
        const user = { id, username, password: hashedPw, color }
        memStore.users.set(id, user)
        memStore.usersByUsername.set(username, id)
        const token = signToken({ id, username, color })
        return res.json({ token, user: { id, username, color } })
      }
      const user = memStore.users.get(userId)
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
      const token = signToken({ id: user.id, username: user.username, color: user.color })
      return res.json({ token, user: { id: user.id, username: user.username, color: user.color } })
    }
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
