const router = require('express').Router()
const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const { Project, memStore } = require('../models')

const isMongoConnected = () => mongoose.connection.readyState === 1

// ── In-memory helpers ──────────────────────────────────────────────────────
function memProject(data) {
  return {
    _id: data.id,
    ...data,
    toObject: () => data,
  }
}

// GET /api/projects — list user's projects
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    if (isMongoConnected()) {
      const projects = await Project.find({
        $or: [{ owner: userId }, { members: userId }]
      }).sort({ updatedAt: -1 }).limit(50)
      return res.json(projects)
    } else {
      const projects = Array.from(memStore.projects.values())
        .filter(p => p.owner === userId || (p.members || []).includes(userId))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      return res.json(projects)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/projects — create project
router.post('/', async (req, res) => {
  try {
    const { name, language = 'javascript' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
    const inviteCode = uuidv4().slice(0, 8)

    if (isMongoConnected()) {
      const project = await Project.create({
        name: name.trim(),
        owner: req.user.id,
        members: [req.user.id],
        language,
        inviteCode,
        files: {},
        versions: [],
      })
      return res.status(201).json(project)
    } else {
      const id = memStore.genId()
      const now = new Date().toISOString()
      const project = {
        id, _id: id, name: name.trim(), owner: req.user.id,
        members: [req.user.id], language, inviteCode,
        files: {}, versions: [], createdAt: now, updatedAt: now,
      }
      memStore.projects.set(id, project)
      return res.status(201).json(project)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (isMongoConnected()) {
      const project = await Project.findById(id)
      if (!project) return res.status(404).json({ error: 'Not found' })
      return res.json(project)
    } else {
      const project = memStore.projects.get(id)
      if (!project) return res.status(404).json({ error: 'Not found' })
      return res.json(project)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/projects/join — join by invite code
router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) return res.status(400).json({ error: 'Invite code required' })

    if (isMongoConnected()) {
      const project = await Project.findOneAndUpdate(
        { inviteCode },
        { $addToSet: { members: req.user.id } },
        { new: true }
      )
      if (!project) return res.status(404).json({ error: 'Invalid invite code' })
      return res.json(project)
    } else {
      const project = Array.from(memStore.projects.values()).find(p => p.inviteCode === inviteCode)
      if (!project) return res.status(404).json({ error: 'Invalid invite code' })
      if (!project.members.includes(req.user.id)) project.members.push(req.user.id)
      return res.json(project)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/projects/:id — update project settings
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, language } = req.body

    if (isMongoConnected()) {
      const project = await Project.findByIdAndUpdate(id, { name, language }, { new: true })
      return res.json(project)
    } else {
      const project = memStore.projects.get(id)
      if (!project) return res.status(404).json({ error: 'Not found' })
      if (name) project.name = name
      if (language) project.language = language
      project.updatedAt = new Date().toISOString()
      return res.json(project)
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
