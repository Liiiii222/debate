import * as admin from 'firebase-admin'
import * as fs from 'fs'
import * as path from 'path'

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../firebase-service-account.json'), 'utf-8')
)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const questions: { category: string; name: string }[] = [
  // Politics
  { category: 'Politics', name: 'Should term limits be imposed on all elected officials?' },
  { category: 'Politics', name: 'Is universal basic income a viable solution to poverty?' },
  { category: 'Politics', name: 'Should voting be mandatory?' },
  { category: 'Politics', name: 'Does democracy work better than technocracy?' },
  { category: 'Politics', name: 'Should the death penalty be abolished worldwide?' },

  // Technology
  { category: 'Technology', name: 'Should AI development be regulated by governments?' },
  { category: 'Technology', name: 'Is social media doing more harm than good?' },
  { category: 'Technology', name: 'Should companies be allowed to collect user data for profit?' },
  { category: 'Technology', name: 'Will AI take more jobs than it creates?' },
  { category: 'Technology', name: 'Should access to the internet be a human right?' },

  // Science
  { category: 'Science', name: 'Should human genetic engineering be allowed?' },
  { category: 'Science', name: 'Is nuclear energy the future of clean power?' },
  { category: 'Science', name: 'Should animal testing be banned in scientific research?' },
  { category: 'Science', name: 'Is space exploration worth the cost?' },
  { category: 'Science', name: 'Should cloning of humans ever be permitted?' },

  // Economy
  { category: 'Economy', name: 'Should billionaires exist?' },
  { category: 'Economy', name: 'Is free trade always beneficial for developing countries?' },
  { category: 'Economy', name: 'Should there be a global minimum wage?' },
  { category: 'Economy', name: 'Does capitalism do more good than harm?' },
  { category: 'Economy', name: 'Should governments prioritize growth over equality?' },

  // Healthcare
  { category: 'Healthcare', name: 'Should healthcare be fully free and publicly funded?' },
  { category: 'Healthcare', name: 'Should vaccines be mandatory?' },
  { category: 'Healthcare', name: 'Is mental health treated as seriously as physical health?' },
  { category: 'Healthcare', name: 'Should euthanasia be legal everywhere?' },
  { category: 'Healthcare', name: 'Do pharmaceutical companies prioritize profit over patients?' },

  // Education
  { category: 'Education', name: 'Should university education be free?' },
  { category: 'Education', name: 'Is standardized testing an accurate measure of intelligence?' },
  { category: 'Education', name: 'Should phones be banned in schools?' },
  { category: 'Education', name: 'Is homeschooling better than traditional schooling?' },
  { category: 'Education', name: 'Should grades be abolished?' },

  // Environment
  { category: 'Environment', name: 'Should governments ban single-use plastics entirely?' },
  { category: 'Environment', name: 'Is individual action or government policy more effective against climate change?' },
  { category: 'Environment', name: 'Should eating meat be discouraged by law?' },
  { category: 'Environment', name: 'Should rich countries pay more for climate damage?' },
  { category: 'Environment', name: 'Is nuclear power better for the environment than renewables?' },

  // Social Issues
  { category: 'Social Issues', name: 'Should affirmative action exist in university admissions?' },
  { category: 'Social Issues', name: 'Is cancel culture harmful to free speech?' },
  { category: 'Social Issues', name: 'Should drugs be decriminalized?' },
  { category: 'Social Issues', name: 'Is immigration net positive for host countries?' },
  { category: 'Social Issues', name: 'Should the minimum age for social media be raised to 18?' },

  // Sports
  { category: 'Sports', name: 'Should transgender athletes compete in their identified gender category?' },
  { category: 'Sports', name: 'Are professional athletes overpaid?' },
  { category: 'Sports', name: 'Should performance-enhancing drugs be allowed in sports?' },
  { category: 'Sports', name: 'Is esports a real sport?' },
  { category: 'Sports', name: 'Should dangerous sports like boxing be banned?' },

  // Entertainment
  { category: 'Entertainment', name: 'Does violent media increase real-world violence?' },
  { category: 'Entertainment', name: 'Should streaming platforms replace traditional cinema?' },
  { category: 'Entertainment', name: 'Is celebrity culture harmful to society?' },
  { category: 'Entertainment', name: 'Should AI-generated art be considered real art?' },
  { category: 'Entertainment', name: 'Do reality TV shows do more harm than good?' },
]

async function seed() {
  const batch = db.batch()
  let count = 0

  for (const q of questions) {
    // Check if it already exists
    const existing = await db.collection('topics')
      .where('category', '==', q.category)
      .where('name', '==', q.name)
      .get()

    if (existing.empty) {
      const ref = db.collection('topics').doc()
      batch.set(ref, {
        name: q.name,
        category: q.category,
        source: 'default',
        trending: false,
        usageCount: 0,
        createdBy: null,
      })
      count++
    }
  }

  await batch.commit()
  console.log(`✓ Added ${count} questions to Firestore`)
  process.exit(0)
}

seed().catch(e => { console.error(e); process.exit(1) })
