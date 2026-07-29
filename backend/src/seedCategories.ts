// One-time script to add starter "default" categories to Firestore.
// Run once with: npx ts-node src/seedCategories.ts
// Safe to run more than once - it skips any category that already exists.

import { db } from './config/firebaseAdmin'

const DEFAULT_CATEGORIES = [
  'Politics',
  'Technology',
  'Environment',
  'Healthcare',
  'Education',
  'Economy',
  'Social Issues',
  'Science',
  'Sports',
  'Entertainment'
]

async function seed() {
  const existingSnap = await db.collection('categories').get()
  const existingNames = new Set(existingSnap.docs.map(doc => (doc.data().name || '').toLowerCase()))

  let added = 0
  for (const name of DEFAULT_CATEGORIES) {
    if (existingNames.has(name.toLowerCase())) {
      console.log(`Skipping "${name}" - already exists`)
      continue
    }
    await db.collection('categories').add({
      name,
      source: 'default',
      trending: false,
      usageCount: 0
    })
    console.log(`Added "${name}"`)
    added++
  }

  console.log(`\nDone. Added ${added} new categories.`)
  process.exit(0)
}

seed().catch(err => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
