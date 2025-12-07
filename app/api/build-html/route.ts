import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert web developer. Your task is to generate a complete, self-contained HTML file that can run in a browser.

Requirements:
- Output ONLY valid HTML code, nothing else
- The HTML must be complete and self-contained (include all CSS and JavaScript inline)
- The HTML should be interactive and functional
- Use modern HTML5, CSS3, and JavaScript
- Make it visually appealing and responsive
- Do not include any markdown formatting, explanations, or code blocks - just the raw HTML
- The HTML should start with <!DOCTYPE html> and end with </html>
- Include all styles in <style> tags in the <head>
- Include all JavaScript in <script> tags before </body>
- Make sure the HTML is fully functional and interactive`,
        },
        {
          role: 'user',
          content: `Generate the HTML based on this request: ${prompt.trim()}`,
        },
      ],
    })

    let htmlContent = completion.choices[0]?.message?.content || ''

    // Clean up the response - remove markdown code blocks if present
    htmlContent = htmlContent.trim()
    if (htmlContent.startsWith('```html')) {
      htmlContent = htmlContent.replace(/^```html\n?/, '').replace(/\n?```$/, '')
    } else if (htmlContent.startsWith('```')) {
      htmlContent = htmlContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    // Ensure it's valid HTML
    if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
      // If it doesn't start with DOCTYPE or html tag, wrap it
      if (!htmlContent.includes('<html')) {
        htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated HTML</title>
</head>
<body>
${htmlContent}
</body>
</html>`
      }
    }

    return NextResponse.json({ html: htmlContent })
  } catch (error) {
    console.error('Error calling OpenAI API:', error)
    return NextResponse.json(
      { error: 'Failed to generate HTML' },
      { status: 500 }
    )
  }
}
