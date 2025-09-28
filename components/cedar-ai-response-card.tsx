"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  X, 
  Pill, 
  Users, 
  TrendingUp, 
  Stethoscope,
  Brain,
  Copy,
  ExternalLink,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  Send
} from "lucide-react"
import Draggable from "react-draggable"

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
  type?: 'medication' | 'patient-analysis' | 'risk-assessment' | 'treatment-plan' | 'research-insights'
}

type AIResponseCardProps = {
  response: AIResponse
  position: { x: number; y: number }
  onClose: () => void
  onConnect?: (fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => void
}

export function AIResponseCard({ response, position, onClose, onConnect }: AIResponseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const getResponseTypeInfo = () => {
    switch (response.type) {
      case 'medication':
        return {
          icon: Pill,
          title: 'Medication Alternatives',
          color: 'text-blue-600'
        }
      case 'patient-analysis':
        return {
          icon: Users,
          title: 'Patient Analysis',
          color: 'text-green-600'
        }
      case 'risk-assessment':
        return {
          icon: TrendingUp,
          title: 'Risk Assessment',
          color: 'text-orange-600'
        }
      case 'treatment-plan':
        return {
          icon: Stethoscope,
          title: 'Treatment Plan',
          color: 'text-purple-600'
        }
      case 'research-insights':
        return {
          icon: Brain,
          title: 'Research Insights',
          color: 'text-indigo-600'
        }
      default:
        return {
          icon: Sparkles,
          title: 'AI Analysis',
          color: 'text-blue-600'
        }
    }
  }

  const typeInfo = getResponseTypeInfo()
  const IconComponent = typeInfo.icon

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(type)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const parseAnalysisText = (text: string) => {
    // Split the analysis into summary and bullet points
    const lines = text.split('\n').filter(line => line.trim())
    const summary = lines.find(line => !line.trim().startsWith('•') && !line.trim().startsWith('-') && line.length > 20) || text.slice(0, 200) + '...'
    const bulletPoints = lines.filter(line => line.trim().startsWith('•') || line.trim().startsWith('-')).map(line => line.replace(/^[•\-]\s*/, ''))
    
    return { summary, bulletPoints }
  }

  const { summary, bulletPoints } = parseAnalysisText(response.analysis)

  return (
    <Draggable
      defaultPosition={position}
      bounds="parent"
      cancel=".no-drag"
    >
      <div className="absolute">
        <Card 
          ref={cardRef}
          className="bg-white border-2 border-gray-200 rounded-xl shadow-lg transition-all duration-300 w-80 h-auto cursor-move hover:shadow-xl hover:scale-105 group"
        >
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <IconComponent className={`h-4 w-4 ${typeInfo.color}`} />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {typeInfo.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 no-drag"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-4">
            {/* Main Summary */}
            <div className="space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary}
              </p>
              
              {/* Key Points */}
              {bulletPoints.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800">Key Points:</h4>
                  <div className="space-y-1">
                    {bulletPoints.slice(0, 3).map((point, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {response.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800">Next Steps:</h4>
                  <div className="space-y-1">
                    {response.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <ArrowRight className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs no-drag"
                onClick={() => handleCopy(response.analysis, 'full-response')}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedItem === 'full-response' ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs no-drag"
                onClick={() => window.open('https://pubmed.ncbi.nlm.nih.gov/', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Research
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Draggable>
  )
}
