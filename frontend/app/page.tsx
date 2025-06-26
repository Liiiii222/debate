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
  language: string
  country: string
  university?: string
  debateFormats: string[]
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>('landing')
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    category: '',
    topic: '',
    ageRange: '',
    language: '',
    country: '',
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
    // Debate format priority: Video > Voice > Text
    const formats = preferences.debateFormats || [];
    let nextStep: AppStep = 'debate-text';
    if (formats.includes('Video')) {
      nextStep = 'debate-video';
    } else if (formats.includes('Voice')) {
      nextStep = 'debate-voice';
    } else if (formats.includes('Text')) {
      nextStep = 'debate-text';
    }
    setCurrentStep(nextStep);
  }

  const handleBackToLanding = () => {
    setCurrentStep('landing')
    setUserPreferences({
      category: '',
      topic: '',
      ageRange: '',
      language: '',
      country: '',
      university: '',
      debateFormats: []
    })
  }

  return (
    <div className="scrollable-content bg-gray-50">
      {!(currentStep === 'debate-video' || currentStep === 'debate-voice' || currentStep === 'debate-text') && <Navbar />}
      
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in">
              <h1 className="text-6xl font-bold text-gray-900 mb-6">
                Welcome to Debate
              </h1>
              <p className="text-xl text-gray-600 mb-8">
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
          <CategorySelection
            onCategorySelect={handleCategorySelect}
            onBack={handleBackToLanding}
          />
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
                onStartDebate={() => setCurrentStep('debate-video')}
              />
            )}

            {currentStep === 'debate-video' && (
              <VideoDebatePage userPreferences={userPreferences} />
            )}

            {currentStep === 'debate-voice' && (
              <VoiceDebatePage userPreferences={userPreferences} />
            )}

            {currentStep === 'debate-text' && (
              <TextDebatePage userPreferences={userPreferences} />
            )}
          </>
        )}
      </main>
    </div>
  )
} 