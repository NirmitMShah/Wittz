import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              Today's Tasks
            </Link>
            <Link
              to="/courses"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-gray-700"
            >
              Courses
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

