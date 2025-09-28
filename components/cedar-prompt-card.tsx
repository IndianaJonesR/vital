"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  X, 
  Send, 
  Loader2,
  Sparkles
} from "lucide-react"
import Draggable from "react-draggable"

type CedarPromptCardProps = {
  position: { x: number; y: number }
  onClose: () => void
  onSubmit: (prompt: string) => void
  isProcessing?: boolean
}

export function CedarPromptCard({ 
  position, 
  onClose, 
  onSubmit, 
  isProcessing = false 
}: CedarPromptCardProps) {
  const [prompt, setPrompt] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [prompt])

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing) {
      onSubmit(prompt.trim())
    }
  }

  return (
    <Draggable
      defaultPosition={position}
      bounds={false}
      cancel=".no-drag"
      handle=".drag-handle"
    >
      <div className="absolute z-50">
        <Card className="bg-white/95 backdrop-blur-md border-2 border-gray-200/80 shadow-2xl w-[480px] animate-in fade-in-0 zoom-in-95 duration-200">
          <CardContent className="p-6">
            {/* Header with drag handle */}
            <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-base font-semibold text-gray-700">Vital.ai</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 no-drag"
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Prompt Input */}
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="How would you like to organize the patient cards?"
                className="min-h-[140px] resize-none bg-white/80 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 text-base no-drag"
                disabled={isProcessing}
              />
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  size="default"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white no-drag px-6 py-2"
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

            {/* Subtle hint */}
            <p className="text-sm text-gray-400 mt-3 text-center">
              Press Ctrl+Enter to submit • Escape to close
            </p>
          </CardContent>
        </Card>
      </div>
    </Draggable>
  )
}
