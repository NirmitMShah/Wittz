'use client'

import { useState, useEffect, useRef } from 'react'

interface InteractiveHTMLBlockProps {
  description: string
}

export default function InteractiveHTMLBlock({ description }: InteractiveHTMLBlockProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const generateHTML = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/build-html', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: description.trim() }),
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

    generateHTML()
  }, [description])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (iframeSrc) {
        URL.revokeObjectURL(iframeSrc)
      }
    }
  }, [iframeSrc])

  if (isLoading) {
    return (
      <div className="my-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-200 border-t-indigo-600"></div>
          <span className="text-indigo-700 font-medium">Generating interactive feature...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
        <p className="text-sm font-medium">Failed to generate interactive feature: {error}</p>
      </div>
    )
  }

  if (!iframeSrc || !htmlContent) {
    return null
  }

  return (
    <div className="my-6">
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className="w-full border-0"
        style={{ height: '600px', overflow: 'hidden' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        scrolling="no"
        title="Interactive Feature"
      />
    </div>
  )
}
