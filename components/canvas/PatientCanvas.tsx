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

export function PatientCanvas({ patients, highlightedPatients, glowingPatients, error, loading }: PatientCanvasProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)

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

  const handlePan = useCallback((e: React.MouseEvent) => {
    if (e.buttons === 2) { // Right mouse button
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        setPan(prev => ({
          x: prev.x + e.movementX / zoom,
          y: prev.y + e.movementY / zoom
        }))
      }
    }
  }, [zoom])

  const getInitialPosition = (index: number) => {
    // Arrange patients in a grid initially
    const cols = Math.ceil(Math.sqrt(patients.length))
    const x = (index % cols) * 280 + 50
    const y = Math.floor(index / cols) * 320 + 50
    return { x, y }
  }

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
        onMouseMove={handlePan}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          cursor: 'grab'
        }}
      >
        {/* Grid Background */}
        {showGrid && (
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
              transform: `translate(${pan.x}px, ${pan.y}px)`
            }}
          />
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
                bounds="parent"
                handle=".drag-handle"
              >
                <div className="absolute">
                  <Card
                    className={`surface-card transition-all duration-200 ${priorityConfig.glow} w-64 h-80 cursor-move ${
                      highlightedPatients.includes(patient.id)
                        ? `ring-2 ring-primary shadow-lg shadow-primary/10`
                        : glowingPatients.includes(patient.id)
                        ? `ring-2 ring-primary shadow-lg shadow-primary/20 animate-pulse`
                        : "hover:shadow-lg"
                    } overflow-hidden group`}
                  >
                    <CardHeader className="pb-2 drag-handle cursor-move relative z-10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{patient.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-muted/30 border-border/50">
                            {patient.age}
                          </Badge>
                          <Badge className={`text-xs ${priorityConfig.color} flex items-center gap-1 font-medium`}>
                            <PriorityIcon className="h-3 w-3" />
                            {patient.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{patient.lastVisit}</span>
                        <Badge className={`text-xs font-medium ${getRiskScoreColor(patient.riskScore)} shadow-sm`}>
                          <Pulse className="h-3 w-3 mr-1" /> {patient.riskScore}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 p-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Conditions
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {patient.conditions.slice(0, 2).map((condition, idx) => (
                            <Badge
                              key={idx}
                              className={`${getConditionColor(condition)} font-medium text-xs`}
                              variant="secondary"
                            >
                              {condition}
                            </Badge>
                          ))}
                          {patient.conditions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{patient.conditions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {patient.labs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <TestTube className="h-3 w-3" />
                            Labs
                          </p>
                          <div className="space-y-1">
                            {patient.labs.slice(0, 2).map((lab, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs surface-subtle p-2 rounded">
                                <span className="font-medium truncate">{lab.name}:</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold">{lab.value}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs font-medium shadow-sm ${
                                      lab.status === "high" || lab.status === "elevated"
                                        ? "text-red-600 border-red-200 bg-red-50"
                                        : lab.status === "normal" ||
                                            lab.status === "controlled" ||
                                            lab.status === "therapeutic" ||
                                            lab.status === "good" ||
                                            lab.status === "stable"
                                          ? "text-green-600 border-green-200 bg-green-50"
                                          : lab.status === "low"
                                            ? "text-blue-600 border-blue-200 bg-blue-50"
                                            : "text-yellow-600 border-yellow-200 bg-yellow-50"
                                    }`}
                                  >
                                    {lab.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-border/30">
                        <Button
                          size="sm"
                          className="flex-1 bg-primary hover:bg-primary/90 shadow-none font-medium text-xs"
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          AI Insights
                        </Button>
                        <Button size="sm" variant="outline" className="hover:bg-muted/30 border-border/50 text-xs">
                          <Calendar className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Draggable>
            )
          })}
        </div>

        {/* Canvas Instructions */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Move className="h-3 w-3" />
            <span className="font-medium">Canvas Controls</span>
          </div>
          <div>• Drag cards to move them around</div>
          <div>• Right-click + drag to pan the canvas</div>
          <div>• Use zoom controls to scale view</div>
        </div>
      </div>
    </div>
  )
}
