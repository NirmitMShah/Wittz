export interface Course {
  id: string
  user_id: string
  name: string
  color: string
  diagnostic_taken: boolean
  test_date: string
  created_at: string
  updated_at: string
  mastery?: number // Average mastery of all lectures in the course
}

export interface CreateCourseInput {
  name: string
  color?: string
  test_date: string
}

export interface UpdateCourseInput {
  name?: string
  color?: string
  test_date?: string
}

export interface CourseContent {
  id: string
  course_id: string
  name: string
  content: string
  mastery: number
  last_reviewed: string | null
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
  mastery?: number
  last_reviewed?: string | null
}

export interface Question {
  id: string
  lecture_id: string
  difficulty: 'basic' | 'standard' | 'advanced'
  type: 'mcq' | 'fill_in_blank'
  prompt: string
  choices?: string[]
  correct_answer: string
  solution_explanation: string
}

export interface CreateQuestionInput {
  lecture_id: string
  difficulty: 'basic' | 'standard' | 'advanced'
  type: 'mcq' | 'fill_in_blank'
  prompt: string
  choices?: string[]
  correct_answer: string
  solution_explanation: string
}

export interface UpdateQuestionInput {
  difficulty?: 'basic' | 'standard' | 'advanced'
  type?: 'mcq' | 'fill_in_blank'
  prompt?: string
  choices?: string[]
  correct_answer?: string
  solution_explanation?: string
}

export interface DiagnosticQuestion {
  id: string
  lectureId: string
  lectureName: string
  type: 'multiple_choice' | 'short_answer' | 'true_false'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface DiagnosticTest {
  questions: DiagnosticQuestion[]
  courseId: string
  courseName: string
}

