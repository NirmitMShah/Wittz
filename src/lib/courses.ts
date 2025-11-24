import { supabase } from './supabase'
import type {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CourseContent,
  CreateCourseContentInput,
  UpdateCourseContentInput,
} from '../types/course'

/**
 * Get all courses for the current user
 */
export async function getCourses(): Promise<{ data: Course[] | null; error: any }> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Get a single course by ID
 */
export async function getCourseById(id: string): Promise<{ data: Course | null; error: any }> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

/**
 * Create a new course
 */
export async function createCourse(
  input: CreateCourseInput
): Promise<{ data: Course | null; error: any }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } }
  }

  const { data, error } = await supabase
    .from('courses')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color || '#3B82F6',
      diagnostic_taken: false,
      test_date: input.test_date,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update an existing course
 */
export async function updateCourse(
  id: string,
  input: UpdateCourseInput
): Promise<{ data: Course | null; error: any }> {
  const { data, error } = await supabase
    .from('courses')
    .update({
      ...(input.name && { name: input.name }),
      ...(input.color && { color: input.color }),
      ...(input.test_date !== undefined && { test_date: input.test_date }),
    })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from('courses').delete().eq('id', id)

  return { error }
}

/**
 * Get all course contents for a specific course
 */
export async function getCourseContents(
  courseId: string
): Promise<{ data: CourseContent[] | null; error: any }> {
  const { data, error } = await supabase
    .from('course_contents')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Create a new course content (lecture)
 */
export async function createCourseContent(
  input: CreateCourseContentInput
): Promise<{ data: CourseContent | null; error: any }> {
  const { data, error } = await supabase
    .from('course_contents')
    .insert({
      course_id: input.course_id,
      name: input.name,
      content: input.content,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update an existing course content
 */
export async function updateCourseContent(
  id: string,
  input: UpdateCourseContentInput
): Promise<{ data: CourseContent | null; error: any }> {
  const { data, error } = await supabase
    .from('course_contents')
    .update({
      ...(input.name && { name: input.name }),
      ...(input.content && { content: input.content }),
      ...(input.mastery !== undefined && { mastery: input.mastery }),
      ...(input.last_reviewed !== undefined && { last_reviewed: input.last_reviewed }),
    })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete a course content
 */
export async function deleteCourseContent(id: string): Promise<{ error: any }> {
  const { error } = await supabase.from('course_contents').delete().eq('id', id)

  return { error }
}

