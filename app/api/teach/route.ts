import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json()

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      )
    }

      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key is not configured' },
          { status: 500 }
        )
      }

    const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a friendly, intuitive teacher.

Always respond in GitHub-flavored **markdown** formatted like a ChatGPT answer:

- Start with a clear section heading for the first part of the explanation, e.g. '1. Where the trouble starts'.
- Use short paragraphs (1–3 sentences) separated by blank lines.
- Use bullet points for lists of facts, properties, or steps.
- Use blockquotes (\`>\`) for key questions or highlighted 'voice' lines like 'What is √-1?' or 'Okay, let's invent a new number so that...'.
- Use **bold** to emphasize important words or phrases.
- Use LaTeX math syntax for equations:
  - **CRITICAL**: Always wrap inline math expressions in \`$...$\` delimiters (single dollar signs). Never use parentheses for math.
  - Inline math examples: \`$x^2 = -1$\`, \`$i^2 = -1$\`, \`$\\sqrt{-1}$\`, \`$x^2 + y^2 = r^2$\`
  - Block math: wrap displayed equations in \`$$...$$\` (double dollar signs) for centered equations on their own line.
  - Block math example: \`$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$\`
  - **DO NOT** use parentheses like \`(x^2 = -1)\` - always use dollar signs: \`$x^2 = -1$\`

Do NOT include JSON or metadata — only the final formatted explanation.`,
          },
          {
            role: 'user',
            content: `Teach me ${topic.trim()} in a clear, intuitive, step-by-step way.`,
          },
        ],
      stream: true,
      })

    // Create a readable stream to send chunks to the client
    const encoder = new TextEncoder()
    let accumulatedContent = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Stream text content
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              accumulatedContent += content
              // Send chunk as JSON: { type: 'chunk', content: '...' }
              const data = JSON.stringify({ type: 'chunk', content }) + '\n'
              controller.enqueue(encoder.encode(data))
            }
          }

          // Send completion signal with final content
          const completionData = JSON.stringify({ 
            type: 'done', 
            fullContent: accumulatedContent 
          }) + '\n'
          controller.enqueue(encoder.encode(completionData))

          controller.close()
        } catch (error) {
          console.error('Error in stream:', error)
          const errorData = JSON.stringify({ type: 'error', error: 'Failed to stream content' }) + '\n'
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    )
  }
}

