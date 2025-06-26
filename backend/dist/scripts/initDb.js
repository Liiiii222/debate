"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = __importDefault(require("../models/Category"));
const Topic_1 = __importDefault(require("../models/Topic"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const defaultCategories = [
    { name: 'Politics', source: 'popular', trending: true, usageCount: 150 },
    { name: 'Technology', source: 'popular', trending: true, usageCount: 120 },
    { name: 'Environment', source: 'popular', trending: true, usageCount: 100 },
    { name: 'Healthcare', source: 'popular', trending: false, usageCount: 80 },
    { name: 'Education', source: 'popular', trending: false, usageCount: 75 },
    { name: 'Economy', source: 'popular', trending: false, usageCount: 70 },
    { name: 'Social Issues', source: 'popular', trending: false, usageCount: 65 },
    { name: 'Science', source: 'popular', trending: false, usageCount: 60 },
];
const defaultTopics = [
    { name: 'Climate Change Policy', category: 'Politics', source: 'popular', trending: true, usageCount: 45 },
    { name: 'Universal Basic Income', category: 'Politics', source: 'popular', trending: true, usageCount: 40 },
    { name: 'Electoral Reform', category: 'Politics', source: 'popular', trending: false, usageCount: 30 },
    { name: 'Immigration Policy', category: 'Politics', source: 'popular', trending: false, usageCount: 25 },
    { name: 'Healthcare Reform', category: 'Politics', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Artificial Intelligence Ethics', category: 'Technology', source: 'popular', trending: true, usageCount: 50 },
    { name: 'Social Media Regulation', category: 'Technology', source: 'popular', trending: true, usageCount: 45 },
    { name: 'Cryptocurrency Future', category: 'Technology', source: 'popular', trending: false, usageCount: 35 },
    { name: 'Privacy vs Security', category: 'Technology', source: 'popular', trending: false, usageCount: 30 },
    { name: 'Remote Work Culture', category: 'Technology', source: 'popular', trending: false, usageCount: 25 },
    { name: 'Renewable Energy Transition', category: 'Environment', source: 'popular', trending: true, usageCount: 40 },
    { name: 'Plastic Pollution', category: 'Environment', source: 'popular', trending: true, usageCount: 35 },
    { name: 'Carbon Tax Implementation', category: 'Environment', source: 'popular', trending: false, usageCount: 25 },
    { name: 'Sustainable Agriculture', category: 'Environment', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Wildlife Conservation', category: 'Environment', source: 'popular', trending: false, usageCount: 15 },
    { name: 'Universal Healthcare', category: 'Healthcare', source: 'popular', trending: true, usageCount: 35 },
    { name: 'Mental Health Awareness', category: 'Healthcare', source: 'popular', trending: false, usageCount: 25 },
    { name: 'Vaccine Mandates', category: 'Healthcare', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Alternative Medicine', category: 'Healthcare', source: 'popular', trending: false, usageCount: 15 },
    { name: 'Healthcare Costs', category: 'Healthcare', source: 'popular', trending: false, usageCount: 10 },
    { name: 'Online vs Traditional Education', category: 'Education', source: 'popular', trending: true, usageCount: 30 },
    { name: 'Student Loan Forgiveness', category: 'Education', source: 'popular', trending: false, usageCount: 25 },
    { name: 'Standardized Testing', category: 'Education', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Critical Race Theory', category: 'Education', source: 'popular', trending: false, usageCount: 15 },
    { name: 'School Choice', category: 'Education', source: 'popular', trending: false, usageCount: 10 },
    { name: 'Minimum Wage Increase', category: 'Economy', source: 'popular', trending: true, usageCount: 30 },
    { name: 'Wealth Inequality', category: 'Economy', source: 'popular', trending: false, usageCount: 25 },
    { name: 'Free Trade vs Protectionism', category: 'Economy', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Tax Reform', category: 'Economy', source: 'popular', trending: false, usageCount: 15 },
    { name: 'Economic Recovery', category: 'Economy', source: 'popular', trending: false, usageCount: 10 },
    { name: 'Gender Equality', category: 'Social Issues', source: 'popular', trending: true, usageCount: 30 },
    { name: 'Racial Justice', category: 'Social Issues', source: 'popular', trending: false, usageCount: 25 },
    { name: 'LGBTQ+ Rights', category: 'Social Issues', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Gun Control', category: 'Social Issues', source: 'popular', trending: false, usageCount: 15 },
    { name: 'Religious Freedom', category: 'Social Issues', source: 'popular', trending: false, usageCount: 10 },
    { name: 'Space Exploration Funding', category: 'Science', source: 'popular', trending: true, usageCount: 25 },
    { name: 'Genetic Engineering', category: 'Science', source: 'popular', trending: false, usageCount: 20 },
    { name: 'Animal Testing', category: 'Science', source: 'popular', trending: false, usageCount: 15 },
    { name: 'Nuclear Energy', category: 'Science', source: 'popular', trending: false, usageCount: 10 },
    { name: 'Scientific Funding', category: 'Science', source: 'popular', trending: false, usageCount: 5 },
];
async function initializeDatabase() {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-app';
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(mongoURI);
        console.log('✅ Connected to MongoDB');
        console.log('Clearing existing data...');
        await Promise.all([
            Category_1.default.deleteMany({}),
            Topic_1.default.deleteMany({})
        ]);
        console.log('✅ Cleared existing data');
        console.log('Inserting default categories...');
        const categories = await Category_1.default.insertMany(defaultCategories);
        console.log(`✅ Inserted ${categories.length} categories`);
        console.log('Inserting default topics...');
        const topics = await Topic_1.default.insertMany(defaultTopics);
        console.log(`✅ Inserted ${topics.length} topics`);
        console.log('🎉 Database initialization completed successfully!');
        const categoryCount = await Category_1.default.countDocuments();
        const topicCount = await Topic_1.default.countDocuments();
        const trendingCategories = await Category_1.default.countDocuments({ trending: true });
        const trendingTopics = await Topic_1.default.countDocuments({ trending: true });
        console.log('\n📊 Database Summary:');
        console.log(`Categories: ${categoryCount} (${trendingCategories} trending)`);
        console.log(`Topics: ${topicCount} (${trendingTopics} trending)`);
    }
    catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}
initializeDatabase();
//# sourceMappingURL=initDb.js.map