import { supabase } from './supabase'
import { appConfig } from '../config/appConfig'
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
    .select(`
      *,
      course_contents(mastery)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error }
  }

  // Calculate average mastery for each course
  const coursesWithMastery = (data || []).map((course: any) => {
    const contents = course.course_contents || []
    let mastery: number | undefined = undefined

    if (contents.length > 0) {
      const totalMastery = contents.reduce((sum: number, content: any) => sum + (content.mastery || 0), 0)
      mastery = Math.round(totalMastery / contents.length)
    }

    // Remove the course_contents from the response
    const { course_contents, ...courseData } = course
    return { ...courseData, mastery }
  })

  return { data: coursesWithMastery, error: null }
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

/**
 * Get the lowest mastery course content below a threshold for each course
 * Returns one course content per course (the lowest mastery lecture under the threshold)
 */
export async function getLowestMasteryContent(
  threshold: number = appConfig.courseContent.defaultMasteryThreshold
): Promise<{ data: (CourseContent & { course: Course })[]; error: any }> {
  // Get all course contents with mastery below threshold, including course info
  const { data, error } = await supabase
    .from('course_contents')
    .select(`
      *,
      courses(*)
    `)
    .lt('mastery', threshold)
    .order('course_id', { ascending: true })
    .order('mastery', { ascending: true })

  if (error) {
    return { data: [], error }
  }

  if (!data || data.length === 0) {
    return { data: [], error: null }
  }

  // Group by course_id and pick the lowest mastery content per course
  const seenCourses = new Set<string>()
  const results: (CourseContent & { course: Course })[] = []

  for (const content of data as any[]) {
    const courseId = content.course_id as string
    if (!courseId || seenCourses.has(courseId)) continue

    seenCourses.add(courseId)
    const course = content.courses as Course
    const { courses, ...contentData } = content

    results.push({
      ...(contentData as CourseContent),
      course,
    })
  }

  return { data: results, error: null }
}

