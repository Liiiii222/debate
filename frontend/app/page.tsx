'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import CategorySelection from '@/components/CategorySelection'
import TopicSelection from '@/components/TopicSelection'
import PartnerPreferences from '@/components/PartnerPreferences'
import Matchmaking from '@/components/Matchmaking'
import VideoDebatePage from '@/components/VideoDebatePage'
import VoiceDebatePage from '@/components/VoiceDebatePage'
import TextDebatePage from '@/components/TextDebatePage'

export type AppStep = 'landing' | 'categories' | 'topics' | 'preferences' | 'matchmaking' | 'debate-video' | 'debate-voice' | 'debate-text'

export type UserPreferences = {
  category: string
  topic: string
  ageRange: string
  languages: string[]
  countries: string[]
  debateFormats: string[]
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing')
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    category: '', topic: '', ageRange: 'Any age', languages: [], countries: [], debateFormats: []
  })
  const [matchedUid, setMatchedUid] = useState<string>('')

  // Check for pending rematch from debate page navigation
  useEffect(() => {
    const pending = sessionStorage.getItem('_pendingRematch')
    if (pending) {
      try {
        const d = JSON.parse(pending)
        sessionStorage.removeItem('_pendingRematch')
        setMatchedUid(d.matchedUid)
        setUserPreferences(prev => ({ ...prev, topic: d.topic || prev.topic, category: d.category || prev.category, debateFormats: [d.format || 'Text'] }))
        const step = d.format === 'Video' ? 'debate-video' : d.format === 'Voice' ? 'debate-voice' : 'debate-text'
        setCurrentStep(step as AppStep)
      } catch {}
    }
  }, [])

  const handleCategorySelect = (category: string) => {
    setUserPreferences(prev => ({ ...prev, category }))
    setCurrentStep('topics')
  }

  const handleTopicSelect = (topic: string) => {
    setUserPreferences(prev => ({ ...prev, topic }))
    setCurrentStep('preferences')
  }

  const handlePreferencesSubmit = (preferences: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({ ...prev, ...preferences }))
    setCurrentStep('matchmaking')
  }

  const handleStartDebate = (formats: string[], uid: string) => {
    setMatchedUid(uid)
    if (formats.includes('Video')) setCurrentStep('debate-video')
    else if (formats.includes('Voice')) setCurrentStep('debate-voice')
    else setCurrentStep('debate-text')
  }

  const handleBackToLanding = () => {
    setCurrentStep('landing')
    setMatchedUid('')
    setUserPreferences({ category: '', topic: '', ageRange: 'Any age', languages: [], countries: [], debateFormats: [] })
  }

  const isDebating = currentStep === 'debate-video' || currentStep === 'debate-voice' || currentStep === 'debate-text'

  return (
    <div className="scrollable-content bg-gray-50">
      {!isDebating && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        {currentStep === 'preferences' ? (
          <div className="w-full flex justify-center px-4 py-8">
            <PartnerPreferences onPreferencesSubmit={handlePreferencesSubmit} onBack={() => setCurrentStep('topics')} />
          </div>
        ) : (
          <>
            {currentStep === 'landing' && (
              <div className="max-w-4xl mx-auto text-center">
                <div className="animate-fade-in">
                  <h1 className="text-6xl font-bold text-gray-900 mb-6">Welcome to Debate</h1>
                  <p className="text-xl text-gray-600 mb-8">Connect with like-minded individuals for meaningful debates on trending topics</p>
                  <button onClick={() => setCurrentStep('categories')} className="btn-primary text-lg px-8 py-3">Choose a Category</button>
                </div>
              </div>
            )}
            {currentStep === 'categories' && (
              <CategorySelection onCategorySelect={handleCategorySelect} onBack={handleBackToLanding} />
            )}
            {currentStep === 'topics' && (
              <TopicSelection category={userPreferences.category} onTopicSelect={handleTopicSelect} onBack={() => setCurrentStep('categories')} />
            )}
            {currentStep === 'matchmaking' && (
              <Matchmaking userPreferences={userPreferences} onBack={handleBackToLanding} onStartDebate={handleStartDebate} />
            )}
            {currentStep === 'debate-video' && <VideoDebatePage userPreferences={userPreferences} matchedUid={matchedUid} />}
            {currentStep === 'debate-voice' && <VoiceDebatePage userPreferences={userPreferences} matchedUid={matchedUid} />}
            {currentStep === 'debate-text' && <TextDebatePage userPreferences={userPreferences} matchedUid={matchedUid} />}
          </>
        )}
      </main>
    </div>
  )
}
