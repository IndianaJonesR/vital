"use client"

import { useRegisterState } from "cedar-os"
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

type UpdateWithMeta = {
  id: string
  source: string
  title: string
  summary: string
  rule_condition: string | null
  rule_criterion: string | null
  rule_action: string | null
  created_at: string | null
  category: string
  urgency: "critical" | "high" | "medium" | "low"
  timestamp: string
  readTime: string
  impactedPatients: string[]
}

type CedarAgentContextProps = {
  patients: PatientWithMeta[]
  updates: UpdateWithMeta[]
  highlightedPatients: string[]
  onHighlightPatients: (patientIds: string[]) => void
  onClearHighlights: () => void
}

export function CedarAgentContext({ 
  patients, 
  updates, 
  highlightedPatients, 
  onHighlightPatients, 
  onClearHighlights 
}: CedarAgentContextProps) {
  
  // Register patient data with CedarOS for agent context (simplified)
  useRegisterState({
    key: 'allPatients',
    description: 'Complete patient database with medical conditions, lab values, and risk scores',
    value: patients,
    setValue: () => {} // Read-only for agent context
  })

  // Register research updates with CedarOS for agent context (simplified)
  useRegisterState({
    key: 'allResearchUpdates',
    description: 'All available research updates and medical guidelines',
    value: updates,
    setValue: () => {} // Read-only for agent context
  })

  // Register highlighted patients state with CedarOS (simplified)
  useRegisterState({
    key: 'highlightedPatients',
    description: 'Currently highlighted patients on the canvas',
    value: highlightedPatients,
    setValue: () => {} // Controlled by parent component
  })

  return null // This component only provides CedarOS context
}
