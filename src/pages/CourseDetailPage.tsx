import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getCourseById,
  updateCourse,
  getCourseContents,
  createCourseContent,
  deleteCourseContent,
} from '../lib/courses'
import type { Course, CourseContent, CreateCourseContentInput } from '../types/course'

function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [lectures, setLectures] = useState<CourseContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [courseColor, setCourseColor] = useState('#3B82F6')
  const [courseTestDate, setCourseTestDate] = useState('')
  const [showLectureForm, setShowLectureForm] = useState(false)
  const [lectureForm, setLectureForm] = useState({ name: '', content: '' })

  useEffect(() => {
    if (user && courseId) {
      loadCourse()
      loadLectures()
    }
  }, [user, courseId])

  const loadCourse = async () => {
    if (!courseId) return
    try {
      setLoading(true)
      const { data, error } = await getCourseById(courseId)
      if (error) throw error
      if (data) {
        setCourse(data)
        setCourseName(data.name)
        setCourseColor(data.color)
        setCourseTestDate(data.test_date.split('T')[0])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const loadLectures = async () => {
    if (!courseId) return
    try {
      const { data, error } = await getCourseContents(courseId)
      if (error) throw error
      setLectures(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load lectures')
    }
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return

    try {
      const { data, error } = await updateCourse(courseId, {
        name: courseName,
        color: courseColor,
        test_date: courseTestDate,
      })
      if (error) throw error
      if (data) {
        setCourse(data)
        setEditingCourse(false)
        setError(null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update course')
    }
  }

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId) return

    try {
      setError(null)

      const input: CreateCourseContentInput = {
        course_id: courseId,
        name: lectureForm.name,
        content: lectureForm.content,
      }
      const { data, error } = await createCourseContent(input)
      if (error) throw error
      if (data) {
        setLectures([data, ...lectures])
        setLectureForm({ name: '', content: '' })
        setShowLectureForm(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create lecture')
    }
  }

  const handleDeleteLecture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return

    try {
      const { error } = await deleteCourseContent(id)
      if (error) throw error
      setLectures(lectures.filter((lecture) => lecture.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete lecture')
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Please sign in to view course details.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Loading course...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Course not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/courses')}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Courses
        </button>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Course Info Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: course.color }}
              />
              {editingCourse ? (
                <form onSubmit={handleUpdateCourse} className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Course Name"
                      required
                    />
                    <input
                      type="color"
                      value={courseColor}
                      onChange={(e) => setCourseColor(e.target.value)}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label htmlFor="test_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Exam Date *
                    </label>
                    <input
                      type="date"
                      id="test_date"
                      required
                      value={courseTestDate}
                      onChange={(e) => setCourseTestDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCourse(false)
                        setCourseName(course.name)
                        setCourseColor(course.color)
                        setCourseTestDate(course.test_date ? course.test_date.split('T')[0] : '')
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      Exam Date: {new Date(course.test_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingCourse(true)}
                    className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lectures Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Lectures</h2>
            <button
              onClick={() => setShowLectureForm(!showLectureForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showLectureForm ? 'Cancel' : '+ Add Lecture'}
            </button>
          </div>

          {showLectureForm && (
            <form onSubmit={handleCreateLecture} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label htmlFor="lecture-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Lecture Name *
                  </label>
                  <input
                    type="text"
                    id="lecture-name"
                    required
                    value={lectureForm.name}
                    onChange={(e) => setLectureForm({ ...lectureForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Introduction to React Hooks"
                  />
                </div>
                <div>
                  <label htmlFor="lecture-content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content *
                  </label>
                  <textarea
                    id="lecture-content"
                    required
                    value={lectureForm.content}
                    onChange={(e) => setLectureForm({ ...lectureForm, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter lecture content..."
                    rows={6}
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Lecture
                </button>
              </div>
            </form>
          )}

          {lectures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No lectures yet. Add your first lecture!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{lecture.name}</h3>
                    <button
                      onClick={() => handleDeleteLecture(lecture.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{lecture.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(lecture.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseDetailPage

