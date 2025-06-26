import { Server, Socket } from 'socket.io'
import User from '../models/User'

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`)

    // Join user to a room based on their preferences
    socket.on('join-debate', async (data: {
      sessionId: string
      category: string
      topic: string
    }) => {
      try {
        const { sessionId, category, topic } = data
        const roomName = `debate-${category}-${topic}`.toLowerCase().replace(/\s+/g, '-')
        
        socket.join(roomName)
        socket.data.roomName = roomName
        socket.data.sessionId = sessionId

        // Update user's last active time
        await User.findOneAndUpdate(
          { sessionId },
          { lastActive: new Date() },
          { upsert: true }
        )

        // Notify others in the room
        socket.to(roomName).emit('user-joined', {
          sessionId,
          timestamp: new Date().toISOString()
        })

        console.log(`User ${sessionId} joined room: ${roomName}`)
      } catch (error) {
        console.error('Error joining debate room:', error)
        socket.emit('error', { message: 'Failed to join debate room' })
      }
    })

    // Handle debate messages
    socket.on('debate-message', (data: {
      sessionId: string
      message: string
      timestamp: string
    }) => {
      const { roomName } = socket.data
      if (roomName) {
        socket.to(roomName).emit('debate-message', {
          ...data,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Handle typing indicators
    socket.on('typing-start', () => {
      const { roomName } = socket.data
      if (roomName) {
        socket.to(roomName).emit('user-typing', {
          sessionId: socket.data.sessionId,
          isTyping: true
        })
      }
    })

    socket.on('typing-stop', () => {
      const { roomName } = socket.data
      if (roomName) {
        socket.to(roomName).emit('user-typing', {
          sessionId: socket.data.sessionId,
          isTyping: false
        })
      }
    })

    // Handle debate actions
    socket.on('debate-action', (data: {
      action: 'agree' | 'disagree' | 'neutral'
      sessionId: string
    }) => {
      const { roomName } = socket.data
      if (roomName) {
        socket.to(roomName).emit('debate-action', {
          ...data,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Handle user leaving
    socket.on('leave-debate', async () => {
      try {
        const { roomName, sessionId } = socket.data
        if (roomName) {
          socket.leave(roomName)
          
          // Notify others in the room
          socket.to(roomName).emit('user-left', {
            sessionId,
            timestamp: new Date().toISOString()
          })

          // Update user status
          await User.findOneAndUpdate(
            { sessionId },
            { isSearching: false, lastActive: new Date() }
          )

          console.log(`User ${sessionId} left room: ${roomName}`)
        }
      } catch (error) {
        console.error('Error leaving debate room:', error)
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const { sessionId } = socket.data
        if (sessionId) {
          // Update user status
          await User.findOneAndUpdate(
            { sessionId },
            { isSearching: false, lastActive: new Date() }
          )

          // Notify room if user was in one
          const { roomName } = socket.data
          if (roomName) {
            socket.to(roomName).emit('user-disconnected', {
              sessionId,
              timestamp: new Date().toISOString()
            })
          }

          console.log(`User disconnected: ${sessionId}`)
        }
      } catch (error) {
        console.error('Error handling disconnect:', error)
      }
    })

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() })
    })
  })

  // Broadcast server stats periodically
  setInterval(async () => {
    try {
      const [totalUsers, searchingUsers, activeUsers] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isSearching: true }),
        User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } })
      ])

      io.emit('server-stats', {
        totalUsers,
        searchingUsers,
        activeUsers,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error broadcasting server stats:', error)
    }
  }, 30000) // Every 30 seconds

  // Clean up inactive users periodically
  setInterval(async () => {
    try {
      const result = await User.cleanupInactive()
      if (result.modifiedCount > 0) {
        console.log(`Cleaned up ${result.modifiedCount} inactive users`)
      }
    } catch (error) {
      console.error('Error cleaning up inactive users:', error)
    }
  }, 300000) // Every 5 minutes
} 