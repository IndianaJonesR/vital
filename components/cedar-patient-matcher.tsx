"use client"

import { useRegisterState, useCedarStore } from "cedar-os"
import { Button } from "@/components/ui/button"
import { Users, Loader2, Sparkles } from "lucide-react"
import { z } from "zod"

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
  const executeStateSetter = useCedarStore((state) => state.executeStateSetter)

  const handleMatchPatients = async () => {
    onMatchStart()
    
    try {
      console.log('Starting AI analysis for update:', updateId)
      
      // Create comprehensive patient context for the AI
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

      // Use a simpler, more direct approach
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

      const response = await fetch('/api/cedar/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: analysisPrompt,
          context: { updateId, patientCount: patients.length }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const matchingIds = data.matchingPatientIds || []
        
        console.log('🎯 AI analysis results:', { 
          matchingIds, 
          analysis: data.analysis,
          totalPatients: patients.length,
          patientIds: patients.map(p => p.id)
        })
        
        // Call the completion handler
        console.log('🚀 Calling onMatchComplete with:', matchingIds)
        onMatchComplete(matchingIds)
        
        // Also log the patient names for debugging
        const matchingPatients = patients.filter(p => matchingIds.includes(p.id))
        console.log('👥 Matching patients:', matchingPatients.map(p => ({ id: p.id, name: p.name })))
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('AI analysis failed:', errorData)
        throw new Error(`Failed to analyze patients: ${errorData.error || 'Unknown error'}`)
      }

    } catch (error) {
      console.error('AI matching error:', error)
      // Reset loading state on error
      onMatchComplete([])
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleMatchPatients}
      disabled={isMatching}
      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
    >
      {isMatching ? (
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
