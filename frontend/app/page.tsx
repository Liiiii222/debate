'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import CategorySelection from '@/components/CategorySelection'
import TopicSelection from '@/components/TopicSelection'
import PartnerPreferences from '@/components/PartnerPreferences'
import Matchmaking from '@/components/Matchmaking'
import VideoDebatePage from '@/components/VideoDebatePage'
import VoiceDebatePage from '@/components/VoiceDebatePage'
import TextDebatePage from '@/components/TextDebatePage'

const PhilosophyBackground = dynamic(() => import('@/components/PhilosophyBackground'), { ssr: false })

export type AppStep = 'landing' | 'categories' | 'topics' | 'preferences' | 'matchmaking' | 'debate-video' | 'debate-voice' | 'debate-text'

export type UserPreferences = {
  category: string
  topic: string
  ageRange: string
  languages: string[]
  countries: string[]
  university?: string
  debateFormats: string[]
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing')
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    category: '',
    topic: '',
    ageRange: 'Any age',
    languages: [],
    countries: [],
    university: '',
    debateFormats: []
  })

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

  const handleStartDebate = (formats: string[]) => {
    if (formats.includes('Video')) {
      setCurrentStep('debate-video')
    } else if (formats.includes('Voice')) {
      setCurrentStep('debate-voice')
    } else {
      setCurrentStep('debate-text')
    }
  }

  const handleBackToLanding = () => {
    setCurrentStep('landing')
    setUserPreferences({
      category: '',
      topic: '',
      ageRange: 'Any age',
      languages: [],
      countries: [],
      university: '',
      debateFormats: []
    })
  }

  const isDebating = currentStep === 'debate-video' || currentStep === 'debate-voice' || currentStep === 'debate-text'
  const isLanding = currentStep === 'landing'

  return (
    <div className="scrollable-content" style={{ background: isLanding ? '#080810' : undefined }}
      {...(!isLanding && { className: 'scrollable-content bg-gray-50' })}>

      {/* Bust background — landing only */}
      {isLanding && <PhilosophyBackground />}

      {/* Subtle gradient over bust so text is readable */}
      {isLanding && (
        <div className="fixed inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(8,8,16,0.55) 0%, rgba(8,8,16,0.15) 40%, rgba(8,8,16,0.7) 100%)',
          zIndex: 1
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 2 }}>
        {!isDebating && <Navbar />}

        <main className="container mx-auto px-4 py-8">
          {currentStep === 'preferences' ? (
            <div className="w-full flex justify-center px-4 py-8">
              <PartnerPreferences
                onPreferencesSubmit={handlePreferencesSubmit}
                onBack={() => setCurrentStep('topics')}
              />
            </div>
          ) : (
            <>
              {currentStep === 'landing' && (
                <div className="max-w-4xl mx-auto text-center" style={{ paddingTop: '30vh' }}>
                  <div className="animate-fade-in">
                    <h1 className="text-6xl font-bold mb-6" style={{ color: '#ffffff' }}>
                      Welcome to Debate
                    </h1>
                    <p className="text-xl mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Connect with like-minded individuals for meaningful debates on trending topics
                    </p>
                    <button
                      onClick={() => setCurrentStep('categories')}
                      className="btn-primary text-lg px-8 py-3"
                    >
                      Choose a Category
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 'categories' && (
                <CategorySelection onCategorySelect={handleCategorySelect} onBack={handleBackToLanding} />
              )}

              {currentStep === 'topics' && (
                <TopicSelection
                  category={userPreferences.category}
                  onTopicSelect={handleTopicSelect}
                  onBack={() => setCurrentStep('categories')}
                />
              )}

              {currentStep === 'matchmaking' && (
                <Matchmaking
                  userPreferences={userPreferences}
                  onBack={handleBackToLanding}
                  onStartDebate={() => handleStartDebate(userPreferences.debateFormats)}
                />
              )}

              {currentStep === 'debate-video' && <VideoDebatePage userPreferences={userPreferences} />}
              {currentStep === 'debate-voice' && <VoiceDebatePage userPreferences={userPreferences} />}
              {currentStep === 'debate-text' && <TextDebatePage userPreferences={userPreferences} />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
