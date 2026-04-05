const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const { verifySocketToken } = require('../middleware/auth')
const { Project, memStore } = require('../models')
const { executeCode } = require('../execution/runner')

const isMongoConnected = () => mongoose.connection.readyState === 1

// ── Project state helpers ──────────────────────────────────────────────────
async function getProject(projectId) {
  if (isMongoConnected()) {
    return await Project.findById(projectId).lean()
  }
  return memStore.projects.get(projectId) || null
}

async function saveProject(projectId, updates) {
  if (isMongoConnected()) {
    await Project.findByIdAndUpdate(projectId, { $set: updates })
  } else {
    const p = memStore.projects.get(projectId)
    if (p) Object.assign(p, updates, { updatedAt: new Date().toISOString() })
  }
}

// In-memory room state (online users, live code state for speed)
const rooms = new Map() // projectId -> { users: Map<socketId, userData>, fileContents: Map<fileId, string> }

function getRoom(projectId) {
  if (!rooms.has(projectId)) {
    rooms.set(projectId, { users: new Map(), fileContents: new Map() })
  }
  return rooms.get(projectId)
}

// OT-lite: last-write-wins with version counter
const fileVersions = new Map() // `${projectId}:${fileId}` -> version

function setupSocketHandlers(io) {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    const user = verifySocketToken(token)
    if (!user) return next(new Error('Invalid token'))
    socket.user = user
    next()
  })

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`)

    // ── JOIN PROJECT ──────────────────────────────────────────────────────
    socket.on('join-project', async ({ projectId }) => {
      try {
        const project = await getProject(projectId)
        if (!project) return socket.emit('error', { message: 'Project not found' })

        socket.join(projectId)
        socket.currentProjectId = projectId

        const room = getRoom(projectId)
        const userInfo = {
          id: socket.user.id,
          username: socket.user.username,
          color: socket.user.color,
          socketId: socket.id,
          currentFile: null,
        }
        room.users.set(socket.id, userInfo)

        // Send current state to joining user
        const files = project.files || {}
        // Apply any in-memory overrides (live edits not yet persisted)
        room.fileContents.forEach((content, fileId) => {
          if (files[fileId]) files[fileId] = { ...files[fileId], content }
        })

        socket.emit('project-state', {
          files,
          users: Array.from(room.users.values()),
          versions: (project.versions || []).slice(0, 20),
        })

        // Notify others
        socket.to(projectId).emit('user-joined', { user: userInfo })

        console.log(`${socket.user.username} joined project ${projectId}`)
      } catch (err) {
        console.error('join-project error:', err)
        socket.emit('error', { message: 'Failed to join project' })
      }
    })

    // ── LEAVE PROJECT ─────────────────────────────────────────────────────
    socket.on('leave-project', ({ projectId }) => {
      handleLeave(socket, projectId, io)
    })

    // ── CODE CHANGE ───────────────────────────────────────────────────────
    socket.on('code-change', ({ projectId, fileId, content }) => {
      if (!projectId || !fileId || content === undefined) return

      const room = getRoom(projectId)
      room.fileContents.set(fileId, content)

      // Broadcast to others in the room (not sender)
      socket.to(projectId).emit('code-update', {
        fileId,
        content,
        userId: socket.user.id,
      })

      // Debounced persist (every ~3 seconds of activity)
      clearTimeout(room._saveTimer)
      room._saveTimer = setTimeout(() => persistFiles(projectId, room), 3000)
    })

    // ── CURSOR MOVE ───────────────────────────────────────────────────────
    socket.on('cursor-move', ({ projectId, fileId, position }) => {
      const room = getRoom(projectId)
      const user = room.users.get(socket.id)
      if (user) user.currentFile = fileId

      socket.to(projectId).emit('cursor-update', {
        userId: socket.user.id,
        username: socket.user.username,
        color: socket.user.color,
        fileId,
        position,
      })
    })

    // ── CREATE FILE ───────────────────────────────────────────────────────
    socket.on('create-file', async ({ projectId, name, language }) => {
      try {
        const fileId = uuidv4()
        const defaultContents = getDefaultContent(language || 'javascript')
        const file = {
          id: fileId,
          name,
          content: defaultContents,
          language: language || 'javascript',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const project = await getProject(projectId)
        const files = { ...(project?.files || {}), [fileId]: file }
        await saveProject(projectId, { files })

        const room = getRoom(projectId)
        room.fileContents.set(fileId, defaultContents)

        io.to(projectId).emit('file-created', { file })
      } catch (err) {
        console.error('create-file error:', err)
      }
    })

    // ── DELETE FILE ───────────────────────────────────────────────────────
    socket.on('delete-file', async ({ projectId, fileId }) => {
      try {
        const project = await getProject(projectId)
        const files = { ...(project?.files || {}) }
        const name = files[fileId]?.name
        delete files[fileId]
        await saveProject(projectId, { files })

        const room = getRoom(projectId)
        room.fileContents.delete(fileId)

        io.to(projectId).emit('file-deleted', { fileId, name })
      } catch (err) {
        console.error('delete-file error:', err)
      }
    })

    // ── RENAME FILE ───────────────────────────────────────────────────────
    socket.on('rename-file', async ({ projectId, fileId, newName }) => {
      try {
        const project = await getProject(projectId)
        const files = { ...(project?.files || {}) }
        if (files[fileId]) {
          files[fileId] = { ...files[fileId], name: newName, updatedAt: new Date().toISOString() }
          await saveProject(projectId, { files })
          io.to(projectId).emit('file-renamed', { fileId, newName })
        }
      } catch (err) {
        console.error('rename-file error:', err)
      }
    })

    // ── SAVE FILE ─────────────────────────────────────────────────────────
    socket.on('save-file', async ({ projectId, fileId }) => {
      try {
        const room = getRoom(projectId)
        const content = room.fileContents.get(fileId)
        if (content === undefined) return

        const project = await getProject(projectId)
        const files = { ...(project?.files || {}) }
        if (files[fileId]) {
          files[fileId] = { ...files[fileId], content, updatedAt: new Date().toISOString(), isDirty: false }
          await saveProject(projectId, { files })
          io.to(projectId).emit('file-saved', { fileId })
        }
      } catch (err) {
        console.error('save-file error:', err)
      }
    })

    // ── SAVE VERSION ──────────────────────────────────────────────────────
    socket.on('save-version', async ({ projectId, label }) => {
      try {
        const project = await getProject(projectId)
        const room = getRoom(projectId)
        const files = { ...(project?.files || {}) }

        // Apply live edits
        room.fileContents.forEach((content, fileId) => {
          if (files[fileId]) files[fileId] = { ...files[fileId], content }
        })

        const version = {
          id: uuidv4(),
          label: label || `Snapshot ${new Date().toLocaleTimeString()}`,
          files: JSON.parse(JSON.stringify(files)),
          timestamp: new Date().toISOString(),
          author: socket.user.username,
        }

        const versions = [version, ...(project?.versions || [])].slice(0, 20)
        await saveProject(projectId, { versions })

        io.to(projectId).emit('version-saved', version)
      } catch (err) {
        console.error('save-version error:', err)
      }
    })

    // ── RESTORE VERSION ───────────────────────────────────────────────────
    socket.on('restore-version', async ({ projectId, versionId }) => {
      try {
        const project = await getProject(projectId)
        const version = (project?.versions || []).find(v => v.id === versionId)
        if (!version) return

        const room = getRoom(projectId)
        const files = version.files

        // Update in-memory
        Object.entries(files).forEach(([fileId, file]) => {
          room.fileContents.set(fileId, file.content)
        })

        await saveProject(projectId, { files })
        io.to(projectId).emit('project-state', {
          files,
          users: Array.from(room.users.values()),
          versions: project.versions,
        })
      } catch (err) {
        console.error('restore-version error:', err)
      }
    })

    // ── CHAT MESSAGE ──────────────────────────────────────────────────────
    socket.on('chat-message', ({ projectId, text }) => {
      if (!text?.trim()) return
      const msg = {
        id: uuidv4(),
        userId: socket.user.id,
        username: socket.user.username,
        color: socket.user.color,
        text: text.trim().slice(0, 1000),
        timestamp: new Date().toISOString(),
      }
      io.to(projectId).emit('chat-message', msg)
    })

    // ── RUN CODE ──────────────────────────────────────────────────────────
    socket.on('run-code', async ({ projectId, fileId, language }) => {
      try {
        const room = getRoom(projectId)
        let content = room.fileContents.get(fileId)

        if (content === undefined) {
          const project = await getProject(projectId)
          content = project?.files?.[fileId]?.content || ''
        }

        if (!content?.trim()) {
          socket.emit('execution-output', { data: 'No code to run\n', stream: 'stderr' })
          socket.emit('execution-done', { exitCode: 1, duration: 0 })
          return
        }

        io.to(projectId).emit('execution-start', { fileId, language })

        const onOutput = (data, stream) => {
          io.to(projectId).emit('execution-output', { data, stream })
        }
        const onError = (data, stream) => {
          io.to(projectId).emit('execution-output', { data, stream: 'stderr' })
        }

        const { exitCode, duration } = await executeCode(language, content, onOutput, onError)
        io.to(projectId).emit('execution-done', { exitCode, duration })
      } catch (err) {
        console.error('run-code error:', err)
        socket.emit('execution-output', { data: `Error: ${err.message}\n`, stream: 'stderr' })
        socket.emit('execution-done', { exitCode: 1, duration: 0 })
      }
    })

    // ── DISCONNECT ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentProjectId) {
        handleLeave(socket, socket.currentProjectId, io)
      }
      console.log(`Socket disconnected: ${socket.user.username}`)
    })
  })
}

function handleLeave(socket, projectId, io) {
  const room = rooms.get(projectId)
  if (room) {
    room.users.delete(socket.id)
    if (room.users.size === 0) {
      // Persist final state before clearing
      persistFiles(projectId, room).catch(console.error)
    }
  }
  socket.to(projectId).emit('user-left', {
    userId: socket.user.id,
    username: socket.user.username,
  })
  socket.leave(projectId)
}

async function persistFiles(projectId, room) {
  if (room.fileContents.size === 0) return
  try {
    const project = await getProject(projectId)
    if (!project) return
    const files = { ...(project.files || {}) }
    room.fileContents.forEach((content, fileId) => {
      if (files[fileId]) {
        files[fileId] = { ...files[fileId], content, updatedAt: new Date().toISOString() }
      }
    })
    await saveProject(projectId, { files })
  } catch (err) {
    console.error('persistFiles error:', err)
  }
}

function getDefaultContent(language) {
  const defaults = {
    javascript: '// Start coding here!\nconsole.log("Hello, World!");\n',
    typescript: '// Start coding here!\nconsole.log("Hello, World!");\n',
    python: '# Start coding here!\nprint("Hello, World!")\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
    c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
    cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
    go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
    rust: 'fn main() {\n    println!("Hello, World!");\n}\n',
    ruby: 'puts "Hello, World!"\n',
    php: '<?php\necho "Hello, World!\\n";\n',
    kotlin: 'fun main() {\n    println("Hello, World!")\n}\n',
    swift: 'print("Hello, World!")\n',
  }
  return defaults[language] || `// Start coding in ${language}!\n`
}

module.exports = { setupSocketHandlers }
