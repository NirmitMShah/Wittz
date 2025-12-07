'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

export default function Home() {
  const [topic, setTopic] = useState('')
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
        body: JSON.stringify({ topic: topic.trim() }),
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
      
      {/* Decorative colorful blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="fixed bottom-0 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none" />
      
      <div 
        className={`relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-5xl mx-auto transition-all duration-700 ease-out ${
          hasSubmitted ? 'justify-start pt-8 sm:pt-12' : 'justify-center pt-8'
        }`}
      >
        {/* Header */}
        <div 
          className={`text-center w-full transition-all duration-700 ease-out ${
            hasSubmitted ? 'mb-8' : 'mb-20'
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
            <div className="mb-6 relative">
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

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!topic.trim() || isLoading}
                className="group relative px-10 py-4 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white rounded-full font-semibold text-base transition-all duration-300 disabled:opacity-60 shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:hover:shadow-md overflow-hidden"
                style={{
                  background: !topic.trim() || isLoading 
                    ? undefined 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  boxShadow: !topic.trim() || isLoading 
                    ? undefined
                    : '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(118, 75, 162, 0.2)',
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
                    'Submit'
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
                <MarkdownRenderer content={answer} />
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

