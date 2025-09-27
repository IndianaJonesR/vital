"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Users, Loader2, Sparkles } from "lucide-react"

type PatientWithMeta = {
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
  lastVisit: string
}

type CedarPatientMatcherProps = {
  updateText: string
  updateId: string
  patients: PatientWithMeta[]
  onMatchComplete: (matchingPatientIds: string[]) => void
  onMatchStart: () => void
  isMatching: boolean
}

export function CedarPatientMatcher({ 
  updateText, 
  updateId, 
  patients, 
  onMatchComplete, 
  onMatchStart,
  isMatching 
}: CedarPatientMatcherProps) {
  // Use local state for simplicity and reliability
  const [localState, setLocalState] = useState({
    matchingResults: null,
    isProcessing: false,
    error: null
  })

  const handleMatchPatients = async () => {
    onMatchStart()
    setLocalState(prev => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Create a comprehensive patient context for the AI
      const patientContext = patients.map(patient => ({
        id: patient.id,
        name: patient.name,
        age: patient.age,
        conditions: patient.conditions,
        medications: patient.meds,
        labValues: patient.labs.map(lab => ({
          name: lab.name,
          value: lab.value,
          status: lab.status
        })),
        riskScore: patient.riskScore,
        priority: patient.priority
      }))

      // Use Cedar's AI agent to analyze the research update and match patients
      const analysisPrompt = `
Analyze this medical research update and identify which patients would be affected:

RESEARCH UPDATE:
${updateText}

PATIENT DATA:
${JSON.stringify(patientContext, null, 2)}

Please identify which patients match the criteria mentioned in the research update. Consider:
1. Medical conditions mentioned in the research
2. Lab value thresholds (e.g., HbA1c > 8.0, blood pressure > 130/80)
3. Age ranges
4. Medication requirements
5. Risk factors and severity

Return ONLY a JSON array of patient IDs that match the criteria, like this:
["patient-id-1", "patient-id-2", "patient-id-3"]

If no patients match, return an empty array: []
`

      // This will use Cedar's AI agent to process the request
      console.log('Sending AI analysis request for update:', updateId)
      const response = await fetch('/api/cedar/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: analysisPrompt,
          context: { updateId, patientCount: patients.length }
        })
      })

      console.log('AI analysis response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        const matchingIds = data.matchingPatientIds || []
        
        console.log('AI analysis results:', { matchingIds, analysis: data.analysis })
        
        setLocalState(prev => ({ 
          ...prev,
          matchingResults: matchingIds,
          isProcessing: false 
        }))
        
        onMatchComplete(matchingIds)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('AI analysis failed:', errorData)
        throw new Error(`Failed to analyze patients: ${errorData.error || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('Cedar AI matching error:', error)
      setLocalState(prev => ({ 
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isProcessing: false 
      }))
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleMatchPatients}
      disabled={isMatching || localState.isProcessing}
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
    >
      {isMatching || localState.isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          AI Matching...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Match Patients
        </>
      )}
    </Button>
  )
}
