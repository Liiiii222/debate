import express, { Response } from 'express'
import { db } from '../config/firebaseAdmin'
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware'
import { validateUserPreferences } from '../middleware/validation'
import { searchingUsers, awaitingRematch } from '../socket/handlers'

const router = express.Router()

function resolveFormat(formatsA: string[], formatsB: string[]): string {
  const anyA = formatsA.includes('Any format') || formatsA.length === 0
  const anyB = formatsB.includes('Any format') || formatsB.length === 0
  if (anyA && anyB) return 'Text'
  if (anyA) return formatsB.find(f => f !== 'Any format') || 'Text'
  if (anyB) return formatsA.find(f => f !== 'Any format') || 'Text'
  const common = formatsA.find(f => formatsB.includes(f))
  return common || formatsA[0] || 'Text'
}

function getAgeRange(age: number | null | undefined): string | null {
  if (!age) return null
  if (age >= 14 && age <= 17) return '14-17'
  if (age >= 18 && age <= 25) return '18-25'
  if (age >= 26 && age <= 35) return '26-35'
  if (age >= 36 && age <= 45) return '36-45'
  if (age >= 46 && age <= 55) return '46-55'
  if (age >= 56 && age <= 65) return '56-65'
  if (age > 65) return '65+'
  return null
}

// Check whether preferences are compatible with a real profile
function preferencesCompatibleWithProfile(preferences: any, profile: any): boolean {
  // Age: only reject if a specific range was requested AND candidate doesn't match
  if (preferences.ageRange && preferences.ageRange !== 'Any age') {
    const theirRange = getAgeRange(profile.age)
    if (theirRange !== preferences.ageRange) return false
  }
  // Languages: only reject if specific languages were requested AND no overlap
  const wantedLangs: string[] = preferences.languages || []
  if (wantedLangs.length > 0) {
    const theirLangs: string[] = profile.languages || []
    if (!wantedLangs.some(l => theirLangs.includes(l))) return false
  }
  // Country: only reject if specific countries were requested AND no match
  const wantedCountries: string[] = preferences.countries || []
  if (wantedCountries.length > 0) {
    if (!wantedCountries.includes(profile.country || '')) return false
  }
  // Format: only reject if both sides have specific non-overlapping formats
  const myFormats: string[] = preferences.debateFormats || []
  const theirFormats: string[] = profile.preferences?.debateFormats || []
  const myAny = myFormats.includes('Any format') || myFormats.length === 0
  const theirAny = theirFormats.includes('Any format') || theirFormats.length === 0
  if (!myAny && !theirAny) {
    if (!myFormats.some(f => theirFormats.includes(f))) return false
  }
  return true
}

// Compatibility score 0–100.
// Key rule: "Any" = full marks (I don't care = perfect match for that criterion).
// Specific preference matched = full marks.
// Specific preference NOT matched = 0 (already filtered out, but guarded here too).
function compatibilityScore(
  myPrefs: any, myProfile: any,
  theirPrefs: any, theirProfile: any
): number {
  let score = 0
  const MAX = 100

  // ── How well does THEIR profile satisfy MY preferences ──
  // Age (weight 25)
  if (!myPrefs.ageRange || myPrefs.ageRange === 'Any age') {
    score += 25 // I said Any → full marks
  } else {
    if (getAgeRange(theirProfile.age) === myPrefs.ageRange) score += 25
  }
  // Languages (weight 25)
  const myWantedLangs: string[] = myPrefs.languages || []
  if (myWantedLangs.length === 0) {
    score += 25 // Any language → full marks
  } else {
    const theirLangs: string[] = theirProfile.languages || []
    const matches = myWantedLangs.filter(l => theirLangs.includes(l)).length
    score += matches > 0 ? Math.min(25, Math.round(25 * matches / myWantedLangs.length)) : 0
  }

  // ── How well does MY profile satisfy THEIR preferences ──
  // Age (weight 25)
  if (!theirPrefs.ageRange || theirPrefs.ageRange === 'Any age') {
    score += 25 // They said Any → full marks
  } else {
    if (getAgeRange(myProfile.age) === theirPrefs.ageRange) score += 25
  }
  // Languages (weight 25)
  const theirWantedLangs: string[] = theirPrefs.languages || []
  if (theirWantedLangs.length === 0) {
    score += 25 // Any language → full marks
  } else {
    const myLangs: string[] = myProfile.languages || []
    const matches = theirWantedLangs.filter(l => myLangs.includes(l)).length
    score += matches > 0 ? Math.min(25, Math.round(25 * matches / theirWantedLangs.length)) : 0
  }

  return Math.min(100, score)
}

