"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  X, 
  Pill, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  ArrowRight,
  Copy,
  ExternalLink,
  TrendingUp,
  Shield,
  Zap
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
}

type AIResponseBoxProps = {
  response: AIResponse
  position: { x: number; y: number }
  onClose: () => void
  onConnect?: (fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => void
}

export function AIResponseBox({ response, position, onClose, onConnect }: AIResponseBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(type)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getCoverageColor = (coverage: string) => {
    const percentage = parseInt(coverage.match(/\d+/)?.[0] || '0')
    if (percentage >= 90) return "bg-green-100 text-green-700 border-green-200"
    if (percentage >= 75) return "bg-yellow-100 text-yellow-700 border-yellow-200"
    return "bg-red-100 text-red-700 border-red-200"
  }

  const getEffectivenessColor = (effectiveness: string) => {
    if (effectiveness.toLowerCase().includes('superior')) return "bg-blue-100 text-blue-700 border-blue-200"
    if (effectiveness.toLowerCase().includes('similar')) return "bg-green-100 text-green-700 border-green-200"
    return "bg-gray-100 text-gray-700 border-gray-200"
  }

  return (
    <Draggable
      defaultPosition={position}
      bounds="parent"
      cancel=".no-drag"
    >
      <div className="absolute z-40">
        <Card 
          ref={cardRef}
          className={`bg-white border-2 border-blue-200 shadow-2xl transition-all duration-300 ${
            isExpanded ? 'w-96' : 'w-80'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  AI Analysis
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
                <Zap className="h-3 w-3 mr-1" />
                Context-Aware
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {response.alternatives.length} alternatives
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Analysis Summary */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Analysis Summary</p>
                  <p className="text-sm text-blue-700 mt-1">{response.analysis}</p>
                </div>
              </div>
            </div>

            {/* Medication Alternatives */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Pill className="h-4 w-4" />
                Recommended Alternatives
              </h4>
              
              {response.alternatives.map((alt, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
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
                      <Badge className={`text-xs ${getCoverageColor(alt.coverage)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {alt.coverage}
                      </Badge>
                      <Badge className={`text-xs ${getEffectivenessColor(alt.effectiveness)}`}>
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

            {/* Recommendations */}
            {isExpanded && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Recommendations
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

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleCopy(JSON.stringify(response, null, 2), 'full-response')}
              >
                <Copy className="h-3 w-3 mr-1" />
                {copiedItem === 'full-response' ? 'Copied!' : 'Copy Analysis'}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </Draggable>
  )
}
