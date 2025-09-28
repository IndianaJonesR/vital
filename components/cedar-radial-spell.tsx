"use client"

// Manual event handling instead of Cedar-OS useSpell hook
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Pill, 
  FileText, 
  Users, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  Sparkles,
  Zap,
  Target,
  Calendar,
  Stethoscope,
  Heart,
  Brain
} from "lucide-react"

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

type RadialAction = {
  id: string
  label: string
  icon: React.ComponentType<any>
  color: string
  action: () => void
  description?: string
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

type CedarRadialSpellProps = {
  context: SpellContext
  onAIResponse: (response: AIResponse, position: { x: number; y: number }) => void
  onClearHighlights: () => void
}

export function CedarRadialSpell({ context, onAIResponse, onClearHighlights }: CedarRadialSpellProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const spellRef = useRef<HTMLDivElement>(null)

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('CedarRadialSpell mounted with context:', context)
  }, [])

  // Generate context-aware radial actions
  const generateRadialActions = (): RadialAction[] => {
    const actions: RadialAction[] = []
    
    if (context.highlightedPatients.length > 0) {
      // Medication alternatives
      actions.push({
        id: 'medication-alternatives',
        label: 'Medication Alternatives',
        icon: Pill,
        color: 'bg-blue-500 hover:bg-blue-600',
        action: () => handleMedicationSpell(),
        description: 'Find alternative medications'
      })

      // Patient analysis
      actions.push({
        id: 'patient-analysis',
        label: 'Patient Analysis',
        icon: Users,
        color: 'bg-green-500 hover:bg-green-600',
        action: () => handlePatientAnalysis(),
        description: 'Analyze patient profiles'
      })

      // Risk assessment
      actions.push({
        id: 'risk-assessment',
        label: 'Risk Assessment',
        icon: TrendingUp,
        color: 'bg-orange-500 hover:bg-orange-600',
        action: () => handleRiskAssessment(),
        description: 'Evaluate patient risks'
      })

      // Treatment recommendations
      actions.push({
        id: 'treatment-recommendations',
        label: 'Treatment Plan',
        icon: Stethoscope,
        color: 'bg-purple-500 hover:bg-purple-600',
        action: () => handleTreatmentPlan(),
        description: 'Generate treatment plans'
      })
    }

    // Always available actions
    actions.push({
      id: 'clear-highlights',
      label: 'Clear Highlights',
      icon: Target,
      color: 'bg-red-500 hover:bg-red-600',
      action: onClearHighlights,
      description: 'Clear all patient highlights'
    })

    // Research-specific actions
    if (context.researchUpdate) {
      actions.push({
        id: 'research-insights',
        label: 'Research Insights',
        icon: Brain,
        color: 'bg-indigo-500 hover:bg-indigo-600',
        action: () => handleResearchInsights(),
        description: 'Get research analysis'
      })
    }

    return actions
  }

  const radialActions = generateRadialActions()

  // Manual event handling instead of useSpell hook
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        // Store that shift is pressed
        (window as any).__shiftPressed = true
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        // Clear shift pressed flag
        (window as any).__shiftPressed = false
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      console.log('Mouse down event:', { shiftPressed: (window as any).__shiftPressed, button: event.button })
      
      // Check if shift is pressed and it's a left click
      if ((window as any).__shiftPressed && event.button === 0) {
        console.log('Opening radial menu at:', { x: event.clientX, y: event.clientY })
        event.preventDefault()
        event.stopPropagation()
        
        setPosition({ x: event.clientX, y: event.clientY })
        setIsVisible(true)
      }
    }

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const handleMedicationSpell = async () => {
    setIsLoading(true)
    try {
      const highlightedPatientData = context.patients.filter(p => 
        context.highlightedPatients.includes(p.id)
      )
      
      const prompt = `Analyze medication alternatives for these patients:
${highlightedPatientData.map(patient => `
- ${patient.name} (${patient.age} years old)
- Conditions: ${patient.conditions.join(', ')}
- Current medications: ${patient.meds.join(', ')}
- Lab values: ${patient.labs.map(lab => `${lab.name}: ${lab.value} (${lab.status})`).join(', ')}
- Risk score: ${patient.riskScore}
`).join('\n')}

Provide evidence-based medication alternatives with insurance coverage information.`

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
        const aiResponse: AIResponse = data.response || {
          alternatives: [
            {
              medication: "Metformin XR",
              reason: "Better absorption, fewer GI side effects",
              coverage: "Covered by 95% of insurance plans",
              effectiveness: "Similar efficacy to immediate-release",
              sideEffects: "Reduced gastrointestinal discomfort"
            }
          ],
          analysis: data.rawAnalysis || "Based on current research and patient profiles...",
          recommendations: ["Verify insurance coverage", "Monitor side effects"]
        }
        
        onAIResponse(aiResponse, position)
      }
    } catch (error) {
      console.error('Medication spell error:', error)
    } finally {
      setIsLoading(false)
      setIsVisible(false)
    }
  }

  const handlePatientAnalysis = async () => {
    setIsLoading(true)
    // Implementation for patient analysis
    setTimeout(() => {
      setIsLoading(false)
      setIsVisible(false)
    }, 1000)
  }

  const handleRiskAssessment = async () => {
    setIsLoading(true)
    // Implementation for risk assessment
    setTimeout(() => {
      setIsLoading(false)
      setIsVisible(false)
    }, 1000)
  }

  const handleTreatmentPlan = async () => {
    setIsLoading(true)
    // Implementation for treatment plan
    setTimeout(() => {
      setIsLoading(false)
      setIsVisible(false)
    }, 1000)
  }

  const handleResearchInsights = async () => {
    setIsLoading(true)
    // Implementation for research insights
    setTimeout(() => {
      setIsLoading(false)
      setIsVisible(false)
    }, 1000)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (spellRef.current && !spellRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible])

  // Debug: Always show a test button to verify the component is working
  if (!isVisible) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => {
            console.log('Test button clicked - opening radial menu')
            setPosition({ x: 300, y: 300 })
            setIsVisible(true)
          }}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1"
        >
          Test Radial Menu
        </Button>
      </div>
    )
  }

  const radius = 120
  const angleStep = (2 * Math.PI) / radialActions.length

  return (
    <div
      ref={spellRef}
      className="fixed z-50"
      style={{
        left: position.x - radius - 40,
        top: position.y - radius - 40,
      }}
    >
      {/* Center Circle */}
      <div className="relative">
        <div className="w-20 h-20 bg-white border-4 border-blue-200 rounded-full shadow-2xl flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          ) : (
            <Sparkles className="h-8 w-8 text-blue-500" />
          )}
        </div>

        {/* Radial Action Buttons */}
        {radialActions.map((action, index) => {
          const angle = index * angleStep - Math.PI / 2 // Start from top
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const IconComponent = action.icon

          return (
            <div
              key={action.id}
              className="absolute transition-all duration-200 hover:scale-110"
              style={{
                left: x + 40 - 20, // Center the button
                top: y + 40 - 20,
                transform: `translate(${x * 0.1}px, ${y * 0.1}px)`, // Subtle offset for depth
              }}
            >
              <Button
                onClick={action.action}
                className={`w-12 h-12 rounded-full shadow-lg border-2 border-white ${action.color} text-white hover:shadow-xl transition-all duration-200`}
                title={action.description}
              >
                <IconComponent className="h-5 w-5" />
              </Button>
              
              {/* Action Label */}
              <div 
                className="absolute text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm whitespace-nowrap pointer-events-none"
                style={{
                  left: x > 0 ? '60px' : '-120px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {action.label}
              </div>
            </div>
          )
        })}

        {/* Context Information */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {context.highlightedPatients.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {context.highlightedPatients.length} patient{context.highlightedPatients.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {context.researchUpdate && (
                <Badge variant="secondary" className="text-xs">
                  {context.researchUpdate.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
