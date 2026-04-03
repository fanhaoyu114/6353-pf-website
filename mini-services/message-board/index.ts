import { Server } from 'socket.io'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ─── Simple JSON file storage ────────────────────────────────────────────
const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'messages.json')

interface StoredMessage {
  id: string
  content: string
  author: string | null
  createdAt: string
}

function loadMessages(): StoredMessage[] {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (!existsSync(DATA_FILE)) return []
    const raw = readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw) as StoredMessage[]
  } catch {
    return []
  }
}

function saveMessages(messages: StoredMessage[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf-8')
}

// ─── Socket.io server ────────────────────────────────────────────────────
const io = new Server({
  cors: {
    origin: ['*'],
    methods: ['GET', 'POST'],
  },
})

const MAX_MESSAGES = 200
const MAX_CONTENT_LENGTH = 280

io.on('connection', async (socket) => {
  console.log(`[MSG] Client connected: ${socket.id}`)

  // Send message history on connect
  const messages = loadMessages()
  socket.emit('message:history', messages)

  // Handle new message
  socket.on('message:send', (data: { content: string; author?: string }) => {
    if (!data?.content || data.content.trim().length === 0) return

    const content = data.content.trim().slice(0, MAX_CONTENT_LENGTH)
    const author = data.author?.trim().slice(0, 30) || null
    const msg: StoredMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content,
      author,
      createdAt: new Date().toISOString(),
    }

    // Load, append, trim, save
    const all = loadMessages()
    all.push(msg)
    if (all.length > MAX_MESSAGES) {
      all.splice(0, all.length - MAX_MESSAGES)
    }
    saveMessages(all)

    // Broadcast to all clients
    io.emit('message:new', msg)

    console.log(`[MSG] New from ${author || 'anon'}: ${content.slice(0, 40)}`)
  })

  socket.on('disconnect', () => {
    console.log(`[MSG] Client disconnected: ${socket.id}`)
  })
})

const PORT = 3003
io.listen(PORT)
console.log(`[MSG] Message board service running on port ${PORT}`)
