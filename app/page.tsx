'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import MarkdownRenderer from '@/components/MarkdownRenderer'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    <div className="min-h-screen bg-[#0f0f23] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start pt-16 px-4 pb-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-semibold mb-2 text-[#ececf1]">
              Teach me anything
            </h1>
            <p className="text-[#8e8ea0] text-sm">
              Type a concept and I'll explain it like ChatGPT would.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-[#1a1a2e] rounded-lg border border-[#40414f] p-4 flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to learn?"
                  className="w-full bg-transparent text-[#ececf1] placeholder-[#8e8ea0] resize-none outline-none text-[15px] leading-[1.75] min-h-[60px] max-h-[200px] overflow-y-auto"
                  rows={1}
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!topic.trim() || isLoading}
                className="px-4 py-2 bg-[#10a37f] hover:bg-[#0d8f6e] disabled:bg-[#40414f] disabled:text-[#8e8ea0] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Thinking...' : 'Teach me'}
              </button>
            </div>
          </form>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Answer area */}
          {answer && (
            <div className="bg-[#1a1a2e] rounded-lg border border-[#40414f] p-6">
              <MarkdownRenderer content={answer} />
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !answer && (
            <div className="bg-[#1a1a2e] rounded-lg border border-[#40414f] p-6 text-center text-[#8e8ea0]">
              <div className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
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
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

