import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
})

type Patient = {
  id: string
  name: string
  age: number
  conditions: string[]
  meds: string[]
  labs: Array<{
    name: string
    value: number | string
    status: string
  }>
  priority: "critical" | "high" | "medium" | "low"
  riskScore: number
  position?: { x: number; y: number }
}

type AnalysisRequest = {
  prompt: string
  groupingType: string
  context: {
    patients: Patient[]
    highlightedPatients: string[]
    totalPatients: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { prompt, groupingType, context } = body

    console.log('🤖 Processing AI analysis request:', { 
      prompt: prompt.substring(0, 100) + '...', 
      groupingType, 
      patientCount: context.patients.length 
    })

    // Create a system prompt for the CedarOS agent
    const systemPrompt = `You are a medical AI assistant integrated with CedarOS that helps healthcare providers organize and group patient cards on a visual canvas.

Your task is to analyze the user's request and provide structured grouping recommendations based on the patient data provided.

Available grouping types:
- visual-group: Move cards into visual clusters on the canvas
- highlight-filter: Highlight patients that match specific criteria
- risk-stratify: Group patients by risk levels or severity
- condition-cluster: Group patients by similar medical conditions

Patient data includes: conditions, medications, lab values, risk scores, priority levels, and demographics.

Respond with a JSON object containing:
{
  "analysis": "Brief explanation of your analysis and grouping strategy",
  "groupings": [
    {
      "name": "Group name",
      "description": "Why these patients are grouped together",
      "patientIds": ["patient1", "patient2"],
      "criteria": "The specific criteria used for grouping",
      "priority": "high|medium|low",
      "visualHint": "Suggested visual treatment (color, position, etc.)"
    }
  ],
  "highlightedPatients": ["patient1", "patient2"], // For highlight-filter type
  "recommendations": ["Action item 1", "Action item 2"],
  "summary": "Overall summary of findings"
}

Be precise and only include patients that clearly meet the specified criteria.`

    // Create the user prompt with context
    const userPrompt = `
User Request: "${prompt}"
Grouping Type: ${groupingType}

Patient Data:
${context.patients.map(p => `
Patient: ${p.name} (ID: ${p.id})
- Age: ${p.age}
- Conditions: ${p.conditions.join(', ')}
- Medications: ${p.meds.join(', ')}
- Labs: ${p.labs.map(lab => `${lab.name}: ${lab.value} (${lab.status})`).join(', ')}
- Priority: ${p.priority}
- Risk Score: ${p.riskScore}
`).join('\n')}

Currently Highlighted Patients: ${context.highlightedPatients.length > 0 ? context.highlightedPatients.join(', ') : 'None'}

Please analyze this data and provide grouping recommendations based on the user's request.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    let analysisResult
    try {
      analysisResult = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid JSON response from AI')
    }

    console.log('✅ AI analysis completed:', {
      groupingsCount: analysisResult.groupings?.length || 0,
      highlightedCount: analysisResult.highlightedPatients?.length || 0
    })

    // Validate that patient IDs exist in our dataset
    const validPatientIds = new Set(context.patients.map(p => p.id))
    
    if (analysisResult.groupings) {
      analysisResult.groupings = analysisResult.groupings.map((group: any) => ({
        ...group,
        patientIds: group.patientIds?.filter((id: string) => validPatientIds.has(id)) || []
      }))
    }

    if (analysisResult.highlightedPatients) {
      analysisResult.highlightedPatients = analysisResult.highlightedPatients.filter(
        (id: string) => validPatientIds.has(id)
      )
    }

    return NextResponse.json({
      success: true,
      ...analysisResult,
      metadata: {
        processedAt: new Date().toISOString(),
        groupingType,
        patientCount: context.patients.length
      }
    })

  } catch (error) {
    console.error('❌ Error in AI analysis:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process AI analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}