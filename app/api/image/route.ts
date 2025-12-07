import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, size = '1024x1024', n = 1 } = await request.json()

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

    // Validate size parameter
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792']
    const imageSize = validSizes.includes(size) ? size : '1024x1024'

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      size: imageSize as '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792',
      n: Math.min(Math.max(1, n), 1), // DALL-E 3 only supports n=1
      quality: 'standard',
      response_format: 'url',
    })

    if (!response.data || response.data.length === 0) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt || prompt,
    })
  } catch (error: any) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate image',
        details: error.response?.data || null
      },
      { status: 500 }
    )
  }
}
