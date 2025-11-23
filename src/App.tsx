import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import TodaysTasksPage from './pages/TodaysTasksPage'
import CoursesPage from './pages/CoursesPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<TodaysTasksPage />} />
          <Route path="/courses" element={<CoursesPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

