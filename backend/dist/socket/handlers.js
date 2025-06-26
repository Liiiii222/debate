"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const User_1 = __importDefault(require("../models/User"));
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        socket.on('join-debate', async (data) => {
            try {
                const { sessionId, category, topic } = data;
                const roomName = `debate-${category}-${topic}`.toLowerCase().replace(/\s+/g, '-');
                socket.join(roomName);
                socket.data.roomName = roomName;
                socket.data.sessionId = sessionId;
                await User_1.default.findOneAndUpdate({ sessionId }, { lastActive: new Date() }, { upsert: true });
                socket.to(roomName).emit('user-joined', {
                    sessionId,
                    timestamp: new Date().toISOString()
                });
                console.log(`User ${sessionId} joined room: ${roomName}`);
            }
            catch (error) {
                console.error('Error joining debate room:', error);
                socket.emit('error', { message: 'Failed to join debate room' });
            }
        });
        socket.on('debate-message', (data) => {
            const { roomName } = socket.data;
            if (roomName) {
                socket.to(roomName).emit('debate-message', {
                    ...data,
                    timestamp: new Date().toISOString()
                });
            }
        });
        socket.on('typing-start', () => {
            const { roomName } = socket.data;
            if (roomName) {
                socket.to(roomName).emit('user-typing', {
                    sessionId: socket.data.sessionId,
                    isTyping: true
                });
            }
        });
        socket.on('typing-stop', () => {
            const { roomName } = socket.data;
            if (roomName) {
                socket.to(roomName).emit('user-typing', {
                    sessionId: socket.data.sessionId,
                    isTyping: false
                });
            }
        });
        socket.on('debate-action', (data) => {
            const { roomName } = socket.data;
            if (roomName) {
                socket.to(roomName).emit('debate-action', {
                    ...data,
                    timestamp: new Date().toISOString()
                });
            }
        });
        socket.on('leave-debate', async () => {
            try {
                const { roomName, sessionId } = socket.data;
                if (roomName) {
                    socket.leave(roomName);
                    socket.to(roomName).emit('user-left', {
                        sessionId,
                        timestamp: new Date().toISOString()
                    });
                    await User_1.default.findOneAndUpdate({ sessionId }, { isSearching: false, lastActive: new Date() });
                    console.log(`User ${sessionId} left room: ${roomName}`);
                }
            }
            catch (error) {
                console.error('Error leaving debate room:', error);
            }
        });
        socket.on('disconnect', async () => {
            try {
                const { sessionId } = socket.data;
                if (sessionId) {
                    await User_1.default.findOneAndUpdate({ sessionId }, { isSearching: false, lastActive: new Date() });
                    const { roomName } = socket.data;
                    if (roomName) {
                        socket.to(roomName).emit('user-disconnected', {
                            sessionId,
                            timestamp: new Date().toISOString()
                        });
                    }
                    console.log(`User disconnected: ${sessionId}`);
                }
            }
            catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date().toISOString() });
        });
    });
    setInterval(async () => {
        try {
            const [totalUsers, searchingUsers, activeUsers] = await Promise.all([
                User_1.default.countDocuments(),
                User_1.default.countDocuments({ isSearching: true }),
                User_1.default.countDocuments({ lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } })
            ]);
            io.emit('server-stats', {
                totalUsers,
                searchingUsers,
                activeUsers,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error broadcasting server stats:', error);
        }
    }, 30000);
    setInterval(async () => {
        try {
            const result = await User_1.default.cleanupInactive();
            if (result.modifiedCount > 0) {
                console.log(`Cleaned up ${result.modifiedCount} inactive users`);
            }
        }
        catch (error) {
            console.error('Error cleaning up inactive users:', error);
        }
    }, 300000);
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=handlers.js.map