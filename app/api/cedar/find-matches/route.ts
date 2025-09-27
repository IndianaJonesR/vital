
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { updateText, updateId } = await request.json()

    if (!updateText) {
      return NextResponse.json(
        { error: 'Update text is required' },
        { status: 400 }
      )
    }

    // Use OpenAI to analyze the research update and extract patient criteria
    const criteria = await analyzeUpdateWithAI(updateText)
    
    // Find patients matching the criteria using proper Supabase queries
    const matchingPatients = await findMatchingPatients(criteria)
    
    return NextResponse.json({
      success: true,
      data: {
        updateId,
        criteria,
        matchingPatientIds: matchingPatients.map(p => p.id),
        matchingPatients,
        patientCount: matchingPatients.length
      }
    })

  } catch (error) {
    console.error('Cedar-OS find-matches error:', error)
    return NextResponse.json(
      { error: 'Failed to find matching patients' },
      { status: 500 }
    )
  }
}

// AI-powered update analysis using OpenAI
async function analyzeUpdateWithAI(updateText: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a medical AI assistant that analyzes research updates and extracts patient criteria. 
            Return ONLY a JSON object with this exact structure:
            {
              "conditions": ["condition1", "condition2"],
              "medications": ["med1", "med2"],
              "labValues": {"labName": thresholdValue},
              "ageRange": {"min": 18, "max": 65},
              "urgency": "low|medium|high|critical"
            }
            
            Extract ONLY what is explicitly mentioned in the text. Do not make assumptions.
            For lab values, extract the threshold mentioned (e.g., HbA1c > 8.0 becomes {"HbA1c": 8.0})
            For conditions, use the exact medical terms mentioned.
            Return empty arrays/objects if nothing is mentioned.`
          },
          {
            role: 'user',
            content: `Analyze this research update and extract patient criteria:\n\n${updateText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    })

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response from AI
    const criteria = JSON.parse(aiResponse)
    return criteria

  } catch (error) {
    console.error('OpenAI analysis error:', error)
    // Fallback to simple pattern matching
    return fallbackCriteriaAnalysis(updateText)
  }
}

// Fallback analysis without OpenAI
function fallbackCriteriaAnalysis(updateText: string) {
  const criteria = {
    conditions: [],
    medications: [],
    labValues: {},
    ageRange: null,
    urgency: 'medium'
  }

  // Extract conditions with exact matching
  if (updateText.toLowerCase().includes('diabetes')) {
    criteria.conditions.push('Type 2 Diabetes')
  }
  if (updateText.toLowerCase().includes('copd')) {
    criteria.conditions.push('COPD')
  }
  if (updateText.toLowerCase().includes('breast cancer') || updateText.toLowerCase().includes('her2')) {
    criteria.conditions.push('HER2+ Breast Cancer')
  }
  if (updateText.toLowerCase().includes('asthma')) {
    criteria.conditions.push('asthma')
  }

  // Extract lab values
  const hba1cMatch = updateText.match(/hba1c[^0-9]*([0-9.]+)/i)
  if (hba1cMatch) {
    criteria.labValues['HbA1c'] = parseFloat(hba1cMatch[1])
  }

  return criteria
}

// Find patients matching the criteria using proper Supabase queries
async function findMatchingPatients(criteria: any) {
  let matchingPatients: any[] = []

  try {
    // Get all patients first
    const { data: allPatients, error } = await supabase
      .from('patients')
      .select('*')

    if (error) {
      console.error('Error fetching patients:', error)
      return []
    }

    // Filter patients based on exact criteria matching
    matchingPatients = allPatients?.filter(patient => {
      let matches = true

      // Check conditions - must have exact match
      if (criteria.conditions.length > 0) {
        const patientConditions = patient.conditions || []
        const hasMatchingCondition = criteria.conditions.some((criteriaCondition: string) =>
          patientConditions.some((patientCondition: string) =>
            patientCondition.toLowerCase().includes(criteriaCondition.toLowerCase())
          )
        )
        if (!hasMatchingCondition) {
          matches = false
        }
      }

      // Check lab values if specified
      if (matches && Object.keys(criteria.labValues).length > 0) {
        const patientLabs = Array.isArray(patient.labs) ? patient.labs : []
        
        for (const [labName, thresholdValue] of Object.entries(criteria.labValues)) {
          const patientLab = patientLabs.find((lab: any) => 
            lab.name?.toLowerCase().includes(labName.toLowerCase())
          )
          
          if (patientLab && patientLab.value) {
            const patientValue = parseFloat(patientLab.value)
            if (patientValue <= thresholdValue) {
              matches = false // Patient doesn't meet threshold
              break
            }
          }
        }
      }

      return matches
    }) || []

  } catch (error) {
    console.error('Error filtering patients:', error)
    return []
  }

  return matchingPatients
}
