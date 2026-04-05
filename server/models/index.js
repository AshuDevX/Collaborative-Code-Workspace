const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// User model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 30 },
  password: { type: String, required: true },
  color: { type: String, default: () => {
    const colors = ['#7c3aed','#06b6d4','#10b981','#f97316','#ec4899','#eab308','#ef4444','#8b5cf6']
    return colors[Math.floor(Math.random() * colors.length)]
  }},
  createdAt: { type: Date, default: Date.now },
})

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password)
}

UserSchema.methods.toPublic = function() {
  return { id: this._id.toString(), username: this.username, color: this.color }
}

// File schema (embedded in project)
const FileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Version snapshot schema
const VersionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: String,
  files: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  author: String,
})

// Project model
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  language: { type: String, default: 'javascript' },
  inviteCode: { type: String, unique: true },
  files: { type: mongoose.Schema.Types.Mixed, default: {} },
  versions: [VersionSchema],
}, {
  timestamps: true,
})

const User = mongoose.model('User', UserSchema)
const Project = mongoose.model('Project', ProjectSchema)

// In-memory store for when MongoDB is not available
class InMemoryStore {
  constructor() {
    this.users = new Map()
    this.projects = new Map()
    this.usersByUsername = new Map()
    this._idCounter = 1
  }

  genId() { return `mem_${this._idCounter++}_${Date.now()}` }
}

const memStore = new InMemoryStore()

module.exports = { User, Project, memStore }
