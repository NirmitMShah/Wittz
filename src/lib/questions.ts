import { supabase } from './supabase'
import { appConfig } from '../config/appConfig'
import type { CreateQuestionInput, Question, CourseContent, Course } from '../types/course'

/**
 * Insert questions into the database
 */
export async function insertQuestions(
  questions: CreateQuestionInput[]
): Promise<{ data: Question[] | null; error: any }> {
  if (questions.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select()

  return { data, error }
}

/**
 * Get a random question for a specific lecture and difficulty
 * Falls back to any difficulty if no question found for the specified difficulty
 */
export async function getQuestionByLectureAndDifficulty(
  lectureId: string,
  difficulty: 'basic' | 'standard' | 'advanced'
): Promise<{ data: Question | null; error: any }> {
  // First try to get all questions with the specified difficulty
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('lecture_id', lectureId)
    .eq('difficulty', difficulty)

  if (error) {
    return { data: null, error }
  }

  // If found, randomly select one
  if (data && data.length > 0) {
    const randomIndex = Math.floor(Math.random() * data.length)
    return { data: data[randomIndex], error: null }
  }

  // Fallback: get any question for this lecture
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('questions')
    .select('*')
    .eq('lecture_id', lectureId)

  if (fallbackError) {
    return { data: null, error: fallbackError }
  }

  if (fallbackData && fallbackData.length > 0) {
    const randomIndex = Math.floor(Math.random() * fallbackData.length)
    return { data: fallbackData[randomIndex], error: null }
  }

  return { data: null, error: null }
}

/**
 * Generate questions using the priority algorithm based on mastery and days to exam
 * Number of questions is determined by appConfig.questionGeneration.targetQuestions
 */
export async function generateTaskQuestions(
  course: Course,
  lectures: CourseContent[]
): Promise<{ data: Question[] | null; error: any }> {
  if (lectures.length === 0) {
    return { data: [], error: { message: 'No lectures found for this course' } }
  }

  // Calculate days to exam
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const examDate = new Date(course.test_date)
  examDate.setHours(0, 0, 0, 0)
  const daysToExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Determine weights based on days to exam
  let masteryWeight: number
  let uniformWeight: number

  const { longTermThreshold, shortTermThreshold } = appConfig.questionGeneration.daysToExam
  const { longTerm, mediumTerm, shortTerm } = appConfig.questionGeneration.weights

  if (daysToExam >= longTermThreshold) {
    masteryWeight = longTerm.masteryWeight
    uniformWeight = longTerm.uniformWeight
  } else if (daysToExam >= shortTermThreshold) {
    masteryWeight = mediumTerm.masteryWeight
    uniformWeight = mediumTerm.uniformWeight
  } else {
    masteryWeight = shortTerm.masteryWeight
    uniformWeight = shortTerm.uniformWeight
  }

  // Calculate priorities for each lecture
  const N = lectures.length
  const uniformComponent = 1 / N

  interface LecturePriority {
    lecture: CourseContent
    priority: number
    normalizedMastery: number
  }

  const lecturePriorities: LecturePriority[] = lectures.map((lecture) => {
    const m = lecture.mastery / 100.0 // Normalize mastery to 0-1
    const lowMastery = 1 - m
    const priority = masteryWeight * lowMastery + uniformWeight * uniformComponent

    return {
      lecture,
      priority,
      normalizedMastery: m,
    }
  })

  // Normalize priorities to probabilities
  const totalPriority = lecturePriorities.reduce((sum, lp) => sum + lp.priority, 0)
  const probabilities = lecturePriorities.map((lp) => ({
    ...lp,
    probability: lp.priority / totalPriority,
  }))

  // Allocate questions proportionally (each lecture gets its proportion of target questions)
  const TARGET_QUESTIONS = appConfig.questionGeneration.targetQuestions
  const allocations = probabilities.map((prob) => ({
    ...prob,
    questionCount: Math.round(prob.probability * TARGET_QUESTIONS),
  }))

  // Adjust to ensure exactly target questions total (largest remainder method)
  const totalAllocated = allocations.reduce((sum, a) => sum + a.questionCount, 0)
  const difference = TARGET_QUESTIONS - totalAllocated

  if (difference !== 0) {
    // Sort by remainder (probability * target - floor(probability * target))
    const withRemainders = allocations.map((a) => ({
      ...a,
      remainder: a.probability * TARGET_QUESTIONS - Math.floor(a.probability * TARGET_QUESTIONS),
    }))
    withRemainders.sort((a, b) => b.remainder - a.remainder)

    // Add/subtract 1 to the lectures with largest remainders
    for (let i = 0; i < Math.abs(difference); i++) {
      if (difference > 0) {
        withRemainders[i].questionCount++
      } else {
        withRemainders[i].questionCount--
      }
    }
  }

  // Generate questions for each lecture based on allocation
  const questions: Question[] = []

  for (const allocation of allocations) {
    const { lecture, normalizedMastery: m, questionCount } = allocation

    for (let i = 0; i < questionCount; i++) {
      // Determine difficulty based on mastery
      let difficulty: 'basic' | 'standard' | 'advanced'
      const random = Math.random()

      const { lowMastery, mediumMastery } = appConfig.questionGeneration.masteryThresholds
      const { lowMastery: lowDist, mediumMastery: medDist, highMastery: highDist } =
        appConfig.questionGeneration.difficultyDistribution

      if (m < lowMastery) {
        // Low mastery distribution
        difficulty = random < lowDist.basic ? 'basic' : 'standard'
      } else if (m < mediumMastery) {
        // Medium mastery distribution
        if (random < medDist.basic) {
          difficulty = 'basic'
        } else if (random < medDist.basic + medDist.standard) {
          difficulty = 'standard'
        } else {
          difficulty = 'advanced'
        }
      } else {
        // High mastery distribution
        if (random < highDist.basic) {
          difficulty = 'basic'
        } else if (random < highDist.basic + highDist.standard) {
          difficulty = 'standard'
        } else {
          difficulty = 'advanced'
        }
      }

      // Get a question for this lecture and difficulty
      const { data: question, error } = await getQuestionByLectureAndDifficulty(
        lecture.id,
        difficulty
      )

      if (error) {
        return { data: null, error }
      }

      if (question) {
        questions.push(question)
      } else {
        // If no question found, try to get any question for this lecture
        const { data: fallbackQuestion, error: fallbackError } = await getQuestionByLectureAndDifficulty(
          lecture.id,
          'standard' // Use standard as fallback
        )

        if (fallbackError) {
          return { data: null, error: fallbackError }
        }

        if (fallbackQuestion) {
          questions.push(fallbackQuestion)
        }
        // If still no question, skip this slot (we'll have fewer than target questions)
      }
    }
  }

  return { data: questions, error: null }
}

