"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FileText,
  Calendar,
  User,
  TestTube,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Sparkles,
  Shield,
  Target,
  Pause as Pulse,
  Eye,
  Stethoscope,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Grid,
  Trash2,
  MoreHorizontal,
  Menu,
  X,
} from "lucide-react"
import Draggable from "react-draggable"
import { CedarRadialSpell } from "@/components/cedar-radial-spell"
import { AIResponseCard } from "@/components/cedar-ai-response-card"
import { CedarPromptCard } from "@/components/cedar-prompt-card"

type PatientLab = {
  name: string
  value: number | string
  status: string
}

type PriorityLevel = "critical" | "high" | "medium" | "low"

type PatientWithMeta = {
  id: string
  name: string
  age: number
  conditions: string[]
  meds: string[]
  labs: PatientLab[]
  priority: PriorityLevel
  riskScore: number
  lastVisit: string
  position?: { x: number; y: number }
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
  type?: 'medication' | 'patient-analysis' | 'risk-assessment' | 'treatment-plan' | 'research-insights'
}

type AIResponseCardState = {
  id: string
  response: AIResponse
  position: { x: number; y: number }
}

type PatientGroup = {
  id: string
  name: string
  description: string
  patientIds: string[]
  criteria: string
  priority: "high" | "medium" | "low"
  visualHint: string
  color: string
  ringColor: string
  bgColor: string
  textColor: string
  position: { x: number; y: number }
}

type PatientCanvasProps = {
  patients: PatientWithMeta[]
  highlightedPatients: string[]
  glowingPatients: string[]
  error: string | null
  loading: boolean
  onClearHighlights?: () => void
  isResearchStreamCollapsed?: boolean
  onToggleResearchStream?: () => void
  researchUpdate?: {
    id: string
    title: string
    summary: string
    category: string
  }
}

const getConditionColor = (condition: string) => {
  switch (condition.toLowerCase()) {
    case "type 2 diabetes":
    case "diabetes":
    case "pre-diabetes":
      return "bg-blue-50 text-blue-700 border border-blue-200"
    case "hypertension":
    case "portal htn":
      return "bg-rose-50 text-rose-700 border border-rose-200"
    case "her2+ breast cancer":
    case "prostate cancer":
    case "thyroid cancer":
      return "bg-purple-50 text-purple-700 border border-purple-200"
    case "asthma":
    case "copd":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    case "atrial fibrillation":
    case "heart failure":
    case "cad":
      return "bg-red-50 text-red-700 border border-red-200"
    case "anxiety disorder":
    case "depression":
    case "migraine":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200"
    case "rheumatoid arthritis":
    case "lupus":
    case "osteoarthritis":
      return "bg-amber-50 text-amber-700 border border-amber-200"
    case "sleep apnea":
    case "obesity":
      return "bg-cyan-50 text-cyan-700 border border-cyan-200"
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200"
  }
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "critical":
      return {
        color: "bg-rose-500 text-white",
        icon: AlertTriangle,
        ring: "ring-rose-200",
        glow: "shadow-red-200/30",
        pulse: "",
      }
    case "high":
      return {
        color: "bg-amber-500 text-white",
        icon: TrendingUp,
        ring: "ring-amber-200",
        glow: "shadow-orange-200/30",
        pulse: "",
      }
    case "medium":
      return {
        color: "bg-yellow-400 text-amber-900",
        icon: Clock,
        ring: "ring-yellow-200",
        glow: "shadow-yellow-200/30",
        pulse: "",
      }
    case "low":
      return {
        color: "bg-emerald-500 text-white",
        icon: CheckCircle,
        ring: "ring-emerald-200",
        glow: "shadow-emerald-200/30",
        pulse: "",
      }
    default:
      return {
        color: "bg-slate-500 text-white",
        icon: Clock,
        ring: "ring-gray-200",
        glow: "shadow-slate-200/30",
        pulse: "",
      }
  }
}

const getRiskScoreColor = (score: number) => {
  if (score >= 85) return "text-red-600 bg-red-50 border-red-200"
  if (score >= 70) return "text-orange-600 bg-orange-50 border-orange-200"
  if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200"
  return "text-green-600 bg-green-50 border-green-200"
}

