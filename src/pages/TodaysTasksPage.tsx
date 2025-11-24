import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getCourses } from '../lib/courses'
import type { Course } from '../types/course'

function TodaysTasksPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await getCourses()
      if (error) throw error
      setCourses(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Please sign in to view your tasks.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Today's Tasks</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">No courses yet. Create a course to get started!</p>
            <a
              href="/courses"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to Courses →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Diagnostic Tasks */}
            {courses
              .filter((course) => !course.diagnostic_taken)
              .map((course) => (
                <div
                  key={`diagnostic-${course.id}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow w-full"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Take Diagnostic - {course.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => navigate(`/diagnostic/${course.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))}

            {/* Courses */}
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow w-full"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{course.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Created {new Date(course.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TodaysTasksPage

