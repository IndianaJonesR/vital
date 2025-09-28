"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Sparkles, 
  Send, 
  X, 
  Loader2, 
  Wand2,
  Users,
  Target,
  Filter,
  Group
} from "lucide-react"

type PromptModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (prompt: string, groupingType: string) => void
  isProcessing?: boolean
  context?: {
    highlightedPatients: string[]
    totalPatients: number
    selectedMedications?: string[]
  }
}

const GROUPING_TYPES = [
  {
    id: 'visual-group',
    label: 'Visual Grouping',
    description: 'Move cards into visual clusters',
    icon: Group,
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'highlight-filter',
    label: 'Highlight & Filter',
    description: 'Highlight matching patients',
    icon: Filter,
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  {
    id: 'risk-stratify',
    label: 'Risk Stratification',
    description: 'Group by risk levels',
    icon: Target,
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  {
    id: 'condition-cluster',
    label: 'Condition Clustering',
    description: 'Group by similar conditions',
    icon: Users,
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  }
]

const PROMPT_SUGGESTIONS = [
  "Group patients with diabetes by their HbA1c levels",
  "Show me patients who might benefit from medication review",
  "Cluster patients by cardiovascular risk factors",
  "Group highlighted patients by treatment complexity",
  "Organize patients by medication adherence patterns",
  "Show patients with similar lab abnormalities"
]

export function CedarPromptModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isProcessing = false,
  context 
}: PromptModalProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedGroupingType, setSelectedGroupingType] = useState("visual-group")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      // Escape to close
      if (e.key === 'Escape') {
        onClose()
      }
      
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, prompt, selectedGroupingType])

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt.trim(), selectedGroupingType)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
    textareaRef.current?.focus()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-2xl mx-4 bg-white/95 backdrop-blur-md border-2 border-gray-200/50 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  CedarOS Agent Prompt
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Tell the AI how you want to group or organize your patient cards
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Context Info */}
          {context && (
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                {context.totalPatients} total patients
              </Badge>
              {context.highlightedPatients.length > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  {context.highlightedPatients.length} highlighted
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Grouping Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              How should the AI organize the cards?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {GROUPING_TYPES.map((type) => {
                const IconComponent = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedGroupingType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                      selectedGroupingType === type.id
                        ? `${type.color} border-current shadow-md`
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium text-sm">{type.label}</span>
                    </div>
                    <p className="text-xs opacity-80">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Describe what you want to do
            </label>
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Group patients with diabetes by their HbA1c control levels..."
              className="min-h-[100px] resize-none bg-white/80 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Ctrl+Enter to submit, or Escape to close
            </p>
          </div>

          {/* Prompt Suggestions */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quick suggestions
            </label>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors border border-gray-200 hover:border-gray-300"
                  disabled={isProcessing}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Sparkles className="h-3 w-3" />
              <span>Powered by CedarOS Agent</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isProcessing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
