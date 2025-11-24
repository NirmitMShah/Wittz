export interface Course {
  id: string
  user_id: string
  name: string
  color: string
  diagnostic_taken: boolean
  created_at: string
  updated_at: string
}

export interface CreateCourseInput {
  name: string
  color?: string
}

export interface UpdateCourseInput {
  name?: string
  color?: string
}

export interface CourseContent {
  id: string
  course_id: string
  name: string
  content: string
  created_at: string
  updated_at: string
}

export interface CreateCourseContentInput {
  course_id: string
  name: string
  content: string
}

export interface UpdateCourseContentInput {
  name?: string
  content?: string
}

