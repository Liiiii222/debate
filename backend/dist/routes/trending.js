"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const Topic_1 = __importDefault(require("../models/Topic"));
const router = express_1.default.Router();
router.get('/news', async (req, res) => {
    try {
        const newsApiKey = process.env.NEWS_API_KEY;
        if (!newsApiKey) {
            res.json({
                success: true,
                topics: [],
                message: 'NewsAPI key not configured'
            });
            return;
        }
        const response = await axios_1.default.get(`https://newsapi.org/v2/top-headlines`, {
            params: {
                country: 'us',
                apiKey: newsApiKey,
                pageSize: 20
            }
        });
        const topics = response.data.articles
            .slice(0, 10)
            .map((article, index) => ({
            id: `news-${index}`,
            name: article.title,
            category: 'News',
            source: 'external',
            trending: true,
            usageCount: 0
        }));
        res.json({
            success: true,
            topics
        });
    }
    catch (error) {
        console.error('Error fetching news trends:', error);
        res.json({
            success: true,
            topics: [],
            message: 'Unable to fetch news trends'
        });
    }
});
router.get('/reddit', async (req, res) => {
    try {
        const response = await axios_1.default.get('https://www.reddit.com/r/all/hot.json', {
            params: {
                limit: 20
            },
            headers: {
                'User-Agent': 'DebateApp/1.0'
            }
        });
        const topics = response.data.data.children
            .slice(0, 10)
            .map((post, index) => ({
            id: `reddit-${index}`,
            name: post.data.title,
            category: 'Social Media',
            source: 'external',
            trending: true,
            usageCount: 0
        }));
        res.json({
            success: true,
            topics
        });
    }
    catch (error) {
        console.error('Error fetching Reddit trends:', error);
        res.json({
            success: true,
            topics: [],
            message: 'Unable to fetch Reddit trends'
        });
    }
});
router.get('/twitter', async (req, res) => {
    try {
        res.json({
            success: true,
            topics: [],
            message: 'Twitter API integration requires authentication'
        });
    }
    catch (error) {
        console.error('Error fetching Twitter trends:', error);
        res.json({
            success: true,
            topics: [],
            message: 'Unable to fetch Twitter trends'
        });
    }
});
router.get('/google', async (req, res) => {
    try {
        res.json({
            success: true,
            topics: [],
            message: 'Google Trends API integration requires setup'
        });
    }
    catch (error) {
        console.error('Error fetching Google trends:', error);
        res.json({
            success: true,
            topics: [],
            message: 'Unable to fetch Google trends'
        });
    }
});
router.get('/all', async (req, res) => {
    try {
        const [newsResponse, redditResponse] = await Promise.allSettled([
            axios_1.default.get(`${req.protocol}://${req.get('host')}/api/trending/news`),
            axios_1.default.get(`${req.protocol}://${req.get('host')}/api/trending/reddit`)
        ]);
        const allTopics = [];
        if (newsResponse.status === 'fulfilled' && newsResponse.value.data.success) {
            allTopics.push(...newsResponse.value.data.topics);
        }
        if (redditResponse.status === 'fulfilled' && redditResponse.value.data.success) {
            allTopics.push(...redditResponse.value.data.topics);
        }
        const dbTrendingTopics = await Topic_1.default.getTrending();
        const dbTopics = dbTrendingTopics.map(topic => ({
            id: topic._id.toString(),
            name: topic.name,
            category: topic.category,
            source: topic.source,
            trending: topic.trending,
            usageCount: topic.usageCount
        }));
        allTopics.push(...dbTopics);
        res.json({
            success: true,
            topics: allTopics.slice(0, 50)
        });
    }
    catch (error) {
        console.error('Error fetching all trending topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending topics'
        });
    }
});
router.post('/sync', async (req, res) => {
    try {
        const response = await axios_1.default.get(`${req.protocol}://${req.get('host')}/api/trending/all`);
        if (!response.data.success) {
            throw new Error('Failed to fetch trending topics');
        }
        const topics = response.data.topics;
        const syncResults = [];
        for (const topic of topics) {
            try {
                const existingTopic = await Topic_1.default.findOne({
                    name: { $regex: new RegExp(`^${topic.name}$`, 'i') }
                });
                if (!existingTopic) {
                    const newTopic = new Topic_1.default({
                        name: topic.name,
                        category: topic.category || 'General',
                        source: topic.source,
                        trending: topic.trending,
                        usageCount: topic.usageCount || 0
                    });
                    await newTopic.save();
                    syncResults.push({ name: topic.name, status: 'created' });
                }
                else {
                    existingTopic.trending = true;
                    await existingTopic.save();
                    syncResults.push({ name: topic.name, status: 'updated' });
                }
            }
            catch (error) {
                syncResults.push({
                    name: topic.name,
                    status: 'error',
                    error: error?.message || 'Unknown error'
                });
            }
        }
        res.json({
            success: true,
            message: 'Trending topics synced',
            results: syncResults
        });
    }
    catch (error) {
        console.error('Error syncing trending topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to sync trending topics'
        });
    }
});
exports.default = router;
//# sourceMappingURL=trending.js.map