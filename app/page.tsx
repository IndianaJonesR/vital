"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  TestTube,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Target,
  Stethoscope,
  Loader2,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { PatientCanvas } from "@/components/canvas/PatientCanvas"
import { CedarAgentContext } from "@/components/cedar-agent-context"
import { VitalAiBadge } from "@/components/vital-ai-badge"
import { useRegisterState, useCedarStore } from "cedar-os"
import { z } from "zod"

type PatientLab = {
  name: string
  value: number | string
  status: string
}

type PatientRecord = {
  id: string
  name: string
  age: number | null
  conditions: string[] | null
  meds: string[] | null
  labs: unknown
  created_at: string | null
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
}

type UpdateRecord = {
  id: string
  source: string
  title: string
  summary: string
  rule_condition: string | null
  rule_criterion: string | null
  rule_action: string | null
  created_at: string | null
}

type UpdateUrgency = "critical" | "high" | "medium" | "low"

type UpdateWithMeta = UpdateRecord & {
  category: string
  urgency: UpdateUrgency
  timestamp: string
  readTime: string
  impactedPatients: string[]
}


const safeStringArray = (value: string[] | null | undefined): string[] => {
  if (!value) return []
  return value.filter((item) => typeof item === "string")
}

const toNumericValue = (value: number | string): number => {
  if (typeof value === "number") return value
  const numeric = Number(String(value).replace(/[^0-9.\-]/g, ""))
  return Number.isFinite(numeric) ? numeric : NaN
}

const computeLabStatus = (name: string, value: number | string): string => {
  const normalized = name.toLowerCase()
  const numericValue = toNumericValue(value)

  if (normalized.includes("hba1c")) {
    if (!Number.isFinite(numericValue)) return "unknown"
    if (numericValue >= 9) return "high"
    if (numericValue >= 8) return "elevated"
    if (numericValue >= 7) return "pre-diabetic"
    return "controlled"
  }

  if (normalized.includes("bp") || normalized.includes("blood pressure")) {
    if (!Number.isFinite(numericValue)) return "unknown"
    if (numericValue >= 140) return "high"
    if (numericValue >= 130) return "elevated"
    return "controlled"
  }

  if (normalized.includes("oxygen") || normalized.includes("o2")) {
    if (!Number.isFinite(numericValue)) return "unknown"
    if (numericValue < 92) return "low"
    return "good"
  }

  return "normal"
}

const classifyPriority = (score: number): PriorityLevel => {
  if (score >= 85) return "critical"
  if (score >= 70) return "high"
  if (score >= 50) return "medium"
  return "low"
}

const computeRiskScore = (record: PatientRecord, labs: PatientLab[]): number => {
  const conditions = safeStringArray(record.conditions).map((condition) => condition.toLowerCase())
  let score = 35

  if (conditions.some((condition) => condition.includes("diabetes"))) score += 25
  if (conditions.some((condition) => condition.includes("copd"))) score += 18
  if (conditions.some((condition) => condition.includes("heart") || condition.includes("atrial") || condition.includes("cardio")))
    score += 20
  if (conditions.some((condition) => condition.includes("cancer"))) score += 15
  if (conditions.some((condition) => condition.includes("hypertension"))) score += 10
  if (conditions.some((condition) => condition.includes("asthma"))) score += 8

  const hbA1cLab = labs.find((lab) => lab.name.toLowerCase().includes("hba1c"))
  if (hbA1cLab) {
    const hbA1cValue = toNumericValue(hbA1cLab.value)
    if (Number.isFinite(hbA1cValue)) {
      if (hbA1cValue >= 9) score += 35
      else if (hbA1cValue >= 8) score += 25
      else if (hbA1cValue >= 7.2) score += 18
      else if (hbA1cValue >= 6.5) score += 10
    }
  }

  return Math.max(20, Math.min(100, Math.round(score)))
}

const generateLastVisit = (createdAt: string | null, index: number): string => {
  if (createdAt) {
    const diffMs = Date.now() - new Date(createdAt).getTime()
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    const weeks = Math.floor(diffDays / 7)
    if (weeks === 1) return "1 week ago"
    return `${weeks} weeks ago`
  }

  const fallbackDays = (index % 6) + 1
  return `${fallbackDays} day${fallbackDays === 1 ? "" : "s"} ago`
}

