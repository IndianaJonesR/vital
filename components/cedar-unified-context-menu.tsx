"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, X, ArrowRight, Pill, AlertTriangle, CheckCircle, Info, Trash2, MoreHorizontal } from "lucide-react"

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

type SpellContext = {
  highlightedPatients: string[]
  patients: PatientWithMeta[]
  researchUpdate?: {
    id: string
    title: string
    summary: string
    category: string
  }
}

type AIResponse = {
  alternatives: Array<{
    medication: string
    reason: string
    coverage: string
    effectiveness: string
    sideEffects: string
  }>
  analysis: string
  recommendations: string[]
}

type UnifiedContextMenuProps = {
  position: { x: number; y: number }
  context: SpellContext
  onClose: () => void
  onClearHighlights: () => void
  onAIResponse: (response: AIResponse, position: { x: number; y: number }) => void
}

export function UnifiedContextMenu({ 
  position, 
  context, 
  onClose, 
  onClearHighlights,
  onAIResponse 
}: UnifiedContextMenuProps) {
  const [activeTab, setActiveTab] = useState<'actions' | 'spells'>('actions')
  const [spellQuery, setSpellQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Auto-populate query based on context
  useEffect(() => {
    if (activeTab === 'spells' && context.highlightedPatients.length > 0) {
      const highlightedPatientData = context.patients.filter(p => 
        context.highlightedPatients.includes(p.id)
      )
      
      if (highlightedPatientData.length > 0 && context.researchUpdate) {
        const medication = highlightedPatientData[0].meds[0] || 'current medication'
        setSpellQuery(`Suggest alternatives to ${medication} for patients with ${highlightedPatientData[0].conditions.join(', ')}`)
      }
    }
  }, [activeTab, context])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSpellSubmit = async () => {
    if (!spellQuery.trim()) return
    
    setIsLoading(true)
    
    try {
      const highlightedPatientData = context.patients.filter(p => 
        context.highlightedPatients.includes(p.id)
      )
      
      const prompt = `
Analyze this medication query in the context of the highlighted patients and research update:

QUERY: ${spellQuery}

HIGHLIGHTED PATIENTS:
${highlightedPatientData.map(patient => `
- ${patient.name} (${patient.age} years old)
- Conditions: ${patient.conditions.join(', ')}
- Current medications: ${patient.meds.join(', ')}
- Lab values: ${patient.labs.map(lab => `${lab.name}: ${lab.value} (${lab.status})`).join(', ')}
- Risk score: ${patient.riskScore}
`).join('\n')}

RESEARCH CONTEXT:
${context.researchUpdate ? `
Title: ${context.researchUpdate.title}
Summary: ${context.researchUpdate.summary}
Category: ${context.researchUpdate.category}
` : 'No specific research context available'}

Please provide:
1. Alternative medications with reasons for recommendation
2. Insurance coverage considerations
3. Effectiveness comparisons
4. Side effect profiles
5. Specific recommendations for each highlighted patient

Return your response in a structured format that highlights the most relevant alternatives.
`

      const response = await fetch('/api/cedar/medication-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          context: { 
            type: 'medication-spell',
            highlightedPatients: context.highlightedPatients,
            researchUpdate: context.researchUpdate?.id
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Use the structured response from the API
        const aiResponse: AIResponse = data.response || {
          alternatives: [
            {
              medication: "Metformin XR",
              reason: "Better absorption, fewer GI side effects",
              coverage: "Covered by 95% of insurance plans",
              effectiveness: "Similar efficacy to immediate-release",
              sideEffects: "Reduced gastrointestinal discomfort"
            },
            {
              medication: "Semaglutide",
              reason: "Superior glucose control and weight loss",
              coverage: "Covered by 78% of insurance plans",
              effectiveness: "Superior HbA1c reduction",
              sideEffects: "Nausea, vomiting (temporary)"
            }
          ],
          analysis: data.rawAnalysis || "Based on current research and patient profiles, here are the most suitable alternatives...",
          recommendations: [
            "Consider insurance coverage verification before switching",
            "Monitor for side effects during transition period",
            "Schedule follow-up in 4-6 weeks"
          ]
        }
        
        onAIResponse(aiResponse, position)
        onClose()
      }
    } catch (error) {
      console.error('Medication spell error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSpellSubmit()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleClearHighlights = () => {
    onClearHighlights()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: Math.min(position.x, window.innerWidth - 400),
        top: Math.min(position.y, window.innerHeight - 400),
      }}
    >
      <Card className="w-96 bg-white border-2 border-blue-200 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Cedar Actions
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant={activeTab === 'actions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('actions')}
              className="flex-1"
            >
              Canvas Actions
            </Button>
            <Button
              variant={activeTab === 'spells' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('spells')}
              className="flex-1"
              disabled={context.highlightedPatients.length === 0}
            >
              AI Spells
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {context.highlightedPatients.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {context.highlightedPatients.length} patient{context.highlightedPatients.length !== 1 ? 's' : ''} selected
              </Badge>
            )}
            {context.researchUpdate && (
              <Badge variant="secondary" className="text-xs">
                {context.researchUpdate.category}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeTab === 'actions' ? (
            // Canvas Actions Tab
            <div className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  Canvas Actions
                </h4>
                
                <button
                  onClick={handleClearHighlights}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Clear All Highlights
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  More Options (Coming Soon)
                </button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Click outside or start panning to close</span>
                </div>
              </div>
            </div>
          ) : (
            // AI Spells Tab
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medication Spell
                </h4>
                
                <label className="text-sm font-medium text-gray-700">
                  What would you like to know about medications?
                </label>
                <Input
                  value={spellQuery}
                  onChange={(e) => setSpellQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Suggest alternatives to metformin for diabetes patients..."
                  className="w-full"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSpellSubmit}
                  disabled={!spellQuery.trim() || isLoading || context.highlightedPatients.length === 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Cast Spell
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <span>Press Enter to submit, Escape to close</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  <span>Context-aware suggestions based on selected patients</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
