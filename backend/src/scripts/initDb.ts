import mongoose from 'mongoose'
import Category from '../models/Category'
import Topic from '../models/Topic'
import dotenv from 'dotenv'

dotenv.config()

const defaultCategories = [
  { name: 'Politics', source: 'popular', trending: true, usageCount: 150 },
  { name: 'Technology', source: 'popular', trending: true, usageCount: 120 },
  { name: 'Environment', source: 'popular', trending: true, usageCount: 100 },
  { name: 'Healthcare', source: 'popular', trending: false, usageCount: 80 },
  { name: 'Education', source: 'popular', trending: false, usageCount: 75 },
  { name: 'Economy', source: 'popular', trending: false, usageCount: 70 },
  { name: 'Social Issues', source: 'popular', trending: false, usageCount: 65 },
  { name: 'Science', source: 'popular', trending: false, usageCount: 60 },
]

const defaultTopics = [
  // Politics
  { name: 'Climate Change Policy', category: 'Politics', source: 'popular', trending: true, usageCount: 45 },
  { name: 'Universal Basic Income', category: 'Politics', source: 'popular', trending: true, usageCount: 40 },
  { name: 'Electoral Reform', category: 'Politics', source: 'popular', trending: false, usageCount: 30 },
  { name: 'Immigration Policy', category: 'Politics', source: 'popular', trending: false, usageCount: 25 },
  { name: 'Healthcare Reform', category: 'Politics', source: 'popular', trending: false, usageCount: 20 },

  // Technology
  { name: 'Artificial Intelligence Ethics', category: 'Technology', source: 'popular', trending: true, usageCount: 50 },
  { name: 'Social Media Regulation', category: 'Technology', source: 'popular', trending: true, usageCount: 45 },
  { name: 'Cryptocurrency Future', category: 'Technology', source: 'popular', trending: false, usageCount: 35 },
  { name: 'Privacy vs Security', category: 'Technology', source: 'popular', trending: false, usageCount: 30 },
  { name: 'Remote Work Culture', category: 'Technology', source: 'popular', trending: false, usageCount: 25 },

  // Environment
  { name: 'Renewable Energy Transition', category: 'Environment', source: 'popular', trending: true, usageCount: 40 },
  { name: 'Plastic Pollution', category: 'Environment', source: 'popular', trending: true, usageCount: 35 },
  { name: 'Carbon Tax Implementation', category: 'Environment', source: 'popular', trending: false, usageCount: 25 },
  { name: 'Sustainable Agriculture', category: 'Environment', source: 'popular', trending: false, usageCount: 20 },
  { name: 'Wildlife Conservation', category: 'Environment', source: 'popular', trending: false, usageCount: 15 },

  // Healthcare
  { name: 'Universal Healthcare', category: 'Healthcare', source: 'popular', trending: true, usageCount: 35 },
  { name: 'Mental Health Awareness', category: 'Healthcare', source: 'popular', trending: false, usageCount: 25 },
  { name: 'Vaccine Mandates', category: 'Healthcare', source: 'popular', trending: false, usageCount: 20 },
  { name: 'Alternative Medicine', category: 'Healthcare', source: 'popular', trending: false, usageCount: 15 },
  { name: 'Healthcare Costs', category: 'Healthcare', source: 'popular', trending: false, usageCount: 10 },

  // Education
  { name: 'Online vs Traditional Education', category: 'Education', source: 'popular', trending: true, usageCount: 30 },
  { name: 'Student Loan Forgiveness', category: 'Education', source: 'popular', trending: false, usageCount: 25 },
  { name: 'Standardized Testing', category: 'Education', source: 'popular', trending: false, usageCount: 20 },
  { name: 'Critical Race Theory', category: 'Education', source: 'popular', trending: false, usageCount: 15 },
  { name: 'School Choice', category: 'Education', source: 'popular', trending: false, usageCount: 10 },

  // Economy
  { name: 'Minimum Wage Increase', category: 'Economy', source: 'popular', trending: true, usageCount: 30 },
  { name: 'Wealth Inequality', category: 'Economy', source: 'popular', trending: false, usageCount: 25 },
  { name: 'Free Trade vs Protectionism', category: 'Economy', source: 'popular', trending: false, usageCount: 20 },
  { name: 'Tax Reform', category: 'Economy', source: 'popular', trending: false, usageCount: 15 },
  { name: 'Economic Recovery', category: 'Economy', source: 'popular', trending: false, usageCount: 10 },

  // Social Issues
  { name: 'Gender Equality', category: 'Social Issues', source: 'popular', trending: true, usageCount: 30 },
  { name: 'Racial Justice', category: 'Social Issues', source: 'popular', trending: false, usageCount: 25 },
  { name: 'LGBTQ+ Rights', category: 'Social Issues', source: 'popular', trending: false, usageCount: 20 },
  { name: 'Gun Control', category: 'Social Issues', source: 'popular', trending: false, usageCount: 15 },
  { name: 'Religious Freedom', category: 'Social Issues', source: 'popular', trending: false, usageCount: 10 },

  // Science
  { name: 'Space Exploration Funding', category: 'Science', source: 'popular', trending: true, usageCount: 25 },
  { name: 'Genetic Engineering', category: 'Science', source: 'popular', trending: false, usageCount: 20 },
  { name: 'Animal Testing', category: 'Science', source: 'popular', trending: false, usageCount: 15 },
  { name: 'Nuclear Energy', category: 'Science', source: 'popular', trending: false, usageCount: 10 },
  { name: 'Scientific Funding', category: 'Science', source: 'popular', trending: false, usageCount: 5 },
]

async function initializeDatabase() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/debate-app'
    
    console.log('Connecting to MongoDB...')
    await mongoose.connect(mongoURI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing data...')
    await Promise.all([
      Category.deleteMany({}),
      Topic.deleteMany({})
    ])
    console.log('✅ Cleared existing data')

    // Insert default categories
    console.log('Inserting default categories...')
    const categories = await Category.insertMany(defaultCategories)
    console.log(`✅ Inserted ${categories.length} categories`)

    // Insert default topics
    console.log('Inserting default topics...')
    const topics = await Topic.insertMany(defaultTopics)
    console.log(`✅ Inserted ${topics.length} topics`)

    console.log('🎉 Database initialization completed successfully!')
    
    // Display summary
    const categoryCount = await Category.countDocuments()
    const topicCount = await Topic.countDocuments()
    const trendingCategories = await Category.countDocuments({ trending: true })
    const trendingTopics = await Topic.countDocuments({ trending: true })

    console.log('\n📊 Database Summary:')
    console.log(`Categories: ${categoryCount} (${trendingCategories} trending)`)
    console.log(`Topics: ${topicCount} (${trendingTopics} trending)`)

  } catch (error) {
    console.error('❌ Error initializing database:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

// Run the initialization
initializeDatabase() 