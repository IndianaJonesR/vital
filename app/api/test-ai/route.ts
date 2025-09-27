import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  // Simple test to verify the AI endpoint is working
  const testPrompt = `
Analyze this medical research update and identify which patients would be affected:

RESEARCH UPDATE:
New guidelines recommend aggressive treatment for patients with HbA1c > 8.0

PATIENT DATA:
[
  {"id": "patient-1", "name": "John Doe", "age": 45, "conditions": ["Type 2 Diabetes"], "labs": [{"name": "HbA1c", "value": 9.2, "status": "high"}]},
  {"id": "patient-2", "name": "Jane Smith", "age": 35, "conditions": ["Hypertension"], "labs": [{"name": "HbA1c", "value": 6.5, "status": "normal"}]}
]

Return ONLY a JSON array of patient IDs that match the criteria.
`

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/cedar/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: testPrompt,
        context: { updateId: 'test', patientCount: 2 }
      })
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        testResults: data,
        message: 'AI endpoint is working correctly'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'AI endpoint failed',
        status: response.status
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
