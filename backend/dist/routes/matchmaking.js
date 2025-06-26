"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const User_1 = __importDefault(require("../models/User"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.post('/', validation_1.validateUserPreferences, async (req, res) => {
    try {
        const preferences = req.body;
        const sessionId = (0, uuid_1.v4)();
        const user = new User_1.default({
            sessionId,
            preferences,
            isSearching: true,
            lastActive: new Date()
        });
        await user.save();
        const matches = await User_1.default.findMatches(preferences, sessionId);
        if (matches.length > 0) {
            const bestMatch = matches[0];
            await Promise.all([
                User_1.default.findByIdAndUpdate(user._id, { isSearching: false }),
                User_1.default.findByIdAndUpdate(bestMatch._id, { isSearching: false })
            ]);
            const matchScore = calculateMatchScore(preferences, bestMatch.preferences);
            res.json({
                success: true,
                match: {
                    id: bestMatch.sessionId,
                    name: `Debater ${bestMatch.sessionId.slice(0, 8)}`,
                    ageRange: bestMatch.preferences.ageRange,
                    country: bestMatch.preferences.country,
                    university: bestMatch.preferences.university,
                    matchScore
                },
                sessionId
            });
        }
        else {
            res.json({
                success: true,
                match: null,
                sessionId
            });
        }
    }
    catch (error) {
        console.error('Error in matchmaking:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to find match'
        });
    }
});
router.put('/:sessionId/active', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user = await User_1.default.findOne({ sessionId });
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User session not found'
            });
            return;
        }
        user.updateLastActive();
        await user.save();
        res.json({
            success: true,
            message: 'Activity updated'
        });
    }
    catch (error) {
        console.error('Error updating user activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update activity'
        });
    }
});
router.delete('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const user = await User_1.default.findOne({ sessionId });
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User session not found'
            });
            return;
        }
        user.isSearching = false;
        await user.save();
        res.json({
            success: true,
            message: 'Session ended'
        });
    }
    catch (error) {
        console.error('Error ending user session:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, searchingUsers, activeUsers] = await Promise.all([
            User_1.default.countDocuments(),
            User_1.default.countDocuments({ isSearching: true }),
            User_1.default.countDocuments({ lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } })
        ]);
        res.json({
            success: true,
            stats: {
                totalUsers,
                searchingUsers,
                activeUsers,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error fetching matchmaking stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});
function calculateMatchScore(preferences1, preferences2) {
    let score = 0;
    let totalFactors = 0;
    if (preferences1.category === preferences2.category) {
        score += 40;
    }
    totalFactors += 40;
    if (preferences1.topic === preferences2.topic) {
        score += 30;
    }
    totalFactors += 30;
    if (preferences1.ageRange === preferences2.ageRange ||
        preferences1.ageRange === 'Any age' ||
        preferences2.ageRange === 'Any age') {
        score += 10;
    }
    totalFactors += 10;
    if (preferences1.language === preferences2.language ||
        preferences1.language === 'Any language' ||
        preferences2.language === 'Any language') {
        score += 10;
    }
    totalFactors += 10;
    if (preferences1.country === preferences2.country ||
        preferences1.country === 'Any country' ||
        preferences2.country === 'Any country') {
        score += 5;
    }
    totalFactors += 5;
    if (preferences1.university && preferences2.university &&
        preferences1.university === preferences2.university) {
        score += 5;
    }
    totalFactors += 5;
    return Math.round((score / totalFactors) * 100);
}
exports.default = router;
//# sourceMappingURL=matchmaking.js.map