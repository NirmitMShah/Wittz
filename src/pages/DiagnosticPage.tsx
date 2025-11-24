import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCourseById, getCourseContents } from '../lib/courses'
import { generateDiagnosticQuestions } from '../lib/diagnostic'
import type { Course, DiagnosticQuestion } from '../types/course'

function DiagnosticPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (courseId && user) {
      loadCourse()
    }
  }, [courseId, user])

  const loadCourse = async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: courseError } = await getCourseById(courseId)
      if (courseError) throw courseError
      setCourse(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const startDiagnostic = async () => {
    if (!courseId) return
    setGenerating(true)
    setError(null)
    try {
      // Fetch all lectures for this course
      const { data: lectures, error: lecturesError } = await getCourseContents(courseId)
      if (lecturesError) throw lecturesError
      if (!lectures || lectures.length === 0) {
        throw new Error('No lectures found for this course')
      }

      // Generate questions for all lectures
      const generatedQuestions = await generateDiagnosticQuestions(lectures)
      setQuestions(generatedQuestions)
      setStarted(true)
    } catch (err: any) {
      setError(err.message || 'Failed to generate diagnostic questions')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Please sign in to view the diagnostic.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error && !started) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-semibold mb-2">Error</p>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                setError(null)
                loadCourse()
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Diagnostic Test{course ? ` - ${course.name}` : ''}
          </h1>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600 mb-6">
              This diagnostic test will generate questions based on all lectures in this course to
              assess your understanding.
            </p>
            <button
              onClick={startDiagnostic}
              disabled={generating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {generating ? 'Generating Questions...' : 'Start Diagnostic'}
            </button>
            {generating && (
              <p className="text-gray-500 text-sm mt-4">
                This may take a minute. Generating questions for all lectures...
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Diagnostic Test{course ? ` - ${course.name}` : ''}
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600">No questions generated. Please try again.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-500">
                        Question {index + 1} of {questions.length}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          question.difficulty === 'easy'
                            ? 'bg-green-100 text-green-800'
                            : question.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {question.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">({question.lectureName})</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{question.question}</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {question.type === 'multiple_choice' && question.options ? (
                    question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))
                  ) : question.type === 'true_false' ? (
                    <>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name={question.id}
                          value="true"
                          checked={answers[question.id] === 'true'}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">True</span>
                      </label>
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name={question.id}
                          value="false"
                          checked={answers[question.id] === 'false'}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-700">False</span>
                      </label>
                    </>
                  ) : (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600 mb-4">
                You have answered {Object.keys(answers).length} out of {questions.length} questions.
              </p>
              <button
                onClick={() => {
                  // TODO: Implement submission logic
                  alert('Submission functionality to be implemented')
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Diagnostic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiagnosticPage

