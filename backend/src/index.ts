import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { errorHandler } from './middleware/errorHandler'
import './config/firebaseAdmin'
import { setupSocketHandlers } from './socket/handlers'

import categoriesRouter from './routes/categories'
import topicsRouter from './routes/topics'
import trendingRouter from './routes/trending'
import matchmakingRouter from './routes/matchmaking'
import userRouter from './routes/user'
import usersRouter from './routes/users'

const app = express()

// We need a raw HTTP server (not just Express) so Socket.IO can share the same port
const httpServer = createServer(app)

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Socket.IO — attached to the same HTTP server as Express, same port
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
})

setupSocketHandlers(io)

app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())

app.use('/api/categories', categoriesRouter)
app.use('/api/topics', topicsRouter)
app.use('/api/trending', trendingRouter)
app.use('/api/matchmaking', matchmakingRouter)
app.use('/api/user', userRouter)
app.use('/api/users', usersRouter)

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Debate app backend is running' })
})

app.use(errorHandler)

const PORT = process.env.PORT || 3001

// Use httpServer.listen instead of app.listen so Socket.IO works
httpServer.listen(PORT, () => {
  console.log(`Server + Socket.IO running on port ${PORT}`)
})
