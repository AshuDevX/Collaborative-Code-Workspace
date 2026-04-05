const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const os = require('os')
const path = require('path')
const fs = require('fs').promises
const { v4: uuidv4 } = require('uuid')

const TIMEOUT_MS = 15000 // 15 second execution limit

const LANGUAGE_CONFIG = {
  javascript: {
    image: 'node:20-alpine',
    filename: 'main.js',
    cmd: (f) => `node ${f}`,
    localCmd: (f) => ['node', [f]],
  },
  typescript: {
    image: 'node:20-alpine',
    filename: 'main.ts',
    cmd: (f) => `npx ts-node ${f}`,
    localCmd: (f) => ['npx', ['ts-node', f]],
    setup: 'npm install -g ts-node typescript 2>/dev/null || true && ',
  },
  python: {
    image: 'python:3.11-alpine',
    filename: 'main.py',
    cmd: (f) => `python3 ${f}`,
    localCmd: (f) => ['python3', [f]],
  },
  java: {
    image: 'openjdk:17-alpine',
    filename: 'Main.java',
    cmd: (f) => `javac ${f} && java Main`,
    localCmd: null,
  },
  c: {
    image: 'gcc:latest',
    filename: 'main.c',
    cmd: (f) => `gcc ${f} -o main && ./main`,
    localCmd: null,
  },
  cpp: {
    image: 'gcc:latest',
    filename: 'main.cpp',
    cmd: (f) => `g++ ${f} -o main && ./main`,
    localCmd: null,
  },
  go: {
    image: 'golang:1.21-alpine',
    filename: 'main.go',
    cmd: (f) => `go run ${f}`,
    localCmd: (f) => ['go', ['run', f]],
  },
  rust: {
    image: 'rust:alpine',
    filename: 'main.rs',
    cmd: (f) => `rustc ${f} -o main && ./main`,
    localCmd: null,
  },
  ruby: {
    image: 'ruby:3.2-alpine',
    filename: 'main.rb',
    cmd: (f) => `ruby ${f}`,
    localCmd: (f) => ['ruby', [f]],
  },
  php: {
    image: 'php:8.2-cli-alpine',
    filename: 'main.php',
    cmd: (f) => `php ${f}`,
    localCmd: (f) => ['php', [f]],
  },
  kotlin: {
    image: 'zenika/kotlin:latest',
    filename: 'main.kt',
    cmd: (f) => `kotlinc ${f} -include-runtime -d main.jar && java -jar main.jar`,
    localCmd: null,
  },
  swift: {
    image: 'swift:5.9-focal',
    filename: 'main.swift',
    cmd: (f) => `swift ${f}`,
    localCmd: null,
  },
}

async function isDockerAvailable() {
  try {
    await execAsync('docker info', { timeout: 3000 })
    return true
  } catch {
    return false
  }
}

async function runWithDocker(language, code, onOutput, onError) {
  const config = LANGUAGE_CONFIG[language]
  if (!config) throw new Error(`Unsupported language: ${language}`)

  const tmpDir = path.join(os.tmpdir(), `cc_${uuidv4()}`)
  await fs.mkdir(tmpDir, { recursive: true })
  const filePath = path.join(tmpDir, config.filename)
  await fs.writeFile(filePath, code, 'utf-8')

  const dockerCmd = [
    'docker', 'run',
    '--rm',
    '--network=none',
    '--memory=128m',
    '--memory-swap=128m',
    '--cpus=0.5',
    '--pids-limit=64',
    '--read-only',
    `--tmpfs=/tmp:size=64m`,
    `-v`, `${tmpDir}:/workspace:ro`,
    '-w', '/workspace',
    '--security-opt=no-new-privileges',
    config.image,
    'sh', '-c',
    `timeout 12 sh -c '${config.cmd(config.filename)}'`,
  ]

  return new Promise((resolve) => {
    const proc = spawn(dockerCmd[0], dockerCmd.slice(1), { timeout: TIMEOUT_MS })

    proc.stdout.on('data', d => onOutput(d.toString(), 'stdout'))
    proc.stderr.on('data', d => onError(d.toString(), 'stderr'))

    proc.on('close', async (code) => {
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch {}
      resolve(code ?? 1)
    })

    proc.on('error', async (err) => {
      onError(`Execution error: ${err.message}`, 'stderr')
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch {}
      resolve(1)
    })

    setTimeout(() => {
      proc.kill('SIGKILL')
      onError('\n⏱ Execution timed out (15s limit)', 'stderr')
    }, TIMEOUT_MS)
  })
}

async function runLocally(language, code, onOutput, onError) {
  const config = LANGUAGE_CONFIG[language]
  if (!config || !config.localCmd) {
    onError(`⚠ Language '${language}' requires Docker. Please install Docker to run this code.`, 'stderr')
    return 1
  }

  const tmpDir = path.join(os.tmpdir(), `cc_${uuidv4()}`)
  await fs.mkdir(tmpDir, { recursive: true })
  const filePath = path.join(tmpDir, config.filename)
  await fs.writeFile(filePath, code, 'utf-8')

  const [cmd, args] = config.localCmd(filePath)

  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: tmpDir, timeout: TIMEOUT_MS })

    proc.stdout.on('data', d => onOutput(d.toString(), 'stdout'))
    proc.stderr.on('data', d => onError(d.toString(), 'stderr'))

    proc.on('close', async (exitCode) => {
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch {}
      resolve(exitCode ?? 0)
    })

    proc.on('error', async (err) => {
      if (err.code === 'ENOENT') {
        onError(`⚠ '${cmd}' is not installed. Please install it or use Docker.`, 'stderr')
      } else {
        onError(`Execution error: ${err.message}`, 'stderr')
      }
      try { await fs.rm(tmpDir, { recursive: true, force: true }) } catch {}
      resolve(1)
    })
  })
}

async function executeCode(language, code, onOutput, onError) {
  const start = Date.now()
  let exitCode

  try {
    const dockerAvailable = await isDockerAvailable()
    if (dockerAvailable) {
      exitCode = await runWithDocker(language, code, onOutput, onError)
    } else {
      onOutput('ℹ Docker not found, running locally (no sandbox)\n', 'stdout')
      exitCode = await runLocally(language, code, onOutput, onError)
    }
  } catch (err) {
    onError(`Fatal error: ${err.message}`, 'stderr')
    exitCode = 1
  }

  return { exitCode, duration: Date.now() - start }
}

module.exports = { executeCode, LANGUAGE_CONFIG }
