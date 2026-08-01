import { Server, Socket } from 'socket.io'
import { db } from '../config/firebaseAdmin'

// Map from Firebase uid → socket.id so matchmaking can push to specific users
export const searchingUsers = new Map<string, string>()

// Track which rooms have accepted — roomId → Map of uid → their debateFormats
const roomAccepted = new Map<string, Map<string, string[]>>()

// Resolve two sets of format preferences into one agreed format
function resolveFormat(formatsA: string[], formatsB: string[]): string {
  const anyA = formatsA.includes('Any format')
  const anyB = formatsB.includes('Any format')
  if (anyA && anyB) return 'Text'
  if (anyA) return formatsB.find(f => f !== 'Any format') || 'Text'
  if (anyB) return formatsA.find(f => f !== 'Any format') || 'Text'
  // Both have specific formats — find first common one
  const common = formatsA.find(f => formatsB.includes(f))
  return common || formatsA[0] || 'Text'
}

export const setupSocketHandlers = (io: Server) => {
  // Expose io so the matchmaking HTTP route can emit match-found to both parties
  ;(global as any).__io = io

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`)

    // User entered the matchmaking screen — register so we can push match-found to them
    socket.on('register-searching', (data: { uid: string }) => {
      socket.data.uid = data.uid
      searchingUsers.set(data.uid, socket.id)
    })

    socket.on('unregister-searching', (data: { uid: string }) => {
      searchingUsers.delete(data.uid)
    })

    // Both users join this pre-debate room when they see the match screen
    // This is NOT the debate room yet — it's just for Accept/Decline signaling
    socket.on('join-match-room', async (data: { uid: string; roomId: string }) => {
      const { uid, roomId } = data
      socket.join(roomId)
      socket.data.matchRoomId = roomId
      socket.data.uid = uid
      searchingUsers.delete(uid)

      // Tell the other person their partner is now viewing the match screen
      socket.to(roomId).emit('partner-viewing-match', { uid })
    })

    // One person clicked Accept — carries their preferred formats
    socket.on('accept-match', (data: { uid: string; roomId: string; debateFormats: string[] }) => {
      const { uid, roomId, debateFormats } = data

      if (!roomAccepted.has(roomId)) roomAccepted.set(roomId, new Map())
      roomAccepted.get(roomId)!.set(uid, debateFormats)

      const accepted = roomAccepted.get(roomId)!

      // Tell the other person their partner accepted
      socket.to(roomId).emit('partner-accepted')

      // If both have accepted, start the debate — format was already resolved at match time
      if (accepted.size >= 2) {
        roomAccepted.delete(roomId)
        io.in(roomId).emit('both-accepted')
      }
    })

    // One person clicked Decline
    socket.on('decline-match', (data: { uid: string; roomId: string }) => {
      const { roomId } = data
      roomAccepted.delete(roomId)
      // Tell both people the match was declined
      io.in(roomId).emit('match-declined', { declinedBy: data.uid })
    })

    // Called when both enter the actual debate room
    socket.on('join-debate', async (data: { uid: string; roomId: string }) => {
      try {
        const { uid, roomId } = data
        const wasEmpty = (await io.in(roomId).allSockets()).size === 0
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.uid = uid
        socket.data.isOfferer = wasEmpty // first one in = offerer

        // Tell the person already in the room their partner arrived
        socket.to(roomId).emit('partner-joined', { uid })

        // Tell the joiner whether to expect an offer or send one
        const roomSockets = await io.in(roomId).allSockets()
        if (roomSockets.size >= 2) {
          // Joiner arrived second — wait for offer from the other side
          socket.emit('partner-already-present')
        }

        await db.collection('users').doc(uid).update({ lastActive: new Date() })
      } catch (error) {
        console.error('Error joining debate room:', error)
        socket.emit('error', { message: 'Failed to join debate room' })
      }
    })

    // Text debate messages
    socket.on('debate-message', (data: { text: string; timestamp: number }) => {
      const { roomId, uid } = socket.data
      if (roomId) {
        socket.to(roomId).emit('debate-message', { text: data.text, senderUid: uid, timestamp: data.timestamp || Date.now(), replyTo: data.replyTo })
      }
    })

    socket.on('typing-start', () => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('partner-typing', { isTyping: true })
    })

    socket.on('typing-stop', () => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('partner-typing', { isTyping: false })
    })

    // WebRTC signaling — just relay between peers
    socket.on('webrtc-offer', (data: { offer: any }) => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('webrtc-offer', { offer: data.offer })
    })

    socket.on('webrtc-answer', (data: { answer: any }) => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('webrtc-answer', { answer: data.answer })
    })

    socket.on('webrtc-ice-candidate', (data: { candidate: any }) => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('webrtc-ice-candidate', { candidate: data.candidate })
    })

    socket.on('leave-debate', async () => {
      try {
        const { roomId, uid } = socket.data
        if (roomId) {
          socket.to(roomId).emit('partner-left', { uid, timestamp: new Date().toISOString() })
          socket.leave(roomId)
          if (uid) await db.collection('users').doc(uid).update({ isSearching: false, lastActive: new Date() })
        }
      } catch (error) {
        console.error('Error leaving debate room:', error)
      }
    })

    socket.on('disconnect', async () => {
      try {
        const { uid, roomId, matchRoomId } = socket.data
        if (uid) searchingUsers.delete(uid)
        const activeRoom = roomId || matchRoomId
        if (activeRoom) {
          socket.to(activeRoom).emit('partner-disconnected', { uid, timestamp: new Date().toISOString() })
        }
        if (uid) await db.collection('users').doc(uid).update({ isSearching: false, lastActive: new Date() })
      } catch (error) {
        console.error('Error handling disconnect:', error)
      }
    })

    socket.on('timer-relay', (data: any) => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('timer-sync', data)
    })

    socket.on('timer-relay', (data: any) => {
      const { roomId } = socket.data
      if (roomId) socket.to(roomId).emit('timer-sync', data)
    })

    socket.on('ping', () => socket.emit('pong', { timestamp: new Date().toISOString() }))
  })
}