router.post('/', authMiddleware, validateUserPreferences, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    const uid = req.user.uid
    const preferences = req.body

    const myProfileDoc = await db.collection('users').doc(uid).get()
    const myProfile = myProfileDoc.exists ? myProfileDoc.data() : {}

    await db.collection('users').doc(uid).set({
      uid, preferences, isSearching: true, lastActive: new Date()
    }, { merge: true })

    // ── Check rematch queue first ─────────────────────────────────
    for (const [waitingUid, waitingData] of awaitingRematch.entries()) {
      if (waitingUid === uid) continue
      if (waitingData.category !== preferences.category) continue
      // Check basic compatibility
      const waitingProfileDoc = await db.collection('users').doc(waitingUid).get()
      const waitingProfile = waitingProfileDoc.exists ? waitingProfileDoc.data() : {}
      if (
        preferencesCompatibleWithProfile(preferences, waitingProfile) &&
        preferencesCompatibleWithProfile(waitingData.preferences, myProfile)
      ) {
        const score = compatibilityScore(preferences, myProfile, waitingData.preferences, waitingProfile)
        clearTimeout(waitingData.timeout)
        awaitingRematch.delete(waitingUid)

        const myName = (myProfile as any)?.name || (myProfile as any)?.displayName || `Debater ${uid.slice(0,6)}`
        const myPic = (myProfile as any)?.profilePicture || ''
        const waitingName = (waitingProfile as any)?.name || (waitingProfile as any)?.displayName || `Debater ${waitingUid.slice(0,6)}`
        const waitingPic = (waitingProfile as any)?.profilePicture || ''

        // Resolve format: prefer waiting user format, intersect with new user prefs
        const newFormats: string[] = preferences.debateFormats || []
        const resolvedFormat = newFormats.includes(waitingData.debateFormat) || newFormats.length === 0
          ? waitingData.debateFormat
          : (newFormats[0] || 'Text')

        const matchRoomId = [uid, waitingUid].sort().join('__match__')

        const io = (global as any).__io
        if (io) {
          // Send offer to WAITING user (in debate room)
          io.to(waitingData.socketId).emit('quick-match-offer', {
            offeredUid: uid,
            name: myName,
            profilePicture: myPic,
            topic: waitingData.topic,
            category: waitingData.category,
            debateFormat: resolvedFormat,
            matchScore: score,
            matchRoomId
          })
        }

        await db.collection('users').doc(uid).update({ isSearching: false })

        // Return match to NEW user — same format as normal match so Matchmaking component handles it
        res.json({
          success: true,
          match: {
            id: waitingUid,
            name: waitingName,
            ageRange: getAgeRange((waitingProfile as any)?.age) || 'Unknown',
            country: (waitingProfile as any)?.country || 'Unknown',
            languages: (waitingProfile as any)?.languages || [],
            matchScore: score,
            resolvedFormat,
            topic: waitingData.topic,
            category: waitingData.category,
            matchRoomId,
            isRematch: true
          },
          uid
        })
        return
      }
    }

    const snap = await db.collection('users').where('isSearching', '==', true).get()
    const candidates = snap.docs
      .map(doc => doc.data())
      .filter(u => u.uid !== uid && u.preferences?.category === preferences.category)

    const compatible = candidates.filter(c => {
      return preferencesCompatibleWithProfile(c.preferences || {}, myProfile) &&
             preferencesCompatibleWithProfile(preferences, c)
    })

    if (compatible.length > 0) {
      const scored = compatible.map(c => ({
        candidate: c,
        score: compatibilityScore(preferences, myProfile, c.preferences || {}, c)
      }))
      scored.sort((a, b) => b.score - a.score)
      const best = scored[0].candidate
      const score = scored[0].score

      await Promise.all([
        db.collection('users').doc(uid).update({ isSearching: false }),
        db.collection('users').doc(best.uid).update({ isSearching: false })
      ])

      const io = (global as any).__io
      if (io) {
        const resolvedFormat = resolveFormat(preferences.debateFormats || [], best.preferences?.debateFormats || [])
        const matchPayload = {
          matchedUid: best.uid,
          matchedName: best.name || best.displayName || `Debater ${best.uid.slice(0, 8)}`,
          matchScore: score,
          ageRange: getAgeRange(best.age) || 'Unknown',
          country: best.country || 'Unknown',
          languages: best.languages || [],
          resolvedFormat
        }
        const reversePayload = {
          matchedUid: uid,
          matchedName: (myProfile as any)?.name || (myProfile as any)?.displayName || `Debater ${uid.slice(0, 8)}`,
          matchScore: score,
          ageRange: getAgeRange((myProfile as any)?.age) || 'Unknown',
          country: (myProfile as any)?.country || 'Unknown',
          languages: (myProfile as any)?.languages || [],
          resolvedFormat
        }
        const partnerSocketId = searchingUsers.get(best.uid)
        if (partnerSocketId) { io.to(partnerSocketId).emit('match-found', reversePayload); searchingUsers.delete(best.uid) }
        const mySocketId = searchingUsers.get(uid)
        if (mySocketId) { io.to(mySocketId).emit('match-found', matchPayload); searchingUsers.delete(uid) }
      }

      res.json({
        success: true,
        match: {
          id: best.uid,
          name: best.name || best.displayName || `Debater ${best.uid.slice(0, 8)}`,
          ageRange: getAgeRange(best.age) || 'Unknown',
          country: best.country || 'Unknown',
          languages: best.languages || [],
          matchScore: score,
          resolvedFormat: resolveFormat(preferences.debateFormats || [], best.preferences?.debateFormats || [])
        },
        uid
      })
    } else {
      res.json({ success: true, match: null, uid })
    }
  } catch (error) {
    console.error('Matchmaking error:', error)
    res.status(500).json({ success: false, error: 'Failed to find match' })
  }
})

router.put('/active', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    await db.collection('users').doc(req.user.uid).update({ lastActive: new Date() })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, error: 'Failed to update activity' }) }
})

router.delete('/', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.uid) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    await db.collection('users').doc(req.user.uid).update({ isSearching: false })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, error: 'Failed to end session' }) }
})

router.get('/stats', async (_req, res: Response): Promise<void> => {
  try {
    const allSnap = await db.collection('users').get()
    const totalUsers = allSnap.size
    const searchingCount = allSnap.docs.filter(d => d.data().isSearching === true).length
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsers = allSnap.docs.filter(d => {
      const lastActive = d.data().lastActive
      return lastActive && lastActive.toDate && lastActive.toDate() >= fiveMinAgo
    }).length
    res.json({ success: true, stats: { totalUsers, searchingUsers: searchingCount, activeUsers } })
  } catch { res.status(500).json({ success: false, error: 'Failed to fetch stats' }) }
})

export default router