export function PatientCanvas({ patients, highlightedPatients, glowingPatients, error, loading, onClearHighlights, isResearchStreamCollapsed, onToggleResearchStream, researchUpdate }: PatientCanvasProps) {
  const [zoom, setZoom] = useState(0.7) // More zoomed out by default
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(false) // Changed to false to remove grid by default
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  
  // Canvas controls state
  const [isControlsMinimized, setIsControlsMinimized] = useState(false)
  
  // AI Response Cards state
  const [aiResponseCards, setAiResponseCards] = useState<AIResponseCardState[]>([])
  
  // Prompt Card state
  const [promptCard, setPromptCard] = useState<{ position: { x: number; y: number } } | null>(null)
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false)
  
  // Manual Notes state
  const [notesCards, setNotesCards] = useState<Array<{
    id: string
    position: { x: number; y: number }
    size: { width: number; height: number }
    content: string
  }>>([])
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  
  // Patient Groups state
  const [patientGroups, setPatientGroups] = useState<PatientGroup[]>([])
  const [patientGroupColors, setPatientGroupColors] = useState<Map<string, { ringColor: string; bgColor: string; groupName: string }>>(new Map())
  
  // Patient positions state - track current positions of all patients
  const [patientPositions, setPatientPositions] = useState<Map<string, { x: number; y: number }>>(new Map())

  // Layout constants for cards and groups
  const CARD_WIDTH = 288
  const CARD_HEIGHT = 384
  const GROUP_PADDING = 32
  const GROUP_LABEL_HEIGHT = 72

  const groupDragStateRef = useRef<Map<string, { startGroupPosition: { x: number; y: number }; startPatientPositions: Map<string, { x: number; y: number }> }>>(new Map())
  const activeGroupDragsRef = useRef<Set<string>>(new Set())
  
  // Cursor position tracking
  const [lastCursorPosition, setLastCursorPosition] = useState<{ x: number; y: number }>({ x: 400, y: 300 })

  // Debug logging for highlighting
  console.log('🎨 PatientCanvas received:', { 
    highlightedPatients, 
    glowingPatients, 
    totalPatients: patients.length 
  })

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.3))
  }, [])

  const handleReset = useCallback(() => {
    setZoom(0.7) // Reset to more zoomed out view
    setPan({ x: 0, y: 0 })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    // Clear any existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
    }
    
    // Use smaller zoom steps for smoother performance
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05
    const newZoom = Math.max(0.3, Math.min(3, zoom * zoomFactor))
    
    // Get canvas rect once and cache it
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    // Simplified zoom calculation for better performance
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate the point under the mouse in canvas coordinates
    const canvasX = (mouseX - pan.x) / zoom
    const canvasY = (mouseY - pan.y) / zoom
    
    // Calculate new pan to keep the point under the mouse
    const newPanX = mouseX - canvasX * newZoom
    const newPanY = mouseY - canvasY * newZoom
    
    // Update state immediately for responsiveness
    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
    
    // Throttle expensive operations
    zoomTimeoutRef.current = setTimeout(() => {
      // Force a re-render of draggable bounds after zoom settles
      if (canvasRef.current) {
        canvasRef.current.dispatchEvent(new Event('resize'))
      }
    }, 50)
  }, [zoom, pan])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 || e.button === 1 || (e.button === 0 && e.altKey)) { // Right-click, middle mouse, or Alt+left click
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      // Close context menu when starting to pan
      if (contextMenu) {
        setContextMenu(null)
      }
      e.preventDefault()
      e.stopPropagation()
    }
  }, [contextMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only show context menu if not panning
    if (!isPanning) {
      setContextMenu({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning])

  const handleShiftClick = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey && e.button === 0 && !e.altKey) { // Shift + left click (but not alt)
      e.preventDefault()
      e.stopPropagation()
      // Toggle the context menu - if it's open, close it; if closed, open it
      if (contextMenu) {
        setContextMenu(null)
      } else {
        setContextMenu({ x: e.clientX, y: e.clientY })
      }
    }
  }, [contextMenu])

  const handleClearHighlights = useCallback(() => {
    if (onClearHighlights) {
      onClearHighlights()
    }
    setContextMenu(null)
  }, [onClearHighlights])

  const handleAIResponse = useCallback((response: AIResponse, spellPosition: { x: number; y: number }) => {
    console.log('🎯 handleAIResponse called with:', { response, spellPosition, pan, zoom })
    const responseId = `response-${Date.now()}`
    
    // Find an empty space on the canvas for the response card
    const findEmptyPosition = (): { x: number; y: number } => {
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      if (!canvasRect) {
        console.log('⚠️ No canvas rect, using default position')
        return { x: 500, y: 300 } // Default position
      }
      
      console.log('📐 Canvas rect:', canvasRect)
      console.log('📍 Spell position (screen coords):', spellPosition)
      console.log('🔍 Current pan/zoom:', { pan, zoom })
      
      // Convert screen coordinates to canvas coordinates
      // The spell position is in screen coordinates relative to the viewport
      // We need to convert it to canvas coordinates accounting for pan and zoom
      const canvasX = (spellPosition.x - canvasRect.left - pan.x) / zoom
      const canvasY = (spellPosition.y - canvasRect.top - pan.y) / zoom
      
      console.log('🎯 Converted canvas coordinates:', { canvasX, canvasY })
      
      // Look for empty space in a spiral pattern around the spell position
      const spiralPositions = [
        { x: canvasX + 400, y: canvasY },
        { x: canvasX + 300, y: canvasY + 300 },
        { x: canvasX - 300, y: canvasY + 200 },
        { x: canvasX + 500, y: canvasY + 200 },
        { x: canvasX + 200, y: canvasY - 300 },
        { x: canvasX - 200, y: canvasY - 200 },
        { x: canvasX + 600, y: canvasY - 100 },
      ]
      
      console.log('🌀 Spiral positions to check:', spiralPositions)
      
      // Find first position that doesn't overlap with existing cards
      for (const pos of spiralPositions) {
        const overlaps = aiResponseCards.some(card => {
          const cardX = card.position.x
          const cardY = card.position.y
          const distance = Math.sqrt(Math.pow(pos.x - cardX, 2) + Math.pow(pos.y - cardY, 2))
          return distance < 250 // Minimum distance between cards
        })
        
        if (!overlaps) {
          console.log('✅ Found empty position:', pos)
          return pos
        }
      }
      
      // Fallback to a calculated position
      const fallbackPos = { x: canvasX + 400, y: canvasY + 200 }
      console.log('🔄 Using fallback position:', fallbackPos)
      return fallbackPos
    }
    
    const emptyPosition = findEmptyPosition()
    
    // Create the response card immediately without complex panning
    console.log('🃏 Creating AI response card at position:', emptyPosition)
    const newResponseCard: AIResponseCardState = {
      id: responseId,
      response,
      position: emptyPosition
    }
    
    setAiResponseCards(prev => {
      const newCards = [...prev, newResponseCard]
      console.log('📋 Updated AI response cards:', newCards)
      return newCards
    })
    
    // Optional: Simple pan to show the card (without complex animation)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (canvasRect) {
      // Calculate where the card will appear on screen
      const screenX = emptyPosition.x * zoom + pan.x + canvasRect.left
      const screenY = emptyPosition.y * zoom + pan.y + canvasRect.top
      
      // If the card is outside the viewport, pan to show it
      const isOutsideViewport = screenX < 0 || screenY < 0 || 
                               screenX > canvasRect.width || screenY > canvasRect.height
      
      if (isOutsideViewport) {
        console.log('📱 Card is outside viewport, panning to show it')
        // Pan to center the card in the viewport
        const targetPanX = canvasRect.width / 2 - emptyPosition.x * zoom
        const targetPanY = canvasRect.height / 2 - emptyPosition.y * zoom
        
        // Smooth pan animation
        const startPan = { ...pan }
        const startTime = Date.now()
        const duration = 800 // Shorter animation
        
        const animatePan = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Easing function for smooth animation
          const easeOut = 1 - Math.pow(1 - progress, 3)
          
          const newPanX = startPan.x + (targetPanX - startPan.x) * easeOut
          const newPanY = startPan.y + (targetPanY - startPan.y) * easeOut
          
          setPan({ x: newPanX, y: newPanY })
          
          if (progress < 1) {
            requestAnimationFrame(animatePan)
          } else {
            console.log('✅ Pan animation completed')
          }
        }
        
        requestAnimationFrame(animatePan)
      } else {
        console.log('👁️ Card is already visible in viewport')
      }
    }
    
  }, [pan, zoom, aiResponseCards])

  const handleCloseAIResponse = useCallback((responseId: string) => {
    setAiResponseCards(prev => prev.filter(card => card.id !== responseId))
  }, [])

  // Handle prompt card submission
  const handlePromptSubmit = useCallback(async (prompt: string) => {
    console.log('🤖 Processing prompt:', { prompt })
    setIsProcessingPrompt(true)
    
    try {
      // Call the API endpoint to process the prompt
      const response = await fetch('/api/cedar/ai-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          groupingType: 'visual-group', // Default to visual grouping
          context: {
            patients: patients.map(p => ({
              id: p.id,
              name: p.name,
              age: p.age,
              conditions: p.conditions,
              meds: p.meds,
              labs: p.labs,
              priority: p.priority,
              riskScore: p.riskScore,
              position: p.position
            })),
            highlightedPatients,
            totalPatients: patients.length
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process prompt')
      }

      const result = await response.json()
      console.log('🎯 AI Analysis result:', result)
      
      // Handle the response - actually move the cards
      if (result.groupings && result.groupings.length > 0) {
        handleAIGroupingResult(result, 'visual-group')
      }
      
      setPromptCard(null) // Close the prompt card
    } catch (error) {
      console.error('❌ Error processing prompt:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsProcessingPrompt(false)
    }
  }, [patients, highlightedPatients])

  // Handle AI grouping results - actually move patient cards
  const handleAIGroupingResult = useCallback((result: any, groupingType: string) => {
    console.log('🎨 Applying AI grouping result:', { result, groupingType })
    
    if (result.groupings && result.groupings.length > 0) {
      const newPositions = new Map<string, { x: number; y: number }>()
      const newGroups: PatientGroup[] = []
      const newPatientColors = new Map<string, { ringColor: string; bgColor: string; groupName: string }>()
      
      // Define distinct colors for groups
      const groupColors = [
        { 
          ring: 'ring-blue-500', 
          bg: 'bg-blue-50', 
          text: 'text-blue-700',
          border: 'border-blue-300',
          shadow: 'shadow-blue-200/30'
        },
        { 
          ring: 'ring-green-500', 
          bg: 'bg-green-50', 
          text: 'text-green-700',
          border: 'border-green-300',
          shadow: 'shadow-green-200/30'
        },
        { 
          ring: 'ring-purple-500', 
          bg: 'bg-purple-50', 
          text: 'text-purple-700',
          border: 'border-purple-300',
          shadow: 'shadow-purple-200/30'
        },
        { 
          ring: 'ring-orange-500', 
          bg: 'bg-orange-50', 
          text: 'text-orange-700',
          border: 'border-orange-300',
          shadow: 'shadow-orange-200/30'
        },
        { 
          ring: 'ring-pink-500', 
          bg: 'bg-pink-50', 
          text: 'text-pink-700',
          border: 'border-pink-300',
          shadow: 'shadow-pink-200/30'
        },
        { 
          ring: 'ring-cyan-500', 
          bg: 'bg-cyan-50', 
          text: 'text-cyan-700',
          border: 'border-cyan-300',
          shadow: 'shadow-cyan-200/30'
        }
      ]
      
      // Calculate new positions for each group with visible spacing at 30% zoom
      result.groupings.forEach((group: any, groupIndex: number) => {
        const groupsPerRow = Math.ceil(Math.sqrt(result.groupings.length))
        const baseX = (groupIndex % groupsPerRow) * 2500 + 2000 // Move 2000px to the right + original spacing (visible at 30% zoom)
        const baseY = Math.floor(groupIndex / groupsPerRow) * 2000 + 2000 // Move 2000px down + original spacing
        
        console.log(`🏗️ Group ${groupIndex} "${group.name}" base position:`, { baseX, baseY })
        
        // Get color for this group
        const groupColor = groupColors[groupIndex % groupColors.length]
        
        // Create group object
        const newGroup: PatientGroup = {
          id: `group-${Date.now()}-${groupIndex}`,
          name: group.name,
          description: group.description,
          patientIds: group.patientIds || [],
          criteria: group.criteria,
          priority: group.priority || 'medium',
          visualHint: group.visualHint || '',
          color: groupColor.bg,
          ringColor: groupColor.ring,
          bgColor: groupColor.bg,
          textColor: groupColor.text,
          position: { x: baseX, y: baseY - 80 } // Position label above the group
        }
        newGroups.push(newGroup)
        
        // Arrange patients within each group
        const patientsPerRow = Math.ceil(Math.sqrt(group.patientIds.length))
        
        group.patientIds.forEach((patientId: string, patientIndex: number) => {
          const offsetX = (patientIndex % patientsPerRow) * 320 // Card width + spacing
          const offsetY = Math.floor(patientIndex / patientsPerRow) * 420 // Card height + spacing
          
          const finalPosition = {
            x: baseX + offsetX,
            y: baseY + offsetY
          }
          
          // Assign color to this patient
          newPatientColors.set(patientId, {
            ringColor: groupColor.ring,
            bgColor: groupColor.bg,
            groupName: group.name
          })
          
          console.log(`🎯 Setting position for patient ${patientId} in group "${group.name}":`, finalPosition)
          newPositions.set(patientId, finalPosition)
        })
      })
      
      // Update all states and force re-render
      setPatientPositions(newPositions)
      setPatientGroups(newGroups)
      setPatientGroupColors(newPatientColors)
      
      console.log('📍 Updated patient positions:', Array.from(newPositions.entries()))
      console.log('🎨 Updated patient colors:', Array.from(newPatientColors.entries()))
      console.log('🏷️ Created groups:', newGroups)
      
      // Auto-zoom out to show all groups after a short delay
      setTimeout(() => {
        autoZoomToFitGroups(newPositions)
      }, 500) // Delay to let positions update first
    }
    
    // Show AI analysis as a response card
    if (result.analysis) {
      const aiResponse: AIResponse = {
        alternatives: [],
        analysis: result.analysis,
        recommendations: result.recommendations || [],
        type: 'patient-analysis'
      }
      
      // Position the response card in the center of the canvas
      const canvasRect = canvasRef.current?.getBoundingClientRect()
      const centerPosition = canvasRect ? {
        x: (canvasRect.width / 2 - pan.x) / zoom,
        y: (canvasRect.height / 2 - pan.y) / zoom
      } : { x: 500, y: 300 }
      
      handleAIResponse(aiResponse, centerPosition)
    }
  }, [pan, zoom, handleAIResponse])

  // Auto-zoom to fit all groups
  const autoZoomToFitGroups = useCallback((positions: Map<string, { x: number; y: number }>) => {
    if (positions.size === 0) return
    
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (!canvasRect) return
    
    // Calculate bounding box of all patient positions
    const positionsArray = Array.from(positions.values())
    const minX = Math.min(...positionsArray.map(p => p.x)) - 50 // Add padding
    const maxX = Math.max(...positionsArray.map(p => p.x)) + 350 // Add card width + padding
    const minY = Math.min(...positionsArray.map(p => p.y)) - 50 // Add padding
    const maxY = Math.max(...positionsArray.map(p => p.y)) + 450 // Add card height + padding
    
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    // Set zoom to exactly 30% to clearly see all groups
    const targetZoom = 0.3
    
    // Calculate pan to center the content
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const targetPanX = canvasRect.width / 2 - centerX * targetZoom
    const targetPanY = canvasRect.height / 2 - centerY * targetZoom
    
    console.log('🔍 Auto-zooming to fit groups:', { 
      targetZoom, 
      targetPanX, 
      targetPanY, 
      contentBounds: { minX, maxX, minY, maxY }
    })
    
    // Animate to the new zoom and pan
    const startZoom = zoom
    const startPan = { ...pan }
    const startTime = Date.now()
    const duration = 1000
    
    const animateZoom = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      const newZoom = startZoom + (targetZoom - startZoom) * easeOut
      const newPanX = startPan.x + (targetPanX - startPan.x) * easeOut
      const newPanY = startPan.y + (targetPanY - startPan.y) * easeOut
      
      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
      
      if (progress < 1) {
        requestAnimationFrame(animateZoom)
      } else {
        console.log('✅ Auto-zoom animation completed')
      }
    }
    
    requestAnimationFrame(animateZoom)
  }, [zoom, pan])

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    // Close menu when clicking on canvas (but not on menu itself)
    if (e.target === e.currentTarget && contextMenu) {
      setContextMenu(null)
    }
  }, [contextMenu])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Track cursor position for spawn location
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (canvasRect) {
      const canvasX = (e.clientX - canvasRect.left - pan.x) / zoom
      const canvasY = (e.clientY - canvasRect.top - pan.y) / zoom
      setLastCursorPosition({ x: canvasX, y: canvasY })
    }
    
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning, lastPanPoint, pan, zoom])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle pinch gestures, don't interfere with single touch scrolling
    if (e.touches.length === 2) {
      e.preventDefault() // Prevent default only for pinch gestures
      
      // Store initial touch points for pinch gesture
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Store initial state for pinch calculation
      ;(e.target as any).__initialDistance = distance
      ;(e.target as any).__initialZoom = zoom
      ;(e.target as any).__initialPan = { ...pan }
      ;(e.target as any).__centerX = (touch1.clientX + touch2.clientX) / 2
      ;(e.target as any).__centerY = (touch1.clientY + touch2.clientY) / 2
    }
  }, [zoom, pan])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Only prevent default for pinch gestures
    if (e.touches.length === 2) {
      e.preventDefault()
      
      // Pinch to zoom with optimized calculations
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // Use more efficient distance calculation
      const dx = touch2.clientX - touch1.clientX
      const dy = touch2.clientY - touch1.clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const initialDistance = (e.target as any).__initialDistance
      const initialZoom = (e.target as any).__initialZoom
      const initialPan = (e.target as any).__initialPan
      const centerX = (e.target as any).__centerX
      const centerY = (e.target as any).__centerY
      
      if (initialDistance && initialZoom) {
        const scale = distance / initialDistance
        const newZoom = Math.max(0.3, Math.min(3, initialZoom * scale))
        
        // Optimized pan calculation
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          // Simplified center calculation
          const canvasCenterX = (centerX - rect.left - initialPan.x) / initialZoom
          const canvasCenterY = (centerY - rect.top - initialPan.y) / initialZoom
          
          const newPanX = centerX - rect.left - canvasCenterX * newZoom
          const newPanY = centerY - rect.top - canvasCenterY * newZoom
          
          setZoom(newZoom)
          setPan({ x: newPanX, y: newPanY })
        }
      }
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Clean up touch state when pinch gesture ends
    if (e.touches.length < 2) {
      if ((e.target as any).__initialDistance) {
        delete (e.target as any).__initialDistance
        delete (e.target as any).__initialZoom
        delete (e.target as any).__initialPan
        delete (e.target as any).__centerX
        delete (e.target as any).__centerY
      }
    }
  }, [])

  // Handle global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + C to open prompt card
      if (e.shiftKey && e.key.toLowerCase() === 'c' && !promptCard) {
        e.preventDefault()
        console.log('🎯 Opening Vital.AI prompt card via Shift+C')
        
        // Position the prompt card at the last cursor position (updated for larger card)
        const spawnPosition = {
          x: lastCursorPosition.x - 240, // Offset to center the larger card on cursor
          y: lastCursorPosition.y - 150
        }
        
        setPromptCard({ position: spawnPosition })
      }
      
      // Shift + N to create manual note
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        console.log('📝 Creating manual note card via Shift+N')
        
        const newNote = {
          id: `note-${Date.now()}`,
          position: {
            x: lastCursorPosition.x - 150, // Center the note card
            y: lastCursorPosition.y - 100
          },
          size: { width: 300, height: 200 },
          content: ''
        }
        
        setNotesCards(prev => [...prev, newNote])
        setEditingNoteId(newNote.id) // Start editing immediately
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [promptCard, lastCursorPosition])

  const getInitialPosition = useCallback((index: number) => {
    const cols = Math.max(1, Math.ceil(Math.sqrt(patients.length)))
    const x = (index % cols) * 300 + 50
    const y = Math.floor(index / cols) * 400 + 50
    return { x, y }
  }, [patients.length])

  useEffect(() => {
    setPatientPositions(prev => {
      let changed = false
      const next = new Map(prev)

      patients.forEach((patient, index) => {
        if (!next.has(patient.id)) {
          next.set(patient.id, patient.position || getInitialPosition(index))
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [patients, getInitialPosition])

  const getPatientPosition = useCallback((patientId: string, index?: number) => {
    const tracked = patientPositions.get(patientId)
    if (tracked) return tracked

    const patientIndex = index ?? patients.findIndex(p => p.id === patientId)
    const fallbackPatient = patients[patientIndex]
    if (fallbackPatient?.position) {
      return fallbackPatient.position
    }

    const initialIndex = patientIndex !== -1 && patientIndex !== undefined ? patientIndex : 0
    return getInitialPosition(initialIndex)
  }, [patientPositions, patients, getInitialPosition])

  const groupedPatientsSet = useMemo(() => {
    const set = new Set<string>()
    patientGroups.forEach(group => {
      group.patientIds.forEach(id => set.add(id))
    })
    return set
  }, [patientGroups])

  const computeGroupBoundingBox = useCallback((patientIds: string[]) => {
    const positions = patientIds
      .map((id, idx) => getPatientPosition(id, idx))
      .filter((pos): pos is { x: number; y: number } => pos !== undefined && pos !== null)

    if (positions.length === 0) {
      return {
        minX: 0,
        minY: 0,
        width: CARD_WIDTH + GROUP_PADDING * 2,
        height: CARD_HEIGHT + GROUP_PADDING * 2,
      }
    }

    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x + CARD_WIDTH))
    const minY = Math.min(...positions.map(p => p.y))
    const maxY = Math.max(...positions.map(p => p.y + CARD_HEIGHT))

    const width = maxX - minX + GROUP_PADDING * 2
    const height = maxY - minY + GROUP_PADDING * 2

    return { minX, minY, width, height }
  }, [getPatientPosition])

  // Handle group dragging - move all cards in a group together
  const handleGroupDragStart = useCallback((group: PatientGroup) => {
    const patientPositionsAtStart = new Map<string, { x: number; y: number }>()
    group.patientIds.forEach(patientId => {
      const current = patientPositions.get(patientId)
      if (current) {
        patientPositionsAtStart.set(patientId, { ...current })
      } else {
        const index = patients.findIndex(p => p.id === patientId)
        patientPositionsAtStart.set(patientId, getPatientPosition(patientId, index))
      }
    })

    groupDragStateRef.current.set(group.id, {
      startGroupPosition: { ...group.position },
      startPatientPositions: patientPositionsAtStart,
    })
    activeGroupDragsRef.current.add(group.id)
  }, [patientPositions, patients, getPatientPosition])

  const handleGroupDrag = useCallback((group: PatientGroup, deltaX: number, deltaY: number) => {
    const dragState = groupDragStateRef.current.get(group.id)
    if (!dragState) return

    setPatientPositions(prev => {
      const next = new Map(prev)

      group.patientIds.forEach(patientId => {
        const startPosition = dragState.startPatientPositions.get(patientId)
        if (startPosition) {
          next.set(patientId, {
            x: startPosition.x + deltaX,
            y: startPosition.y + deltaY,
          })
        }
      })

      return next
    })
  }, [])

  const handleGroupDragEnd = useCallback((groupId: string, newPosition: { x: number; y: number }) => {
    const dragState = groupDragStateRef.current.get(groupId)
    const group = patientGroups.find(g => g.id === groupId)
    if (!dragState || !group) return

    const deltaX = newPosition.x - dragState.startGroupPosition.x
    const deltaY = newPosition.y - dragState.startGroupPosition.y

    setPatientPositions(prev => {
      const next = new Map(prev)

      group.patientIds.forEach(patientId => {
        const startPosition = dragState.startPatientPositions.get(patientId)
        if (startPosition) {
          next.set(patientId, {
            x: startPosition.x + deltaX,
            y: startPosition.y + deltaY,
          })
        }
      })

      return next
    })

    setPatientGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, position: newPosition }
        : g
    ))

    groupDragStateRef.current.delete(groupId)
    activeGroupDragsRef.current.delete(groupId)
  }, [patientGroups])

  const renderPatientCard = useCallback((patient: PatientWithMeta, options?: { isGrouped?: boolean; groupColor?: { ringColor: string; bgColor: string; groupName: string }; showHoverEffect?: boolean }) => {
    const { isGrouped = false, groupColor, showHoverEffect = true } = options || {}

    const priorityConfig = getPriorityConfig(patient.priority)
    const PriorityIcon = priorityConfig.icon

    return (
      <div
        className={`bg-white border-2 rounded-xl shadow-lg transition-all duration-300 w-72 h-96 ${showHoverEffect ? 'hover:shadow-xl hover:scale-105' : ''} ${groupColor ? `ring-4 ${groupColor.ringColor} shadow-2xl border-current` : highlightedPatients.includes(patient.id)
          ? `ring-4 ring-red-500 shadow-2xl shadow-red-500/30 border-red-500`
          : glowingPatients.includes(patient.id)
          ? `ring-4 ring-red-500 shadow-2xl shadow-red-500/50 animate-pulse border-red-500`
          : "border-gray-200"}`}
        style={{
          position: 'relative',
          zIndex: isGrouped ? 20 : 10,
          pointerEvents: 'auto',
          cursor: 'move'
        }}
      >
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {patient.name}
              </CardTitle>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-800">{patient.age}</div>
              {highlightedPatients.includes(patient.id) && (
                <div className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                  🎯 MATCH
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last seen:</span> {patient.lastVisit}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Next Appointment:</span> 10/1/2025
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Conditions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.conditions.map((condition, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    condition.toLowerCase().includes('diabetes')
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : condition.toLowerCase().includes('hypertension')
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">Medications</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient.meds.map((med, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                >
                  {med}
                </span>
              ))}
            </div>
          </div>

          {patient.labs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TestTube className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Labs</span>
              </div>
              <div className="space-y-2">
                {patient.labs.slice(0, 2).map((lab, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">{lab.name}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{lab.value}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          lab.status === "high" || lab.status === "elevated"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : lab.status === "normal" ||
                                lab.status === "controlled" ||
                                lab.status === "therapeutic" ||
                                lab.status === "good" ||
                                lab.status === "stable"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : lab.status === "low"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}
                      >
                        {lab.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    )
  }, [highlightedPatients, glowingPatients, patientGroupColors])

  const renderGroupedPatient = useCallback((patient: PatientWithMeta) => {
    const group = patientGroups.find(g => g.patientIds.includes(patient.id))
    const groupColor = group ? patientGroupColors.get(patient.id) : undefined

    return (
      <div className="relative" style={{ cursor: 'move', zIndex: 1003 }}>
        {renderPatientCard(patient, { isGrouped: true, groupColor })}
      </div>
    )
  }, [patientGroups, patientGroupColors, renderPatientCard])

  const getContentBounds = useCallback(() => {
    const positionsArray = Array.from(patientPositions.values())
    if (positionsArray.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: CARD_WIDTH,
        maxY: CARD_HEIGHT,
      }
    }

    const minX = Math.min(...positionsArray.map(p => p.x))
    const maxX = Math.max(...positionsArray.map(p => p.x + CARD_WIDTH))
    const minY = Math.min(...positionsArray.map(p => p.y))
    const maxY = Math.max(...positionsArray.map(p => p.y + CARD_HEIGHT))

    return { minX, minY, maxX, maxY }
  }, [patientPositions])

  const getDraggableBounds = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const rect = canvas.getBoundingClientRect()
    const contentBounds = getContentBounds()

    return {
      left: -contentBounds.maxX,
      top: -contentBounds.maxY,
      right: rect.width / zoom,
      bottom: rect.height / zoom,
    }
  }, [getContentBounds, zoom])

  const renderUngroupedPatient = useCallback((patient: PatientWithMeta, index: number) => {
    const position = getPatientPosition(patient.id, index)

    return (
      <Draggable
        key={`patient-${patient.id}`}
        position={position}
        bounds={getDraggableBounds()}
        cancel=".no-drag"
        scale={zoom}
        onDrag={(e, data) => {
          setPatientPositions(prev => {
            const next = new Map(prev)
            next.set(patient.id, { x: data.x, y: data.y })
            return next
          })
        }}
        onStop={(e, data) => {
          setPatientPositions(prev => {
            const next = new Map(prev)
            next.set(patient.id, { x: data.x, y: data.y })
            return next
          })
        }}
      >
        <div className="absolute" style={{ zIndex: 10, cursor: 'move' }}>
          {renderPatientCard(patient, { isGrouped: false })}
        </div>
      </Draggable>
    )
  }, [getPatientPosition, getDraggableBounds, zoom, renderPatientCard])

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Canvas Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Vital.ai Patient Dashboard</h3>
          <Badge variant="outline" className="text-xs">
            {patients.length} patients
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
            className="h-8 w-8 p-0"
          >
            <Grid className="h-4 w-4" />
          </Button>
          {/* Research Stream Toggle Button */}
          {isResearchStreamCollapsed && onToggleResearchStream && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleResearchStream}
              className="h-8 w-8 p-0"
              title="Show Research Stream"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-background to-muted/20"
        onWheel={handleWheel}
        onMouseDown={(e) => {
          handleMouseDown(e)
          handleShiftClick(e)
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
        onClick={handleClickOutside}
        style={{
          cursor: isPanning ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {/* Enhanced Grid Background */}
        {showGrid && (
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(156, 163, 175, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(156, 163, 175, 0.4) 1px, transparent 1px),
                linear-gradient(to right, rgba(156, 163, 175, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(156, 163, 175, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: `${Math.max(80 * zoom, 40)}px ${Math.max(80 * zoom, 40)}px, ${Math.max(400 * zoom, 200)}px ${Math.max(400 * zoom, 200)}px`,
              transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
          />
        )}

        {/* Cedar Radial Spell */}
        <CedarRadialSpell
          context={{
            highlightedPatients,
            patients,
            researchUpdate
          }}
          onAIResponse={handleAIResponse}
          onClearHighlights={handleClearHighlights}
        />

        {/* Canvas Content */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {error && (
            <div className="absolute top-4 left-4 right-4">
              <Alert variant="destructive">
                <AlertTitle>Unable to load patients</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-3 p-6 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading patients...</span>
              </div>
            </div>
          )}

          {!loading && !error && patients.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Alert className="max-w-md">
                <AlertTitle>No patients found</AlertTitle>
                <AlertDescription>
                  Your Supabase table is empty. Add records to `patients` or seed the database to populate this view.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {!loading && !error && (
            <>
              {patientGroups.map(group => {
                const boundingBox = computeGroupBoundingBox(group.patientIds)

            return (
              <Draggable
                    key={`group-${group.id}`}
                    handle={`#group-handle-${group.id}`}
                    position={group.position}
                bounds={getDraggableBounds()}
                    scale={zoom}
                    onStart={() => handleGroupDragStart(group)}
                onDrag={(e, data) => {
                      const state = groupDragStateRef.current.get(group.id)
                      if (!state) return

                      const deltaX = data.x - state.startGroupPosition.x
                      const deltaY = data.y - state.startGroupPosition.y
                      handleGroupDrag(group, deltaX, deltaY)
                }}
                onStop={(e, data) => {
                      handleGroupDragEnd(group.id, { x: data.x, y: data.y })
                    }}
                  >
                    <div className="absolute" style={{ pointerEvents: 'none', zIndex: 1000 }}>
                      <div
                    style={{ 
                          position: 'absolute',
                          left: boundingBox.minX - group.position.x - GROUP_PADDING,
                          top: boundingBox.minY - group.position.y - GROUP_PADDING,
                          width: boundingBox.width,
                          height: boundingBox.height,
                          background: 'rgba(59, 130, 246, 0.15)',
                          border: '2px solid rgba(59, 130, 246, 0.6)',
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          zIndex: 999,
                        }}
                      />

                      <div
                        id={`group-handle-${group.id}`}
                        className={`absolute left-0 -top-${GROUP_LABEL_HEIGHT / 2} rounded-lg border-2 px-4 py-3 shadow-2xl cursor-move ${group.bgColor} ${group.textColor} border-current backdrop-blur-sm hover:shadow-2xl transition-shadow duration-200`}
                        style={{ minWidth: '200px', pointerEvents: 'auto', zIndex: 1001 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full ${group.ringColor.replace('ring-', 'bg-')} animate-pulse`}></div>
                          <h3 className="font-semibold text-sm">{group.name}</h3>
                          <Badge variant="outline" className="text-xs ml-auto bg-yellow-100 text-yellow-800 border-yellow-300">
                            ✨ {group.patientIds.length} patients
                          </Badge>
                          </div>
                        <p className="text-xs opacity-80 mb-1">{group.description}</p>
                        <p className="text-xs opacity-60 italic">🔗 Drag to move entire group • 🤖 AI Generated</p>
                        </div>

                      {group.patientIds.map(patientId => {
                        const patient = patients.find(p => p.id === patientId)
                        if (!patient) return null

                        const position = getPatientPosition(patientId)
                        const offsetX = (position.x - boundingBox.minX) + GROUP_PADDING
                        const offsetY = (position.y - boundingBox.minY) + GROUP_PADDING

                        return (
                          <div
                            key={`grouped-patient-${patientId}`}
                            style={{
                              position: 'absolute',
                              left: offsetX,
                              top: offsetY,
                              pointerEvents: 'auto',
                              zIndex: 1002
                            }}
                          >
                            {renderGroupedPatient(patient)}
                        </div>
                        )
                      })}
                </div>
              </Draggable>
            )
          })}

              {patients
                .filter(patient => !groupedPatientsSet.has(patient.id))
                .map((patient, index) => renderUngroupedPatient(patient, index))}
            </>
          )}
        </div>



        {/* AI Response Cards - Positioned within the transformed canvas */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {aiResponseCards.map((responseCard) => (
            <AIResponseCard
              key={responseCard.id}
              response={responseCard.response}
              position={responseCard.position}
              onClose={() => handleCloseAIResponse(responseCard.id)}
            />
          ))}
        </div>


        {/* Canvas Instructions - Collapsible */}
        {isControlsMinimized ? (
          <Button
            onClick={() => setIsControlsMinimized(false)}
            className="absolute bottom-4 left-4 h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
            title="Show Canvas Controls"
          >
            <Move className="h-4 w-4" />
          </Button>
        ) : (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-3 text-xs text-gray-600 shadow-lg max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Move className="h-3 w-3" />
                <span className="font-medium text-gray-800">Canvas Controls</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsControlsMinimized(true)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              <div>• Click and drag any part of a card to move it</div>
              <div>• Mouse wheel or trackpad scroll to zoom</div>
              <div>• Pinch with two fingers to zoom on trackpad</div>
              <div>• <strong>Right-click and drag</strong> to pan the canvas</div>
              <div>• <strong>Shift+click</strong> to open radial spell menu</div>
              <div>• <strong>Shift+C</strong> to open Vital.AI prompt for card grouping</div>
              <div>• <strong>Shift+N</strong> to create manual note card</div>
              <div>• <strong>Radial menu</strong> shows context-aware AI actions</div>
              <div>• Alt+click and drag also works for panning</div>
            </div>
          </div>
        )}

        {/* Manual Notes Cards - Positioned within the transformed canvas */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {notesCards.map((noteCard) => (
            <Draggable
              key={noteCard.id}
              position={noteCard.position}
              bounds={getDraggableBounds()}
              scale={zoom}
              onStop={(e, data) => {
                setNotesCards(prev => prev.map(note =>
                  note.id === noteCard.id
                    ? { ...note, position: { x: data.x, y: data.y } }
                    : note
                ))
              }}
            >
              <div className="absolute" style={{ zIndex: 500 }}>
                <div
                  className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-lg resize overflow-hidden"
                  style={{
                    width: noteCard.size.width,
                    height: noteCard.size.height,
                    minWidth: '200px',
                    minHeight: '150px',
                    maxWidth: '600px',
                    maxHeight: '400px'
                  }}
                >
                  <div className="bg-yellow-200 px-3 py-2 border-b border-yellow-300 flex items-center justify-between cursor-move">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-800">📝 Manual Note</span>
                    </div>
                    <button
                      onClick={() => {
                        setNotesCards(prev => prev.filter(note => note.id !== noteCard.id))
                        setEditingNoteId(null)
                      }}
                      className="text-yellow-600 hover:text-yellow-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-3 h-full">
                    {editingNoteId === noteCard.id ? (
                      <textarea
                        value={noteCard.content}
                        onChange={(e) => {
                          setNotesCards(prev => prev.map(note =>
                            note.id === noteCard.id
                              ? { ...note, content: e.target.value }
                              : note
                          ))
                        }}
                        onBlur={() => setEditingNoteId(null)}
                        autoFocus
                        placeholder="Type your note here..."
                        className="w-full h-full resize-none border-none outline-none bg-transparent text-sm text-gray-700 placeholder-gray-400"
                        style={{ height: 'calc(100% - 2rem)' }}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingNoteId(noteCard.id)}
                        className="w-full h-full cursor-text text-sm text-gray-700 whitespace-pre-wrap"
                        style={{ height: 'calc(100% - 2rem)' }}
                      >
                        {noteCard.content || 'Click to add note...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Draggable>
          ))}
        </div>

        {/* Vital.ai Prompt Card - Positioned within the transformed canvas */}
        {promptCard && (
          <div 
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <CedarPromptCard
              position={promptCard.position}
              onClose={() => setPromptCard(null)}
              onSubmit={handlePromptSubmit}
              isProcessing={isProcessingPrompt}
            />
          </div>
        )}
      </div>
    </div>
  )
}
