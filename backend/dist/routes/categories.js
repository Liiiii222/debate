"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Category_1 = __importDefault(require("../models/Category"));
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const [trendingCategories, popularCategories, userCategories, defaultCategories] = await Promise.all([
            Category_1.default.getTrending(),
            Category_1.default.getPopular(),
            Category_1.default.getUserCategories(),
            Category_1.default.getDefault()
        ]);
        const categories = [
            ...trendingCategories,
            ...popularCategories,
            ...userCategories,
            ...defaultCategories
        ];
        res.json({
            success: true,
            categories: categories.map(cat => ({
                id: cat._id,
                name: cat.name,
                source: cat.source,
                trending: cat.trending,
                usageCount: cat.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
});
router.get('/default', async (req, res) => {
    try {
        const defaultCategories = await Category_1.default.getDefault();
        res.json({
            success: true,
            categories: defaultCategories.map(cat => ({
                id: cat._id,
                name: cat.name,
                source: cat.source,
                trending: cat.trending,
                usageCount: cat.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching default categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch default categories'
        });
    }
});
router.get('/popular', async (req, res) => {
    try {
        const popularCategories = await Category_1.default.getUserPopular();
        res.json({
            success: true,
            categories: popularCategories.map(cat => ({
                id: cat._id,
                name: cat.name,
                source: cat.source,
                trending: cat.trending,
                usageCount: cat.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching popular categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch popular categories'
        });
    }
});
router.post('/', validation_1.validateCategory, async (req, res) => {
    try {
        const { name } = req.body;
        const existingCategory = await Category_1.default.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            res.status(400).json({
                success: false,
                error: 'Category already exists'
            });
            return;
        }
        const category = new Category_1.default({
            name,
            source: 'user',
            trending: false,
            usageCount: 0
        });
        await category.save();
        res.status(201).json({
            success: true,
            category: {
                id: category._id,
                name: category.name,
                source: category.source,
                trending: category.trending,
                usageCount: category.usageCount
            }
        });
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create category'
        });
    }
});
router.put('/:id/usage', async (req, res) => {
    try {
        const category = await Category_1.default.findById(req.params.id);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Category not found'
            });
            return;
        }
        category.incrementUsage();
        await category.save();
        res.json({
            success: true,
            message: 'Usage count updated'
        });
    }
    catch (error) {
        console.error('Error updating category usage:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update usage count'
        });
    }
});
router.get('/trending', async (req, res) => {
    try {
        const trendingCategories = await Category_1.default.getTrending();
        res.json({
            success: true,
            categories: trendingCategories.map(cat => ({
                id: cat._id,
                name: cat.name,
                source: cat.source,
                trending: cat.trending,
                usageCount: cat.usageCount
            }))
        });
    }
    catch (error) {
        console.error('Error fetching trending categories:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending categories'
        });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map