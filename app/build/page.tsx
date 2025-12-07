'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function BuildPage() {
  const [prompt, setPrompt] = useState('')
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsLoading(true)
    setError(null)
    setHtmlContent(null)
    setIframeSrc(null)

    try {
      const response = await fetch('/api/build-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate HTML')
      }

      const data = await response.json()
      setHtmlContent(data.html)
      
      // Create a blob URL for the HTML content to display in iframe
      const blob = new Blob([data.html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setIframeSrc(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate HTML')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 relative overflow-hidden pb-8">
      {/* Colorful gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.15)_0%,transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,172,254,0.1)_0%,transparent_60%)] pointer-events-none" />
      
      {/* Back Button - Top Left */}
      <div className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="group relative px-6 py-3 text-white rounded-full font-semibold text-base transition-all duration-300 shadow-md hover:shadow-xl hover:scale-[1.05] active:scale-[0.98] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(118, 75, 162, 0.2)',
          }}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative z-10">Back</span>
        </Link>
      </div>
      
      <div className="relative z-10 w-full max-w-6xl mx-auto pt-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight"
            style={{
              letterSpacing: '-0.02em',
              lineHeight: '1.1',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Build Feature
          </h1>
          <p className="text-lg text-neutral-600">
            Describe what you want to build, and OpenAI will generate an interactive HTML page
          </p>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a calculator, Build a todo list app, Make a color picker..."
              className="flex-1 px-6 py-4 rounded-2xl border-2 border-neutral-200 focus:border-indigo-500 focus:outline-none text-base bg-white/80 backdrop-blur-sm shadow-lg transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-8 py-4 rounded-2xl font-semibold text-white text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 10px 10px -5px rgba(118, 75, 162, 0.2)',
              }}
            >
              {isLoading ? 'Generating...' : 'Build'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        )}

        {/* Generated HTML Display */}
        {iframeSrc && htmlContent && !isLoading && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-neutral-200">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 flex items-center justify-between">
                <h2 className="text-white font-semibold text-lg">Generated HTML</h2>
                <button
                  onClick={() => {
                    const blob = new Blob([htmlContent], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'generated.html'
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Download
                </button>
              </div>
              <div className="relative" style={{ height: '600px' }}>
                <iframe
                  src={iframeSrc}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  title="Generated HTML"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
