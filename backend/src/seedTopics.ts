// One-time script to add starter "default" topics to Firestore, organized by category.
// Run once with: npx ts-node src/seedTopics.ts
// Safe to run more than once - it skips any topic that already exists in its category.

import { db } from './config/firebaseAdmin'

const DEFAULT_TOPICS: Record<string, string[]> = {
  'Politics': [
    'Climate Change Policy',
    'Universal Basic Income',
    'Electoral Reform',
    'Immigration Policy',
    'Healthcare Reform'
  ],
  'Technology': [
    'Artificial Intelligence Ethics',
    'Social Media Regulation',
    'Cryptocurrency Future',
    'Privacy vs Security',
    'Remote Work Culture'
  ],
  'Environment': [
    'Renewable Energy Transition',
    'Plastic Pollution',
    'Carbon Tax Implementation',
    'Sustainable Agriculture',
    'Wildlife Conservation'
  ],
  'Healthcare': [
    'Universal Healthcare',
    'Mental Health Awareness',
    'Vaccine Mandates',
    'Alternative Medicine',
    'Healthcare Costs'
  ],
  'Education': [
    'Online vs Traditional Education',
    'Student Loan Forgiveness',
    'Standardized Testing',
    'Critical Race Theory',
    'School Choice'
  ],
  'Economy': [
    'Minimum Wage Increase',
    'Wealth Inequality',
    'Free Trade vs Protectionism',
    'Tax Reform',
    'Economic Recovery'
  ],
  'Social Issues': [
    'Gender Equality',
    'Racial Justice',
    'LGBTQ+ Rights',
    'Gun Control',
    'Religious Freedom'
  ],
  'Science': [
    'Space Exploration Funding',
    'Genetic Engineering',
    'Animal Testing',
    'Nuclear Energy',
    'Scientific Funding'
  ]
}

async function seed() {
  const existingSnap = await db.collection('topics').get()
  const existingByCategory = new Map<string, Set<string>>()
  existingSnap.docs.forEach(doc => {
    const data = doc.data()
    const cat = data.category || ''
    const nameLower = (data.name || '').toLowerCase()
    if (!existingByCategory.has(cat)) existingByCategory.set(cat, new Set())
    existingByCategory.get(cat)!.add(nameLower)
  })

  let added = 0
  for (const [category, topicNames] of Object.entries(DEFAULT_TOPICS)) {
    for (const name of topicNames) {
      const existingNames = existingByCategory.get(category) || new Set()
      if (existingNames.has(name.toLowerCase())) {
        console.log(`Skipping "${name}" in ${category} - already exists`)
        continue
      }
      await db.collection('topics').add({
        name,
        category,
        source: 'default',
        trending: false,
        usageCount: 0
      })
      console.log(`Added "${name}" to ${category}`)
      added++
    }
  }

  console.log(`\nDone. Added ${added} new topics.`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
