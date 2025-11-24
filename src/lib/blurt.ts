import type { CourseContent } from '../types/course'
import { appConfig } from '../config/appConfig'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

export type BlurtAssistanceLevel = 'minimal' | 'medium' | 'high'

interface LLMBlurtResponse {
  outline: string
}

/**
 * Generate a blurt structure (outline) for a lecture using OpenAI.
 * - minimal: caller can choose to skip calling this and just use an empty textarea.
 * - medium: major topics only.
 * - high: major topics + nested subtopics.
 */
export async function generateBlurtStructure(
  lecture: CourseContent,
  assistance: BlurtAssistanceLevel
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.')
  }

  const assistanceDescription =
    assistance === 'medium'
      ? 'Provide only the 4–8 major topics as top-level headings. Do NOT include sub-bullets.'
      : 'Provide 4–8 major topics as headings, and under each heading list 2–5 concise subtopics as indented bullet points.'

  const systemPrompt = `You are an expert study coach helping a student do an active recall "blurt" based on a lecture.

Given the lecture details, generate an OUTLINE ONLY for their blurt according to the requested assistance level.

${assistanceDescription}

Rules:
- Focus strictly on structure, not full explanations.
- Use plain text.
- Use numbering and bullets where helpful.
- Do NOT include any instructions or commentary, only the outline itself.
`

  const userPrompt = `Course lecture for a blurt exercise:

Lecture name: ${lecture.name}

Lecture content:
${lecture.content}

Return ONLY the outline text.`

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: appConfig.diagnostic.openai.temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`OpenAI API error: ${JSON.stringify(error)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content || typeof content !== 'string') {
    throw new Error('No outline content returned from OpenAI')
  }

  return content.trim()
}