const hydratePatient = (record: PatientRecord, index: number): PatientWithMeta => {
  let rawLabs: { name: string; value: number | string }[] = []
  if (Array.isArray(record.labs)) {
    rawLabs = record.labs as { name: string; value: number | string }[]
  } else if (typeof record.labs === "string" && record.labs.trim().startsWith("[")) {
    try {
      rawLabs = JSON.parse(record.labs) as { name: string; value: number | string }[]
    } catch (error) {
      console.warn("Unable to parse labs for patient", record.id, error)
      rawLabs = []
    }
  }

  const labs: PatientLab[] = rawLabs
    .filter((lab) => lab && lab.name)
    .map((lab) => ({
      name: String(lab.name),
      value: lab.value,
      status: computeLabStatus(String(lab.name), lab.value),
    }))

  const riskScore = computeRiskScore(record, labs)
  const priority = classifyPriority(riskScore)

  return {
    id: record.id,
    name: record.name,
    age: record.age ?? 0,
    conditions: safeStringArray(record.conditions),
    meds: safeStringArray(record.meds),
    labs,
    riskScore,
    priority,
    lastVisit: generateLastVisit(record.created_at, index),
  }
}

const formatRelativeTimeFromNow = (timestamp: string | null): string => {
  if (!timestamp) return "Just now"
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffMinutes = Math.round(diffMs / (1000 * 60))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  const diffWeeks = Math.round(diffDays / 7)
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? "" : "s"} ago`
  const diffMonths = Math.round(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`
  const diffYears = Math.round(diffDays / 365)
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`
}

const estimateReadTime = (summary: string): string => {
  const words = summary?.split(/\s+/).length ?? 0
  const minutes = Math.max(1, Math.round(words / 180))
  return `${minutes} min read`
}

const mapSourceToCategory = (source: string): string => {
  const normalized = source.toLowerCase()
  if (normalized.includes("guideline")) return "Guidelines"
  if (normalized.includes("fda")) return "Drug Approval"
  if (normalized.includes("payer")) return "Policy"
  return "Research"
}

const mapCategoryToUrgency = (category: string): UpdateUrgency => {
  switch (category) {
    case "Drug Approval":
      return "critical"
    case "Guidelines":
      return "high"
    case "Research":
      return "high"
    case "Policy":
      return "medium"
    default:
      return "medium"
  }
}

const matchesCondition = (patient: PatientWithMeta, condition?: string | null): boolean => {
  if (!condition) return true
  const normalized = condition.toLowerCase()
  return patient.conditions.some((existing) => existing.toLowerCase().includes(normalized))
}

const evaluateCriterion = (patient: PatientWithMeta, criterion?: string | null): boolean => {
  if (!criterion) return true
  const normalized = criterion.toLowerCase()

  if (normalized.includes("hba1c") && normalized.includes(">")) {
    const thresholdMatch = normalized.match(/hba1c\s*[>≥]\s*(\d+(?:\.\d+)?)/)
    const threshold = thresholdMatch ? Number(thresholdMatch[1]) : NaN
    if (!Number.isFinite(threshold)) return true
    const lab = patient.labs.find((item) => item.name.toLowerCase().includes("hba1c"))
    if (!lab) return false
    const value = toNumericValue(lab.value)
    if (!Number.isFinite(value)) return false
    return value > threshold
  }

  if (normalized.includes("eligible her2")) {
    return patient.conditions.some((condition) => condition.toLowerCase().includes("her2+"))
  }

  if (normalized.includes("trelegy")) {
    return patient.meds.some((med) => med.toLowerCase().includes("trelegy"))
  }

  if (normalized.includes("patients on metformin")) {
    return patient.meds.some((med) => med.toLowerCase().includes("metformin"))
  }

  if (normalized.includes("bp") || normalized.includes("130/80")) {
    return patient.conditions.some((condition) => condition.toLowerCase().includes("hypertension"))
  }

  if (normalized.includes("severe persistent asthma")) {
    const hasAsthma = patient.conditions.some((condition) => condition.toLowerCase().includes("asthma"))
    return hasAsthma && patient.riskScore >= 60
  }

  return true
}

const matchUpdateToPatients = (update: UpdateRecord, patientPool: PatientWithMeta[]): string[] => {
  return patientPool
    .filter(
      (patient) =>
        matchesCondition(patient, update.rule_condition) &&
        evaluateCriterion(patient, update.rule_criterion)
    )
    .map((patient) => patient.id)
}

const hydrateUpdate = (record: UpdateRecord, patients: PatientWithMeta[]): UpdateWithMeta => {
  const category = mapSourceToCategory(record.source)
  const urgency = mapCategoryToUrgency(category)
  const impactedPatients = matchUpdateToPatients(record, patients)

  return {
    ...record,
    category,
    urgency,
    readTime: estimateReadTime(record.summary),
    timestamp: formatRelativeTimeFromNow(record.created_at),
    impactedPatients,
  }
}

export default function PatientDashboard() {
  const [patients, setPatients] = useState<PatientWithMeta[]>([])
  const [updates, setUpdates] = useState<UpdateWithMeta[]>([])
  const [highlightedPatients, setHighlightedPatients] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [matchingInProgress, setMatchingInProgress] = useState<string | null>(null)
  const [glowingPatients, setGlowingPatients] = useState<string[]>([])
  const [isResearchStreamCollapsed, setIsResearchStreamCollapsed] = useState(false)
  const [showVitalAiBadge, setShowVitalAiBadge] = useState(false)

  // CedarOS agent context handlers
  const handleHighlightPatients = (patientIds: string[]) => {
    setHighlightedPatients(patientIds)
    setGlowingPatients(patientIds)
    
    // Remove glowing effect after 3 seconds
    setTimeout(() => {
      setGlowingPatients([])
    }, 3000)
  }

  const handleClearHighlights = () => {
    setHighlightedPatients([])
    setGlowingPatients([])
  }

  // Function to handle research card click with vital.ai integration
  const handleResearchCardClick = async (update: UpdateWithMeta) => {
    setMatchingInProgress(update.id)
    setShowVitalAiBadge(true)
    setGlowingPatients([])
  }

  const handleVitalAiComplete = async () => {
    setShowVitalAiBadge(false)
    
    // Get the current matching update
    const currentUpdate = updates.find(u => u.id === matchingInProgress)
    if (!currentUpdate) return
    
    // Simulate the AI matching process (use the existing impacted patients)
    const matchingIds = currentUpdate.impactedPatients || []
    
    // Set highlighted patients and add glowing effect
    setHighlightedPatients(matchingIds)
    setGlowingPatients(matchingIds)
    
    console.log('🎨 Vital.ai match complete - highlightedPatients:', matchingIds)
    
    // Clear matching progress
    setMatchingInProgress(null)
    
    // Remove glowing effect after 3 seconds
    setTimeout(() => {
      setGlowingPatients([])
    }, 3000)
  }
  useEffect(() => {
    const fetchData = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setError("Supabase environment variables are not configured.")
        setPatients([])
        setUpdates([])
        setHighlightedPatients([])
        setLoading(false)
        return
      }

      try {
        const [{ data: patientsData, error: patientsError }, { data: updatesData, error: updatesError }] =
          await Promise.all([
            supabase.from("patients").select("*"),
            supabase.from("research_updates").select("*").order("created_at", { ascending: false }),
          ])

        if (patientsError) throw patientsError
        if (updatesError) throw updatesError

        const hydratedPatients = (patientsData ?? [])
          .map((record, index) => hydratePatient(record as PatientRecord, index))
          .sort((a, b) => b.riskScore - a.riskScore)

        const hydratedUpdates = (updatesData ?? []).map((record) =>
          hydrateUpdate(record as UpdateRecord, hydratedPatients)
        )

        setPatients(hydratedPatients)
        setUpdates(hydratedUpdates)
        setHighlightedPatients([])
        setError(null)
      } catch (fetchError) {
        console.error("Failed to load data from Supabase", fetchError)
        setPatients([])
        setUpdates([])
        setHighlightedPatients([])
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load data from Supabase.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
          ring: "ring-green-200",
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Guidelines":
        return "bg-blue-500"
      case "Drug Approval":
        return "bg-purple-500"
      case "Research":
        return "bg-emerald-500"
      case "Treatment":
        return "bg-amber-500"
      case "AI Research":
        return "bg-violet-500"
    case "Policy":
      return "bg-cyan-500"
      default:
        return "bg-slate-500"
    }
  }

  const getRiskScoreColor = (score: number) => {
    if (score >= 85) return "text-red-600 bg-red-50 border-red-200"
    if (score >= 70) return "text-orange-600 bg-orange-50 border-orange-200"
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-green-600 bg-green-50 border-green-200"
  }


  const UpdatesFeedContent = () => (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load updates</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !error && (
        <Card className="surface-card border border-border/60">
          <CardContent className="flex items-center gap-3 p-4 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Fetching the latest research updates…</span>
          </CardContent>
        </Card>
      )}

      {!loading && !error && updates.length === 0 && (
        <Card className="surface-card border border-border/60">
          <CardContent className="p-4 text-sm text-muted-foreground">
            No updates yet. Once Impericus streams new guidance, it will appear here in real time.
          </CardContent>
        </Card>
      )}

      {!loading && !error &&
        updates.map((update) => (
          <div 
            key={update.id} 
            className="cursor-pointer relative"
            onClick={() => handleResearchCardClick(update)}
          >
            <Card className={`surface-card border border-border/60 hover:shadow-lg transition-all duration-200 ${
              matchingInProgress === update.id ? 'ring-2 ring-primary animate-pulse' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-xs px-3 py-1 font-medium bg-muted/40 border-border/50 ${
                          update.urgency === "critical"
                            ? "text-rose-600"
                            : update.urgency === "high"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        {update.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{update.timestamp}</span>
                      <Badge variant="outline" className="text-xs opacity-70 bg-muted/30">
                        {update.readTime}
                      </Badge>
                      {matchingInProgress === update.id && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Matching...
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-sidebar-foreground leading-snug mb-2">
                        {update.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {update.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3 text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {update.impactedPatients.length} patient
                          {update.impactedPatients.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-xs text-muted-foreground font-medium">{update.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* CedarOS Agent Context */}
      <CedarAgentContext
        patients={patients}
        updates={updates}
        highlightedPatients={highlightedPatients}
        onHighlightPatients={handleHighlightPatients}
        onClearHighlights={handleClearHighlights}
      />

      {/* Vital.ai Loading Badge */}
      <VitalAiBadge 
        isVisible={showVitalAiBadge}
        onComplete={handleVitalAiComplete}
      />
      
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex">
          <PatientCanvas 
            patients={patients}
            highlightedPatients={highlightedPatients}
            glowingPatients={glowingPatients}
            error={error}
            loading={loading}
            onClearHighlights={handleClearHighlights}
            isResearchStreamCollapsed={isResearchStreamCollapsed}
            onToggleResearchStream={() => setIsResearchStreamCollapsed(!isResearchStreamCollapsed)}
            researchUpdate={matchingInProgress ? updates.find(u => u.id === matchingInProgress) : undefined}
          />

          {/* Collapsible Research Stream */}
          <div className={`transition-all duration-300 ease-in-out ${
            isResearchStreamCollapsed 
              ? 'w-0 opacity-0 overflow-hidden' 
              : 'w-80 opacity-100'
          } glass-effect border-l border-sidebar-border/50 overflow-y-auto`}>
            <div className="p-4 sticky top-0 glass-effect border-b border-sidebar-border/30 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-sidebar-foreground">Research Stream</h3>
                    <p className="text-xs text-muted-foreground mt-1">Latest medical insights & guidelines</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {loading ? "Loading..." : `${updates.length} update${updates.length === 1 ? "" : "s"}`}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsResearchStreamCollapsed(true)}
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <UpdatesFeedContent />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
