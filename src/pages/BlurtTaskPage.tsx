import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCourseContentById } from '../lib/courses'
import type { CourseContent } from '../types/course'
import { generateBlurtStructure, type BlurtAssistanceLevel } from '../lib/blurt'

function BlurtTaskPage() {
  const { contentId } = useParams<{ contentId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [lecture, setLecture] = useState<CourseContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hasWatched, setHasWatched] = useState(false)
  const [assistance, setAssistance] = useState<BlurtAssistanceLevel>('minimal')
  const [structure, setStructure] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const loadLecture = async () => {
      if (!contentId) return
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getCourseContentById(contentId)
        if (error) throw error
        if (!data) {
          throw new Error('Lecture not found')
        }
        setLecture(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load blurt task')
      } finally {
        setLoading(false)
      }
    }

    if (user && contentId) {
      loadLecture()
    }
  }, [user, contentId])

  const handleGenerateStructure = async () => {
    if (!lecture) return

    // For least assisted, just clear any existing structure and let them free-write
    if (assistance === 'minimal') {
      setStructure('')
      return
    }

    try {
      setGenerating(true)
      setError(null)
      const outline = await generateBlurtStructure(lecture, assistance)
      setStructure(outline)
    } catch (err: any) {
      setError(err.message || 'Failed to generate blurt structure')
    } finally {
      setGenerating(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Please sign in to view this blurt task.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </div>
    )
  }

  if (error || !lecture) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back
          </button>
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-red-800 font-semibold mb-1">Unable to load blurt task</p>
            <p className="text-red-700 text-sm">{error || 'Lecture not found.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Blurt Task</h1>
        <p className="mb-6 text-sm text-gray-600">
          Active recall exercise for: <span className="font-medium text-gray-900">{lecture.name}</span>
        </p>

        {/* Step 1: Watch video instruction */}
        {!hasWatched && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Watch the lecture video</h2>
            <p className="text-sm text-gray-600 mb-4">
              Before blurting, watch the lecture video (or review the material) so it&apos;s fresh in your
              mind. Once you&apos;re done, confirm below to move on.
            </p>
            <button
              onClick={() => setHasWatched(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              I&apos;ve watched the video
            </button>
          </div>
        )}

        {/* Step 2: Assistance level + structure generation */}
        {hasWatched && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Choose assistance level</h2>
              <p className="text-sm text-gray-600 mb-4">
                Decide how much structure you want for your blurt. Less assistance means more challenge and
                stronger recall.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <label htmlFor="assistance" className="block text-sm font-medium text-gray-700 mb-1">
                    Assistance level
                  </label>
                  <select
                    id="assistance"
                    value={assistance}
                    onChange={(e) => setAssistance(e.target.value as BlurtAssistanceLevel)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="minimal">Least assisted – no outline (blank page)</option>
                    <option value="medium">Medium assisted – major topics only</option>
                    <option value="high">Very assisted – major topics and subtopics</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateStructure}
                  disabled={generating}
                  className="mt-2 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating outline...' : 'Generate structure'}
                </button>
              </div>

              {generating && (
                <p className="mt-2 text-xs text-gray-500">
                  Calling OpenAI to build a tailored outline for your blurt...
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Blurt</h2>
              <p className="text-sm text-gray-600 mb-3">
                Without looking at your notes, type everything you can remember about this lecture. Use the
                structure (if any) as a guide, but let yourself freely recall details.
              </p>

              <textarea
                value={structure}
                onChange={(e) => setStructure(e.target.value)}
                placeholder={
                  assistance === 'minimal'
                    ? 'Start blurting here — write everything you remember from the lecture...'
                    : 'Your generated blurt structure will appear here. Fill it in and add details from memory...'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm leading-relaxed text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={14}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Tip: Don&apos;t worry about grammar. The goal is to get ideas out of your head.</span>
                <button
                  type="button"
                  onClick={() => setStructure('')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlurtTaskPage

