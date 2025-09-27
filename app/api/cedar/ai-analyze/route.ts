import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, context } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Use OpenAI to analyze the research update and match patients
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a medical AI assistant that analyzes research updates and identifies which patients would be affected based on their medical data.

Your task is to:
1. Analyze the research update for medical criteria
2. Match patients based on their conditions, lab values, medications, and risk factors
3. Return ONLY a JSON array of patient IDs that match the criteria

Be precise and only include patients who clearly meet the criteria mentioned in the research update.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const aiResponse = response.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse the JSON response from AI
    let matchingPatientIds: string[] = []
    try {
      const parsed = JSON.parse(aiResponse)
      if (Array.isArray(parsed)) {
        matchingPatientIds = parsed
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Fallback: try to extract patient IDs from text
      const idMatches = aiResponse.match(/"([a-f0-9-]{36})"/g)
      if (idMatches) {
        matchingPatientIds = idMatches.map(match => match.replace(/"/g, ''))
      }
    }

    return NextResponse.json({
      success: true,
      matchingPatientIds,
      analysis: aiResponse,
      context
    })

  } catch (error) {
    console.error('Cedar AI analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze with AI' },
      { status: 500 }
    )
  }
}
