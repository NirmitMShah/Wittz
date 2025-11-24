import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import TodaysTasksPage from './pages/TodaysTasksPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import CourseTasksPage from './pages/CourseTasksPage'
import DiagnosticPage from './pages/DiagnosticPage'
import BlurtTaskPage from './pages/BlurtTaskPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import InterleavedPracticePage from './pages/InterleavedPracticePage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TodaysTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId"
              element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/tasks"
              element={
                <ProtectedRoute>
                  <CourseTasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagnostic/:courseId"
              element={
                <ProtectedRoute>
                  <DiagnosticPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blurt/:contentId"
              element={
                <ProtectedRoute>
                  <BlurtTaskPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/interleaved"
              element={
                <ProtectedRoute>
                  <InterleavedPracticePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

