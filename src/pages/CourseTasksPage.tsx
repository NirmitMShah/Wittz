import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCourseById, getCourseContents } from '../lib/courses'
import { generateTaskQuestions } from '../lib/questions'
import type { Course, Question } from '../types/course'

function CourseTasksPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [showResults, setShowResults] = useState<Record<string, boolean>>({})
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

  const generateQuestions = async () => {
    if (!courseId) return
    setGenerating(true)
    setError(null)
    try {
      // Fetch all lectures for this course
      const { data: lectures, error: lecturesError } = await getCourseContents(courseId)
      if (lecturesError) throw lecturesError
      if (!lectures || lectures.length === 0) {
        throw new Error('No lectures found for this course. Please add lectures to this course first.')
      }

      // Check if there are any questions available
      const { data: questionsData, error: questionsError } = await generateTaskQuestions(
        course!,
        lectures
      )
      if (questionsError) throw questionsError
      if (!questionsData || questionsData.length === 0) {
        throw new Error('No questions found for this course. Please add questions to lectures first.')
      }

      setQuestions(questionsData)
      setStarted(true)
      setAnswers({})
      setSubmitted({})
      setShowResults({})
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    if (submitted[questionId]) return // Don't allow changes after submission
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmitQuestion = (question: Question) => {
    if (!answers[question.id]) {
      alert('Please select an answer before submitting.')
      return
    }
    setSubmitted((prev) => ({ ...prev, [question.id]: true }))
    setShowResults((prev) => ({ ...prev, [question.id]: true }))
  }

  const handleNext = () => {
    // Check if all questions are answered
    const allAnswered = questions.every((q) => submitted[q.id])
    if (allAnswered) {
      // Navigate back or show completion message
      alert('Great job! You\'ve completed all questions.')
      navigate('/')
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Please sign in to view tasks.</p>
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
            Course Tasks{course ? ` - ${course.name}` : ''}
          </h1>
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600 mb-6">
              This will generate 10 personalized questions based on your mastery levels and exam date.
              Questions are selected to help you focus on areas that need the most improvement.
            </p>
            {course && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Exam Date:</span>{' '}
                  {new Date(course.test_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <button
              onClick={generateQuestions}
              disabled={generating || !course}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {generating ? 'Generating Questions...' : 'Generate Questions'}
            </button>
            {generating && (
              <p className="text-gray-500 text-sm mt-4">
                Generating personalized questions based on your progress...
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
          Course Tasks{course ? ` - ${course.name}` : ''}
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
            {questions.map((question, index) => {
              const isSubmitted = submitted[question.id]
              const showResult = showResults[question.id]
              const userAnswer = answers[question.id]
              const isCorrect =
                userAnswer?.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()

              return (
                <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-500">
                          Question {index + 1} of {questions.length}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            question.difficulty === 'basic'
                              ? 'bg-green-100 text-green-800'
                              : question.difficulty === 'standard'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {question.difficulty}
                        </span>
                        {showResult && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-semibold ${
                              isCorrect
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{question.prompt}</h3>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {question.type === 'mcq' && question.choices ? (
                      question.choices.map((choice, optIndex) => {
                        const isSelected = userAnswer === choice
                        const isCorrectChoice = choice === question.correct_answer
                        const showAnswer = showResult

                        return (
                          <label
                            key={optIndex}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              isSubmitted
                                ? showAnswer && isCorrectChoice
                                  ? 'bg-green-50 border-green-300'
                                  : showAnswer && isSelected && !isCorrect
                                  ? 'bg-red-50 border-red-300'
                                  : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                : isSelected
                                  ? 'bg-blue-50 border-blue-300'
                                  : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={question.id}
                              value={choice}
                              checked={isSelected}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              disabled={isSubmitted}
                              className="mr-3"
                            />
                            <span className="text-gray-700">{choice}</span>
                            {showAnswer && isCorrectChoice && (
                              <span className="ml-auto text-green-600 font-semibold">✓ Correct</span>
                            )}
                          </label>
                        )
                      })
                    ) : (
                      <div>
                        <textarea
                          value={userAnswer || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          placeholder="Type your answer here..."
                          disabled={isSubmitted}
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          rows={4}
                        />
                        {showResult && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Your answer:</span> {userAnswer || '(No answer)'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-semibold">Correct answer:</span>{' '}
                              {question.correct_answer}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {showResult && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Explanation:</p>
                      <p className="text-sm text-gray-600">{question.solution_explanation}</p>
                    </div>
                  )}

                  {!isSubmitted && (
                    <button
                      onClick={() => handleSubmitQuestion(question)}
                      disabled={!userAnswer}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>
              )
            })}

            {questions.every((q) => submitted[q.id]) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-900 mb-2">All Done! 🎉</p>
                  <p className="text-gray-600">
                    You've completed all {questions.length} questions.
                  </p>
                </div>
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Finish
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseTasksPage
