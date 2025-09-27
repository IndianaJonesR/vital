"use client"

import React, { useState, useRef, useCallback } from "react"
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
} from "lucide-react"
import Draggable from "react-draggable"

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

type PatientCanvasProps = {
  patients: PatientWithMeta[]
  highlightedPatients: string[]
  glowingPatients: string[]
  error: string | null
  loading: boolean
  onClearHighlights?: () => void
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

export function PatientCanvas({ patients, highlightedPatients, glowingPatients, error, loading, onClearHighlights }: PatientCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

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
    setZoom(1)
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

  const handleClickOutside = useCallback((e: React.MouseEvent) => {
    // Close menu when clicking on canvas (but not on menu itself)
    if (e.target === e.currentTarget && contextMenu) {
      setContextMenu(null)
    }
  }, [contextMenu])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning, lastPanPoint])

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

  const getInitialPosition = (index: number) => {
    // Arrange patients in a grid initially
    const cols = Math.ceil(Math.sqrt(patients.length))
    const x = (index % cols) * 300 + 50
    const y = Math.floor(index / cols) * 400 + 50
    return { x, y }
  }

  const getDraggableBounds = useCallback(() => {
    if (!canvasRef.current) return "parent"
    
    const rect = canvasRef.current.getBoundingClientRect()
    // Pre-calculate common values for efficiency
    const panXOverZoom = pan.x / zoom
    const panYOverZoom = pan.y / zoom
    const widthOverZoom = rect.width / zoom
    const heightOverZoom = rect.height / zoom
    
    // Calculate bounds that account for zoom and pan
    const bounds = {
      left: -panXOverZoom,
      top: -panYOverZoom,
      right: widthOverZoom - panXOverZoom - 288, // 288 is new card width (w-72)
      bottom: heightOverZoom - panYOverZoom - 384, // 384 is new card height (h-96)
    }
    
    return bounds
  }, [zoom, pan])

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Canvas Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Patient Canvas</h3>
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

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100 flex items-center justify-between">
              <span>Canvas Actions</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Toggle Mode</span>
            </div>
            <button
              onClick={handleClearHighlights}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
              Clear All Highlights
            </button>
            <button
              onClick={() => setContextMenu(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              More Options (Coming Soon)
            </button>
            <div className="px-3 py-1 text-xs text-gray-500 border-t border-gray-100">
              Click outside or start panning to close
            </div>
          </div>
        )}

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

          {!loading && !error && patients.map((patient, index) => {
            const priorityConfig = getPriorityConfig(patient.priority)
            const PriorityIcon = priorityConfig.icon
            const position = patient.position || getInitialPosition(index)

            return (
              <Draggable
                key={patient.id}
                defaultPosition={position}
                bounds={getDraggableBounds()}
                cancel=".no-drag"
              >
                <div className="absolute">
                  <Card
                    className={`bg-white border-2 border-gray-200 rounded-xl shadow-lg transition-all duration-300 w-72 h-96 cursor-move ${
                      highlightedPatients.includes(patient.id)
                        ? `ring-4 ring-red-500 shadow-2xl shadow-red-500/30 border-red-500`
                        : glowingPatients.includes(patient.id)
                        ? `ring-4 ring-red-500 shadow-2xl shadow-red-500/50 animate-pulse border-red-500`
                        : "hover:shadow-xl hover:scale-105"
                    } overflow-hidden group`}
                  >
                    {/* Header with name and age */}
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
                      {/* Last seen and Next appointment */}
                      <div className="space-y-1">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Last seen:</span> {patient.lastVisit}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Next Appointment:</span> 10/1/2025
                        </div>
                      </div>

                      {/* Conditions */}
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

                      {/* Medications */}
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

                      {/* Labs */}
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
                  </Card>
                </div>
              </Draggable>
            )
          })}
        </div>

        {/* Canvas Instructions */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-3 text-xs text-gray-600 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <Move className="h-3 w-3" />
            <span className="font-medium text-gray-800">Canvas Controls</span>
          </div>
          <div>• Click and drag any part of a card to move it</div>
          <div>• Mouse wheel or trackpad scroll to zoom</div>
          <div>• Pinch with two fingers to zoom on trackpad</div>
          <div>• <strong>Right-click and drag</strong> to pan the canvas</div>
          <div>• <strong>Shift+click</strong> to open/close context menu</div>
          <div>• Alt+click and drag also works for panning</div>
        </div>
      </div>
    </div>
  )
}
