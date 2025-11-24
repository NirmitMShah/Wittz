import type { CourseContent, DiagnosticQuestion } from '../types/course'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface LLMQuestionResponse {
  questions: Array<{
    type: 'multiple_choice' | 'short_answer' | 'true_false'
    question: string
    options?: string[]
    correct_answer: string
    explanation?: string
    difficulty: 'easy' | 'medium' | 'hard'
  }>
}

/**
 * Generate diagnostic questions for a single lecture
 */
export async function generateQuestionsForLecture(
  lecture: CourseContent
): Promise<DiagnosticQuestion[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.')
  }

  const systemPrompt = `You are an expert educational assessment designer. Generate 2-4 diagnostic questions based on the provided lecture content.

## Guidelines:
1. Generate 2-4 questions per lecture (adjust based on content depth)
2. Mix question types: 60-70% multiple choice, 20-30% short answer, 10% true/false
3. Questions should test understanding, not just memorization
4. Each question should have one clearly correct answer
5. Include explanations for correct answers
6. Distribute difficulty: 30% easy, 50% medium, 20% hard

## Output Format (JSON):
{
  "questions": [
    {
      "type": "multiple_choice" | "short_answer" | "true_false",
      "question": "The question text",
      "options": ["option1", "option2", "option3", "option4"], // Only for multiple_choice
      "correct_answer": "correct answer or option text",
      "explanation": "Brief explanation of why this is correct",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Return ONLY valid JSON, no additional text.`

  const userPrompt = `Generate diagnostic questions for this lecture:

Lecture Name: ${lecture.name}

Lecture Content:
${lecture.content}`

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using mini for cost efficiency, can be changed to gpt-4 if needed
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    const parsed: LLMQuestionResponse = JSON.parse(content)

    // Transform to DiagnosticQuestion format
    return parsed.questions.map((q, index) => ({
      id: `${lecture.id}-${index}-${Date.now()}`,
      lectureId: lecture.id,
      lectureName: lecture.name,
      type: q.type,
      question: q.question,
      options: q.options,
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      difficulty: q.difficulty,
    }))
  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}

/**
 * Generate diagnostic questions for all lectures in a course
 */
export async function generateDiagnosticQuestions(
  lectures: CourseContent[]
): Promise<DiagnosticQuestion[]> {
  const allQuestions: DiagnosticQuestion[] = []

  // Generate questions for each lecture sequentially
  for (const lecture of lectures) {
    try {
      const questions = await generateQuestionsForLecture(lecture)
      allQuestions.push(...questions)
    } catch (error) {
      console.error(`Error generating questions for lecture ${lecture.name}:`, error)
      // Continue with other lectures even if one fails
    }
  }

  return allQuestions
}

