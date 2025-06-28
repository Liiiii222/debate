import express, { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import User from '../models/User'
import { validateUserPreferences } from '../middleware/validation'

const router = express.Router()

// POST /api/matchmaking - Find a debate partner
router.post('/', validateUserPreferences, async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = req.body
    const uid = uuidv4() // For anonymous matchmaking, generate a temp uid

    // Create or update user session
    const user = new User({
      uid,
      preferences,
      isSearching: true,
      lastActive: new Date()
    })

    await user.save()

    // Find potential matches
    const matches = await User.findMatches(preferences, uid)

    if (matches.length > 0) {
      // Find the best match (first one for now, could implement scoring algorithm)
      const bestMatch = matches[0]
      
      // Mark both users as not searching
      await Promise.all([
        User.findByIdAndUpdate(user._id, { isSearching: false }),
        User.findByIdAndUpdate(bestMatch._id, { isSearching: false })
      ])

      // Calculate match score (simple implementation)
      const matchScore = calculateMatchScore(preferences, bestMatch.preferences)

      res.json({
        success: true,
        match: {
          id: bestMatch.uid,
          name: `Debater ${bestMatch.uid.slice(0, 8)}`,
          ageRange: bestMatch.preferences.ageRange,
          country: bestMatch.preferences.country,
          university: bestMatch.preferences.university,
          matchScore
        },
        uid
      })
    } else {
      // No match found, keep user in searching state
      res.json({
        success: true,
        match: null,
        uid
      })
    }
  } catch (error) {
    console.error('Error in matchmaking:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to find match'
    })
  }
})

// PUT /api/matchmaking/:uid/active - Update user activity
router.put('/:uid/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.params

    const user = await User.findOne({ uid })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User session not found'
      })
      return
    }

    user.updateLastActive()
    await user.save()

    res.json({
      success: true,
      message: 'Activity updated'
    })
  } catch (error) {
    console.error('Error updating user activity:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update activity'
    })
  }
})

// DELETE /api/matchmaking/:uid - End user session
router.delete('/:uid', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uid } = req.params

    const user = await User.findOne({ uid })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User session not found'
      })
      return
    }

    user.isSearching = false
    await user.save()

    res.json({
      success: true,
      message: 'Session ended'
    })
  } catch (error) {
    console.error('Error ending user session:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    })
  }
})

// GET /api/matchmaking/stats - Get matchmaking statistics
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalUsers, searchingUsers, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isSearching: true }),
      User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } })
    ])

    res.json({
      success: true,
      stats: {
        totalUsers,
        searchingUsers,
        activeUsers,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching matchmaking stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    })
  }
})

// Helper function to calculate match score
function calculateMatchScore(preferences1: any, preferences2: any): number {
  let score = 0
  let totalFactors = 0

  // Category and topic match (highest weight)
  if (preferences1.category === preferences2.category) {
    score += 40
  }
  totalFactors += 40

  if (preferences1.topic === preferences2.topic) {
    score += 30
  }
  totalFactors += 30

  // Age range match
  if (preferences1.ageRange === preferences2.ageRange || 
      preferences1.ageRange === 'Any age' || 
      preferences2.ageRange === 'Any age') {
    score += 10
  }
  totalFactors += 10

  // Language match
  if (preferences1.language === preferences2.language || 
      preferences1.language === 'Any language' || 
      preferences2.language === 'Any language') {
    score += 10
  }
  totalFactors += 10

  // Country match
  if (preferences1.country === preferences2.country || 
      preferences1.country === 'Any country' || 
      preferences2.country === 'Any country') {
    score += 5
  }
  totalFactors += 5

  // University match (bonus)
  if (preferences1.university && preferences2.university && 
      preferences1.university === preferences2.university) {
    score += 5
  }
  totalFactors += 5

  return Math.round((score / totalFactors) * 100)
}

export default router 