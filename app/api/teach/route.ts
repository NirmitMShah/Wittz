import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Toggle to enable/disable image generation
const ENABLE_IMAGE_GENERATION = false

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Helper function to generate an image from a prompt
async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    })
    return response.data?.[0]?.url || null
  } catch (error) {
    console.error('Error generating image:', error)
    return null
  }
}

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
${ENABLE_IMAGE_GENERATION ? '- **IMAGES**: **REQUIRED** - You MUST include at least one image placeholder in every response. Include a special placeholder in this exact format: `![IMAGE_PLACEHOLDER: detailed description of what the image should show]`. The description should be detailed, specific, and educational - describe exactly what visual would help the student understand the concept better. Use this for diagrams, processes, structures, comparisons, or any concept that benefits from visual representation. Place the placeholder right after the text that introduces the most important concept that would benefit from visualization. If multiple concepts could use visuals, include multiple placeholders.' : ''}

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

          // After text streaming is complete, check for image placeholders and generate images
          if (ENABLE_IMAGE_GENERATION) {
            const imagePlaceholderRegex = /!\[IMAGE_PLACEHOLDER:\s*(.+?)\]/g
            let match
            const imageTasks: Array<{ placeholder: string; description: string; index: number }> = []
            let placeholderIndex = 0

            // Collect all image placeholders
            while ((match = imagePlaceholderRegex.exec(accumulatedContent)) !== null) {
              imageTasks.push({
                placeholder: match[0],
                description: match[1].trim(),
                index: placeholderIndex++,
              })
            }

            // Generate images for all placeholders in parallel
            let imagesGenerated = 0
            if (imageTasks.length > 0) {
              // Send a signal that we're generating images
              const generatingData = JSON.stringify({ 
                type: 'generating_images', 
                count: imageTasks.length 
              }) + '\n'
              controller.enqueue(encoder.encode(generatingData))

              // Generate all images in parallel
              const imagePromises = imageTasks.map(async (task) => {
                const imageUrl = await generateImage(task.description)
                return { ...task, imageUrl }
              })

              const imageResults = await Promise.all(imagePromises)

              // Replace placeholders with actual image markdown
              for (const result of imageResults) {
                if (result.imageUrl) {
                  // Replace placeholder with actual image markdown
                  accumulatedContent = accumulatedContent.replace(
                    result.placeholder,
                    `![${result.description}](${result.imageUrl})`
                  )
                  imagesGenerated++
                } else {
                  // Remove placeholder if image generation failed
                  accumulatedContent = accumulatedContent.replace(result.placeholder, '')
                }
              }
            }

            // Ensure at least one image is generated - generate a default if none were found
            if (imagesGenerated === 0) {
              const generatingData = JSON.stringify({ 
                type: 'generating_images', 
                count: 1 
              }) + '\n'
              controller.enqueue(encoder.encode(generatingData))

              // Generate a default educational image based on the topic
              const defaultImagePrompt = `An educational diagram or illustration explaining: ${topic.trim()}. Make it clear, informative, and visually appealing.`
              const defaultImageUrl = await generateImage(defaultImagePrompt)
              
              if (defaultImageUrl) {
                // Insert the image at the beginning of the content
                accumulatedContent = `![Educational diagram for ${topic.trim()}](${defaultImageUrl})\n\n${accumulatedContent}`
              }
            }
          } else {
            // Remove any image placeholders if image generation is disabled
            accumulatedContent = accumulatedContent.replace(/!\[IMAGE_PLACEHOLDER:\s*(.+?)\]/g, '')
          }

          // Send completion signal with final content (including generated images)
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

