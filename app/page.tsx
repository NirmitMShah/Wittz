'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import Link from 'next/link'
import InteractiveMarkdownRenderer from '@/components/InteractiveMarkdownRenderer'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [showPersonalization, setShowPersonalization] = useState(false)
  const [knowledgeLevel, setKnowledgeLevel] = useState('')
  const [goal, setGoal] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [topic])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim() || isLoading) {
      return
    }

    // Move form to top immediately on submit
    setHasSubmitted(true)
    setIsLoading(true)
    setError(null)
    setAnswer('')

    try {
      const response = await fetch('/api/teach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic: topic.trim(),
          knowledgeLevel: knowledgeLevel.trim(),
          goal: goal.trim()
        }),
      })

      if (!response.ok) {
        // Try to parse JSON error if available
        try {
          const data = await response.json()
          throw new Error(data.error || 'Failed to get explanation')
        } catch {
          throw new Error('Failed to get explanation')
        }
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer.trim())
              if (data.type === 'done') {
                setAnswer(data.fullContent)
              }
            } catch {
              // Ignore parse errors
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const data = JSON.parse(line)
            
            if (data.type === 'chunk') {
              // Append chunk to answer
              setAnswer((prev) => (prev || '') + data.content)
            } else if (data.type === 'done') {
              // Text streaming complete
              setAnswer(data.fullContent)
              setIsLoading(false)
              return
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Streaming error')
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            console.warn('Failed to parse line:', line)
          }
        }
      }

      // Fallback: ensure loading state is cleared when stream ends
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Colorful gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,172,254,0.1)_0%,transparent_60%)] pointer-events-none" />
      
      {/* Build Button - Top Right */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-20">
        <Link
          href="/build"
          className="group relative px-6 py-3 text-white rounded-full font-semibold text-base transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.05] active:scale-[0.98] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(118, 75, 162, 0.2)',
          }}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10">Build</span>
        </Link>
      </div>
      
      <div 
        className={`relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-5xl mx-auto transition-all duration-700 ease-out ${
          hasSubmitted ? 'justify-start pt-4 sm:pt-6' : 'justify-center pt-4'
        }`}
      >
        {/* Header */}
        <div 
          className={`text-center w-full transition-all duration-700 ease-out ${
            hasSubmitted ? 'mb-6' : 'mb-8'
          } ${!hasSubmitted ? 'animate-fade-in' : ''}`}
        >
          <h1 
            className={`font-bold transition-all duration-700 ease-out tracking-tight text-balance ${
              hasSubmitted 
                ? 'text-3xl sm:text-4xl lg:text-5xl mb-0' 
                : 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-0'
            }`}
            style={{
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            What do you want to learn?
          </h1>
        </div>

        {/* Form Container */}
        <div 
          className={`w-full transition-all duration-700 ease-out ${
            hasSubmitted ? 'max-w-4xl' : 'max-w-3xl'
          }`}
        >
          <form onSubmit={handleSubmit} className="mb-8">
            {/* Textbox with racetrack border */}
            <div className="mb-4 relative animate-float">
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What do you want to learn?"
                className="w-full bg-white text-neutral-900 placeholder-neutral-400 resize-none outline-none text-lg leading-relaxed px-7 py-5 border-2 border-indigo-200 rounded-full transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 hover:border-purple-300 min-h-[72px] max-h-[200px] overflow-y-auto hide-scrollbar shadow-sm hover:shadow-md hover:shadow-indigo-200/50 focus:shadow-lg focus:shadow-indigo-300/50"
                style={{
                  borderRadius: '9999px',
                  fontSize: '18px',
                }}
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute inset-0 rounded-full pointer-events-none border-2 border-transparent transition-all duration-300" />
            </div>

            {/* Personalization Questions Toggle */}
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowPersonalization(!showPersonalization)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${showPersonalization ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Personalization Questions
              </button>
            </div>

            {/* Personalization Questions Section */}
            {showPersonalization && (
              <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-indigo-200 p-6 shadow-md animate-fade-in">
                <div className="space-y-5">
                  {/* Knowledge Level Question */}
                  <div>
                    <label htmlFor="knowledgeLevel" className="block text-sm font-semibold text-neutral-700 mb-2">
                      What is your current knowledge level on this topic?
                    </label>
                    <input
                      type="text"
                      id="knowledgeLevel"
                      value={knowledgeLevel}
                      onChange={(e) => setKnowledgeLevel(e.target.value)}
                      placeholder="e.g., Beginner, Intermediate, Advanced, or describe your background"
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white text-neutral-900 border-2 border-indigo-200 rounded-xl text-base transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-purple-300 shadow-sm hover:shadow-md outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Goal Question */}
                  <div>
                    <label htmlFor="goal" className="block text-sm font-semibold text-neutral-700 mb-2">
                      What is your learning goal?
                    </label>
                    <input
                      type="text"
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Understanding the basics, Preparing for an exam, Applying in practice"
                      disabled={isLoading}
                      className="w-full px-4 py-3 bg-white text-neutral-900 border-2 border-indigo-200 rounded-xl text-base transition-all duration-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 hover:border-purple-300 shadow-sm hover:shadow-md outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!topic.trim() || isLoading}
                className="group relative px-12 py-5 disabled:cursor-not-allowed text-white rounded-full font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:hover:shadow-md overflow-hidden"
                style={{
                  background: !topic.trim() || isLoading 
                    ? 'linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 50%, #fbcfe8 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  boxShadow: !topic.trim() || isLoading 
                    ? '0 10px 25px -5px rgba(99, 102, 241, 0.2), 0 10px 10px -5px rgba(118, 75, 162, 0.1)'
                    : '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(118, 75, 162, 0.2)',
                  opacity: !topic.trim() || isLoading ? 0.7 : 1,
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Thinking...
                    </>
                  ) : (
                    'Teach me'
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl text-red-700 shadow-lg animate-fade-in" style={{ boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.1), 0 4px 6px -4px rgba(239, 68, 68, 0.1)' }}>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Answer area */}
          {answer && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-indigo-100 p-8 md:p-10 shadow-xl animate-fade-in mt-4" style={{ boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)' }}>
              <div className="prose prose-neutral max-w-none">
                <InteractiveMarkdownRenderer content={answer} />
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !answer && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-purple-100 p-10 text-center shadow-lg animate-fade-in mt-4" style={{ boxShadow: '0 20px 25px -5px rgba(139, 92, 246, 0.1), 0 10px 10px -5px rgba(139, 92, 246, 0.04)' }}>
              <div className="inline-flex flex-col items-center gap-4">
                <div className="relative">
                  <svg
                    className="animate-spin h-8 w-8"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#667eea"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="#764ba2"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <span className="font-medium text-lg" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

