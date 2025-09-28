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
          color: 'bg-blue-500',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        }
      case 'patient-analysis':
        return {
          icon: Users,
          title: 'Patient Analysis',
          color: 'bg-green-500',
          borderColor: 'border-green-200',
          bgColor: 'bg-green-50'
        }
      case 'risk-assessment':
        return {
          icon: TrendingUp,
          title: 'Risk Assessment',
          color: 'bg-orange-500',
          borderColor: 'border-orange-200',
          bgColor: 'bg-orange-50'
        }
      case 'treatment-plan':
        return {
          icon: Stethoscope,
          title: 'Treatment Plan',
          color: 'bg-purple-500',
          borderColor: 'border-purple-200',
          bgColor: 'bg-purple-50'
        }
      case 'research-insights':
        return {
          icon: Brain,
          title: 'Research Insights',
          color: 'bg-indigo-500',
          borderColor: 'border-indigo-200',
          bgColor: 'bg-indigo-50'
        }
      default:
        return {
          icon: Sparkles,
          title: 'AI Analysis',
          color: 'bg-blue-500',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
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

  const renderMedicationContent = () => (
    <div className="space-y-4">
      {/* Medication Alternatives */}
      {response.alternatives.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Recommended Alternatives
          </h4>
          
          {response.alternatives.map((alt, index) => (
            <div key={index} className={`${typeInfo.bgColor} rounded-lg p-3 border ${typeInfo.borderColor}`}>
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-gray-800">{alt.medication}</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(alt.medication, `medication-${index}`)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className={`h-3 w-3 ${copiedItem === `medication-${index}` ? 'text-green-600' : 'text-gray-400'}`} />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-3 w-3 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{alt.reason}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                    {alt.coverage}
                  </Badge>
                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                    {alt.effectiveness}
                  </Badge>
                </div>
                
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{alt.sideEffects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderAnalysisContent = () => (
    <div className="space-y-4">
      {/* Main Analysis */}
      <div className={`${typeInfo.bgColor} rounded-lg p-4 border ${typeInfo.borderColor}`}>
        <div className="flex items-start gap-3">
          <IconComponent className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-800 font-medium mb-2">Analysis Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">{response.analysis}</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {response.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Key Recommendations
          </h4>
          <div className="space-y-1">
            {response.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <ArrowRight className="h-3 w-3 text-blue-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Draggable
      defaultPosition={position}
      bounds="parent"
      cancel=".no-drag"
    >
      <div className="absolute z-40">
        <Card 
          ref={cardRef}
          className={`bg-white border-2 ${typeInfo.borderColor} shadow-2xl transition-all duration-300 ${
            isExpanded ? 'w-96' : 'w-80'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${typeInfo.color} rounded-full flex items-center justify-center`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {typeInfo.title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? "−" : "+"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {response.type === 'medication' ? renderMedicationContent() : renderAnalysisContent()}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleCopy(response.analysis, 'full-response')}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedItem === 'full-response' ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open('https://pubmed.ncbi.nlm.nih.gov/', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Research
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                title="Send to Impericus Network (Coming Soon)"
                disabled
              >
                <Send className="h-3 w-3 mr-1" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Draggable>
  )
}
