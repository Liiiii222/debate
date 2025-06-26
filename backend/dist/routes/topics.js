"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Topic_1 = __importDefault(require("../models/Topic"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) {
            res.status(400).json({
                success: false,
                error: 'Category parameter is required'
            });
            return;
        }
        const [trendingTopics, popularTopics, userTopics, defaultTopics] = await Promise.all([
            Topic_1.default.find({ category, trending: true }).sort({ usageCount: -1 }),
            Topic_1.default.getUserPopularByCategory(category),
            Topic_1.default.getUserTopicsByCategory(category),
            Topic_1.default.getDefaultByCategory(category)
        ]);
        const topics = [
            ...trendingTopics,
            ...popularTopics,
            ...userTopics,
            ...defaultTopics
        ];
        res.json({
            success: true,
            topics: topics.map(topic => ({
                id: topic._id,
                name: topic.name,
                category: topic.category,
                source: topic.source,
                trending: topic.trending,
                usageCount: topic.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch topics'
        });
    }
});
router.get('/default', async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) {
            res.status(400).json({
                success: false,
                error: 'Category parameter is required'
            });
            return;
        }
        const defaultTopics = await Topic_1.default.getDefaultByCategory(category);
        res.json({
            success: true,
            topics: defaultTopics.map(topic => ({
                id: topic._id,
                name: topic.name,
                category: topic.category,
                source: topic.source,
                trending: topic.trending,
                usageCount: topic.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching default topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch default topics'
        });
    }
});
router.get('/popular', async (req, res) => {
    try {
        const { category } = req.query;
        if (!category) {
            res.status(400).json({
                success: false,
                error: 'Category parameter is required'
            });
            return;
        }
        const popularTopics = await Topic_1.default.getUserPopularByCategory(category);
        res.json({
            success: true,
            topics: popularTopics.map(topic => ({
                id: topic._id,
                name: topic.name,
                category: topic.category,
                source: topic.source,
                trending: topic.trending,
                usageCount: topic.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching popular topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular topics'
        });
    }
});
router.post('/', validation_1.validateTopic, async (req, res) => {
    try {
        const { name, category } = req.body;
        const existingTopic = await Topic_1.default.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            category: { $regex: new RegExp(`^${category}$`, 'i') }
        });
        if (existingTopic) {
            res.status(400).json({
                success: false,
                error: 'Topic already exists in this category'
            });
            return;
        }
        const topic = new Topic_1.default({
            name,
            category,
            source: 'user',
            trending: false,
            usageCount: 0
        });
        await topic.save();
        res.status(201).json({
            success: true,
            topic: {
                id: topic._id,
                name: topic.name,
                category: topic.category,
                source: topic.source,
                trending: topic.trending,
                usageCount: topic.usageCount
            }
        });
    }
    catch (error) {
        console.error('Error creating topic:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create topic'
        });
    }
});
router.put('/:id/usage', async (req, res) => {
    try {
        const topic = await Topic_1.default.findById(req.params.id);
        if (!topic) {
            res.status(404).json({
                success: false,
                error: 'Topic not found'
            });
            return;
        }
        topic.incrementUsage();
        await topic.save();
        res.json({
            success: true,
            message: 'Usage count updated'
        });
    }
    catch (error) {
        console.error('Error updating topic usage:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update usage count'
        });
    }
});
router.get('/trending', async (req, res) => {
    try {
        const trendingTopics = await Topic_1.default.getTrending();
        res.json({
            success: true,
            topics: trendingTopics.map(topic => ({
                id: topic._id,
                name: topic.name,
                category: topic.category,
                source: topic.source,
                trending: topic.trending,
                usageCount: topic.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching trending topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending topics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=topics.js.map