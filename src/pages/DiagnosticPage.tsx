import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function DiagnosticPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-gray-600">Please sign in to view the diagnostic.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Diagnostic</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600">Diagnostic page for course: {courseId}</p>
          <p className="text-gray-500 text-sm mt-4">This page will be implemented next.</p>
        </div>
      </div>
    </div>
  )
}

export default DiagnosticPage

