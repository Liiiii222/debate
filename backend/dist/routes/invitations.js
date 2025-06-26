"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const DebateInvitation_1 = __importDefault(require("../models/DebateInvitation"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.post('/', validation_1.validateInvitation, async (req, res) => {
    try {
        const { inviterSessionId, inviteeUsername, category, topic, debateFormat } = req.body;
        const invitee = await User_1.default.findByUsername(inviteeUsername);
        if (!invitee) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }
        if (inviterSessionId === invitee.sessionId) {
            res.status(400).json({
                success: false,
                error: 'You cannot invite yourself'
            });
            return;
        }
        const existingInvitation = await DebateInvitation_1.default.findOne({
            inviterSessionId,
            inviteeSessionId: invitee.sessionId,
            status: 'pending'
        });
        if (existingInvitation) {
            res.status(400).json({
                success: false,
                error: 'You already have a pending invitation to this user'
            });
            return;
        }
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const invitation = new DebateInvitation_1.default({
            inviterSessionId,
            inviteeSessionId: invitee.sessionId,
            category,
            topic,
            debateFormat,
            expiresAt
        });
        await invitation.save();
        res.status(201).json({
            success: true,
            invitation: {
                id: invitation._id,
                inviteeUsername,
                category,
                topic,
                debateFormat,
                expiresAt: invitation.expiresAt
            }
        });
    }
    catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send invitation'
        });
    }
});
router.get('/pending', async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
            return;
        }
        const invitations = await DebateInvitation_1.default.findPendingInvitations(sessionId);
        const invitationsWithDetails = await Promise.all(invitations.map(async (invitation) => {
            const inviter = await User_1.default.findOne({ sessionId: invitation.inviterSessionId });
            return {
                id: invitation._id,
                inviterUsername: inviter?.username || `User ${invitation.inviterSessionId.slice(0, 8)}`,
                category: invitation.category,
                topic: invitation.topic,
                debateFormat: invitation.debateFormat,
                createdAt: invitation.createdAt,
                expiresAt: invitation.expiresAt
            };
        }));
        res.json({
            success: true,
            invitations: invitationsWithDetails
        });
    }
    catch (error) {
        console.error('Error fetching pending invitations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invitations'
        });
    }
});
router.put('/:id/accept', async (req, res) => {
    try {
        const invitation = await DebateInvitation_1.default.findById(req.params.id);
        if (!invitation) {
            res.status(404).json({
                success: false,
                error: 'Invitation not found'
            });
            return;
        }
        if (invitation.status !== 'pending') {
            res.status(400).json({
                success: false,
                error: 'Invitation is no longer pending'
            });
            return;
        }
        if (invitation.expiresAt < new Date()) {
            res.status(400).json({
                success: false,
                error: 'Invitation has expired'
            });
            return;
        }
        await invitation.accept();
        const [inviter, invitee] = await Promise.all([
            User_1.default.findOne({ sessionId: invitation.inviterSessionId }),
            User_1.default.findOne({ sessionId: invitation.inviteeSessionId })
        ]);
        res.json({
            success: true,
            message: 'Invitation accepted',
            debate: {
                id: invitation._id,
                category: invitation.category,
                topic: invitation.topic,
                debateFormat: invitation.debateFormat,
                inviterUsername: inviter?.username || `User ${invitation.inviterSessionId.slice(0, 8)}`,
                inviteeUsername: invitee?.username || `User ${invitation.inviteeSessionId.slice(0, 8)}`
            }
        });
    }
    catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to accept invitation'
        });
    }
});
router.put('/:id/decline', async (req, res) => {
    try {
        const invitation = await DebateInvitation_1.default.findById(req.params.id);
        if (!invitation) {
            res.status(404).json({
                success: false,
                error: 'Invitation not found'
            });
            return;
        }
        if (invitation.status !== 'pending') {
            res.status(400).json({
                success: false,
                error: 'Invitation is no longer pending'
            });
            return;
        }
        await invitation.decline();
        res.json({
            success: true,
            message: 'Invitation declined'
        });
    }
    catch (error) {
        console.error('Error declining invitation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to decline invitation'
        });
    }
});
router.get('/active', async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) {
            res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
            return;
        }
        const invitations = await DebateInvitation_1.default.findActiveInvitations(sessionId);
        const invitationsWithDetails = await Promise.all(invitations.map(async (invitation) => {
            const [inviter, invitee] = await Promise.all([
                User_1.default.findOne({ sessionId: invitation.inviterSessionId }),
                User_1.default.findOne({ sessionId: invitation.inviteeSessionId })
            ]);
            return {
                id: invitation._id,
                inviterUsername: inviter?.username || `User ${invitation.inviterSessionId.slice(0, 8)}`,
                inviteeUsername: invitee?.username || `User ${invitation.inviteeSessionId.slice(0, 8)}`,
                category: invitation.category,
                topic: invitation.topic,
                debateFormat: invitation.debateFormat,
                status: invitation.status,
                createdAt: invitation.createdAt,
                expiresAt: invitation.expiresAt
            };
        }));
        res.json({
            success: true,
            invitations: invitationsWithDetails
        });
    }
    catch (error) {
        console.error('Error fetching active invitations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch invitations'
        });
    }
});
exports.default = router;
//# sourceMappingURL=invitations.js.map