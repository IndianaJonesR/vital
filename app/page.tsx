"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Activity,
  FileText,
  Settings,
  Bell,
  Calendar,
  User,
  TestTube,
  Menu,
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
  BarChart3,
  Stethoscope,
  Award,
} from "lucide-react"

const patients = [
  {
    id: 1,
    name: "Sarah L",
    age: 54,
    conditions: ["Type 2 Diabetes", "Neuropathy"],
    labs: [
      { name: "HbA1c", value: 9.1, status: "high" },
      { name: "Glucose", value: 245, status: "high" },
    ],
    priority: "high",
    lastVisit: "2 days ago",
    riskScore: 85,
  },
  {
    id: 2,
    name: "James K",
    age: 61,
    conditions: ["Diabetes", "Hypertension", "CAD"],
    labs: [
      { name: "HbA1c", value: 8.5, status: "high" },
      { name: "BP", value: "145/90", status: "elevated" },
      { name: "Cholesterol", value: 280, status: "high" },
    ],
    priority: "critical",
    lastVisit: "1 week ago",
    riskScore: 92,
  },
  {
    id: 3,
    name: "Maya S",
    age: 47,
    conditions: ["HER2+ Breast Cancer", "Chemotherapy"],
    labs: [
      { name: "CEA", value: 3.2, status: "normal" },
      { name: "WBC", value: 3.8, status: "low" },
    ],
    priority: "critical",
    lastVisit: "3 days ago",
    riskScore: 88,
  },
  {
    id: 4,
    name: "Robert Chen",
    age: 38,
    conditions: ["Asthma", "Allergic Rhinitis"],
    labs: [
      { name: "IgE", value: 245, status: "elevated" },
      { name: "Peak Flow", value: "85%", status: "good" },
    ],
    priority: "medium",
    lastVisit: "5 days ago",
    riskScore: 45,
  },
  {
    id: 5,
    name: "Elena Rodriguez",
    age: 72,
    conditions: ["Atrial Fibrillation", "Heart Failure", "CKD"],
    labs: [
      { name: "BNP", value: 850, status: "high" },
      { name: "INR", value: 2.3, status: "therapeutic" },
      { name: "Creatinine", value: 1.8, status: "elevated" },
    ],
    priority: "critical",
    lastVisit: "1 day ago",
    riskScore: 94,
  },
  {
    id: 6,
    name: "Michael Thompson",
    age: 29,
    conditions: ["Anxiety Disorder", "Depression"],
    labs: [{ name: "TSH", value: 2.1, status: "normal" }],
    priority: "low",
    lastVisit: "2 weeks ago",
    riskScore: 25,
  },
  {
    id: 7,
    name: "Dr. Lisa Park",
    age: 45,
    conditions: ["Migraine", "Hypertension"],
    labs: [
      { name: "BP", value: "138/85", status: "elevated" },
      { name: "Magnesium", value: 1.9, status: "normal" },
    ],
    priority: "medium",
    lastVisit: "4 days ago",
    riskScore: 55,
  },
  {
    id: 8,
    name: "Ahmed Hassan",
    age: 56,
    conditions: ["COPD", "Type 2 Diabetes", "Sleep Apnea"],
    labs: [
      { name: "HbA1c", value: 7.2, status: "controlled" },
      { name: "FEV1", value: "65%", status: "moderate" },
      { name: "O2 Sat", value: "94%", status: "low" },
    ],
    priority: "high",
    lastVisit: "6 days ago",
    riskScore: 78,
  },
  {
    id: 9,
    name: "Jennifer Walsh",
    age: 33,
    conditions: ["Rheumatoid Arthritis", "Osteoporosis"],
    labs: [
      { name: "CRP", value: 12.5, status: "elevated" },
      { name: "RF", value: 89, status: "positive" },
      { name: "Bone Density", value: -2.1, status: "low" },
    ],
    priority: "medium",
    lastVisit: "1 week ago",
    riskScore: 62,
  },
  {
    id: 10,
    name: "David Kim",
    age: 67,
    conditions: ["Prostate Cancer", "BPH", "Hypertension"],
    labs: [
      { name: "PSA", value: 4.8, status: "elevated" },
      { name: "BP", value: "142/88", status: "elevated" },
    ],
    priority: "high",
    lastVisit: "3 days ago",
    riskScore: 81,
  },
  {
    id: 11,
    name: "Maria Santos",
    age: 41,
    conditions: ["Lupus", "Kidney Disease", "Anemia"],
    labs: [
      { name: "Creatinine", value: 1.8, status: "elevated" },
      { name: "ANA", value: "1:320", status: "positive" },
      { name: "Hemoglobin", value: 9.2, status: "low" },
    ],
    priority: "critical",
    lastVisit: "2 days ago",
    riskScore: 89,
  },
  {
    id: 12,
    name: "Thomas Wilson",
    age: 52,
    conditions: ["Sleep Apnea", "Obesity", "Pre-diabetes"],
    labs: [
      { name: "BMI", value: 34.2, status: "obese" },
      { name: "HbA1c", value: 6.1, status: "pre-diabetic" },
      { name: "AHI", value: 28, status: "severe" },
    ],
    priority: "medium",
    lastVisit: "1 week ago",
    riskScore: 68,
  },
  {
    id: 13,
    name: "Isabella Chen",
    age: 28,
    conditions: ["Thyroid Cancer", "Post-surgical"],
    labs: [
      { name: "TSH", value: 0.1, status: "suppressed" },
      { name: "Thyroglobulin", value: 2.1, status: "elevated" },
    ],
    priority: "high",
    lastVisit: "4 days ago",
    riskScore: 72,
  },
  {
    id: 14,
    name: "Marcus Johnson",
    age: 65,
    conditions: ["Alzheimer's", "Hypertension", "Osteoarthritis"],
    labs: [
      { name: "MMSE", value: 18, status: "moderate" },
      { name: "BP", value: "148/92", status: "high" },
    ],
    priority: "high",
    lastVisit: "1 week ago",
    riskScore: 86,
  },
  {
    id: 15,
    name: "Sophia Martinez",
    age: 35,
    conditions: ["Multiple Sclerosis", "Fatigue Syndrome"],
    labs: [
      { name: "MRI Lesions", value: 8, status: "stable" },
      { name: "Vitamin D", value: 18, status: "low" },
    ],
    priority: "medium",
    lastVisit: "5 days ago",
    riskScore: 58,
  },
  {
    id: 16,
    name: "William Brown",
    age: 59,
    conditions: ["Liver Cirrhosis", "Hepatitis C", "Portal HTN"],
    labs: [
      { name: "ALT", value: 89, status: "elevated" },
      { name: "Bilirubin", value: 3.2, status: "high" },
      { name: "Albumin", value: 2.8, status: "low" },
    ],
    priority: "critical",
    lastVisit: "2 days ago",
    riskScore: 91,
  },
  {
    id: 17,
    name: "Emma Davis",
    age: 42,
    conditions: ["Fibromyalgia", "Chronic Pain", "IBS"],
    labs: [
      { name: "CRP", value: 8.2, status: "elevated" },
      { name: "Vitamin B12", value: 180, status: "low" },
    ],
    priority: "medium",
    lastVisit: "1 week ago",
    riskScore: 52,
  },
  {
    id: 18,
    name: "Alexander Lee",
    age: 31,
    conditions: ["Crohn's Disease", "Anemia", "Malnutrition"],
    labs: [
      { name: "CRP", value: 15.8, status: "high" },
      { name: "Iron", value: 45, status: "low" },
      { name: "Albumin", value: 3.1, status: "low" },
    ],
    priority: "high",
    lastVisit: "3 days ago",
    riskScore: 75,
  },
]

const updates = [
  {
    id: 1,
    title: "2025 ADA Diabetes Guidelines Released",
    summary:
      "Revolutionary changes in diabetes management: Earlier insulin initiation recommended for HbA1c > 8.0%. New continuous glucose monitoring protocols show 40% reduction in severe hypoglycemic events.",
    impactedPatients: [1, 2, 8, 12],
    category: "Guidelines",
    urgency: "critical",
    timestamp: "2 hours ago",
    source: "American Diabetes Association",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "FDA Approval: Breakthrough HER2+ Therapy",
    summary:
      "Game-changing immunotherapy reduces progression risk by 35% with significantly improved quality of life metrics. Phase III trials show unprecedented survival benefits.",
    impactedPatients: [3],
    category: "Drug Approval",
    urgency: "critical",
    timestamp: "4 hours ago",
    source: "FDA",
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "Heart Failure Management Revolution",
    summary:
      "New SGLT2 inhibitor combination therapy demonstrates 40% reduction in cardiovascular death and hospitalization. Landmark study changes treatment paradigm.",
    impactedPatients: [5],
    category: "Research",
    urgency: "high",
    timestamp: "6 hours ago",
    source: "European Heart Journal",
    readTime: "6 min read",
  },
  {
    id: 4,
    title: "COPD Exacerbation Prevention Breakthrough",
    summary:
      "Triple therapy combination with novel anti-inflammatory shows 60% reduction in severe exacerbations. Respiratory function improvements sustained at 12 months.",
    impactedPatients: [8],
    category: "Treatment",
    urgency: "high",
    timestamp: "8 hours ago",
    source: "NEJM",
    readTime: "7 min read",
  },
  {
    id: 5,
    title: "AI-Powered Rheumatoid Arthritis Biomarkers",
    summary:
      "Machine learning identifies 12 new predictive biomarkers for treatment response. Personalized therapy selection accuracy increased to 89%.",
    impactedPatients: [9],
    category: "AI Research",
    urgency: "medium",
    timestamp: "12 hours ago",
    source: "Nature Medicine",
    readTime: "4 min read",
  },
  {
    id: 6,
    title: "Prostate Cancer Screening Revolution",
    summary:
      "Multi-parametric MRI combined with AI reduces unnecessary biopsies by 45%. New risk stratification model improves early detection.",
    impactedPatients: [10],
    category: "Guidelines",
    urgency: "medium",
    timestamp: "1 day ago",
    source: "USPSTF",
    readTime: "6 min read",
  },
  {
    id: 7,
    title: "Lupus Treatment Paradigm Shift",
    summary:
      "Novel JAK inhibitor shows remarkable efficacy in refractory cases. 70% of patients achieved clinical remission in phase III trials.",
    impactedPatients: [11],
    category: "Drug Approval",
    urgency: "high",
    timestamp: "1 day ago",
    source: "The Lancet",
    readTime: "5 min read",
  },
  {
    id: 8,
    title: "Sleep Apnea & Metabolic Syndrome Link",
    summary:
      "Groundbreaking research reveals direct causal relationship. New treatment protocols address both conditions simultaneously with 80% success rate.",
    impactedPatients: [12],
    category: "Research",
    urgency: "medium",
    timestamp: "2 days ago",
    source: "Sleep Medicine Reviews",
    readTime: "7 min read",
  },
]

export default function PatientDashboard() {
  const [selectedUpdate, setSelectedUpdate] = useState<(typeof updates)[0] | null>(null)
  const [highlightedPatients, setHighlightedPatients] = useState<number[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [updatesFeedOpen, setUpdatesFeedOpen] = useState(false)

  const handleUpdateClick = (update: (typeof updates)[0]) => {
    setSelectedUpdate(update)
    setHighlightedPatients(update.impactedPatients)
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

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">MedCare Pro</h1>
            <p className="text-xs text-muted-foreground">Patient Management Platform</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant="secondary"
          className="w-full justify-start gap-3 bg-secondary text-sidebar-foreground hover:bg-secondary/80"
        >
          <Activity className="h-4 w-4" />
          Patient Dashboard
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-muted/60"
        >
          <BarChart3 className="h-4 w-4" />
          Analytics & Reports
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-muted/60"
        >
          <Award className="h-4 w-4" />
          Quality Metrics
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-muted/60"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </nav>
    </>
  )

  const UpdatesFeedContent = () => (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-sidebar-foreground">Research Stream</h3>
            <p className="text-xs text-muted-foreground mt-1">Latest medical insights & guidelines</p>
          </div>
          <div className="text-xs text-muted-foreground">{updates.length} updates</div>
        </div>
      </div>

      <div className="space-y-4">
        {updates.map((update) => (
          <Drawer key={update.id}>
            <DrawerTrigger asChild>
              <div
                className="group cursor-pointer"
                onClick={() => handleUpdateClick(update)}
              >
                <div className="relative">
                  <Card className="surface-card border border-border/60 hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
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
                            <span className="text-xs text-muted-foreground">{update.timestamp}</span>
                            <Badge variant="outline" className="text-xs opacity-70 bg-muted/30">
                              {update.readTime}
                            </Badge>
                          </div>

                          <h4 className="font-semibold text-sm text-sidebar-foreground mb-3 leading-tight">
                            {update.title}
                          </h4>

                          <p className="text-xs text-muted-foreground text-pretty line-clamp-3 mb-3 leading-relaxed">
                            {update.summary}
                          </p>

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
              </div>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh] surface-card border border-border/60">
              <DrawerHeader className="border-b border-border/60">
                <DrawerTitle className="text-balance text-xl font-semibold text-foreground">{update.title}</DrawerTitle>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className={`${getCategoryColor(update.category)} text-white`}>
                    {update.category}
                  </Badge>
                  <Badge variant="outline" className="bg-muted/50">
                    {update.source}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{update.timestamp}</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {update.readTime}
                  </Badge>
                </div>
              </DrawerHeader>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="surface-subtle p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Research Summary
                  </h4>
                  <p className="text-muted-foreground text-pretty leading-relaxed">{update.summary}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Impacted Patients ({update.impactedPatients.length})
                  </h4>
                  <div className="space-y-3">
                    {update.impactedPatients.map((patientId) => {
                      const patient = patients.find((p) => p.id === patientId)
                      if (!patient) return null

                      return (
                        <Card key={patient.id} className="surface-card p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              {patient.name}
                            </h5>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Age {patient.age}</Badge>
                              <Badge className={`text-xs font-medium ${getRiskScoreColor(patient.riskScore)}`}>
                                Risk: {patient.riskScore}%
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {patient.conditions.map((condition, index) => (
                              <Badge key={index} className={getConditionColor(condition)} variant="secondary">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Explainer
                            </Button>
                            <Button size="sm" variant="outline" className="hover:bg-muted/50">
                              <FileText className="h-3 w-3 mr-1" />
                              Summary
                            </Button>
                            <Button size="sm" variant="ghost" className="gap-1 hover:bg-muted/50">
                              <Calendar className="h-3 w-3" />
                              Schedule
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ))}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <div className="hidden lg:flex w-72 glass-effect border-r border-sidebar-border/60 flex-col bg-background">
          <SidebarContent />
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden fixed top-4 left-4 z-50 surface-card border border-border/70"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 surface-card border border-border/60">
            <div className="flex flex-col h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto bg-background">
            <div className="flex items-center justify-between mb-6 lg:mb-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Patient Experience</p>
                <h2 className="text-2xl lg:text-3xl font-semibold text-foreground">
                  Patient Care Dashboard
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Professional healthcare management for {patients.length} active patients with real-time insights.
                </p>
              </div>

              <Sheet open={updatesFeedOpen} onOpenChange={setUpdatesFeedOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Updates
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-4 surface-card border border-border/60">
                  <UpdatesFeedContent />
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid gap-4 md:gap-6 lg:gap-6">
              {patients.map((patient) => {
                const priorityConfig = getPriorityConfig(patient.priority)
                const PriorityIcon = priorityConfig.icon

                return (
                  <Card
                    key={patient.id}
                    className={`surface-card transition-all duration-200 ${priorityConfig.glow} professional-hover ${
                      highlightedPatients.includes(patient.id)
                        ? `ring-2 ring-primary shadow-lg shadow-primary/10 scale-[1.01]`
                        : "hover:scale-[1.01]"
                    } overflow-hidden group`}
                  >
                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base lg:text-lg flex items-center gap-3 text-foreground">
                          <User className="h-5 lg:h-6 w-5 lg:w-6 text-muted-foreground" />
                          <span>{patient.name}</span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-muted/30 border-border/50">
                            Age {patient.age}
                          </Badge>
                          <Badge className={`text-xs ${priorityConfig.color} flex items-center gap-1 font-medium`}>
                            <PriorityIcon className="h-3 w-3" />
                            {patient.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Last visit: {patient.lastVisit}</span>
                        <Badge className={`text-xs font-medium ${getRiskScoreColor(patient.riskScore)} shadow-sm`}>
                          <Pulse className="h-3 w-3 mr-1" /> Risk: {patient.riskScore}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                            <Shield className="h-3 w-3" />
                            Medical Conditions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {patient.conditions.map((condition, index) => (
                              <Badge
                                key={index}
                                className={`${getConditionColor(condition)} font-medium`}
                                variant="secondary"
                              >
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {patient.labs.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                              <TestTube className="h-3 w-3" />
                              Laboratory Results
                            </p>
                            <div className="space-y-2">
                              {patient.labs.map((lab, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center text-sm surface-subtle p-3"
                                >
                                  <span className="font-semibold">{lab.name}:</span>
                                  <div className="flex items-center gap-2">
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

                        <div className="flex gap-3 pt-3 border-t border-border/30">
                          <Button
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90 shadow-none font-medium"
                          >
                            <Zap className="h-3 w-3 mr-2" />
                            AI Clinical Insights
                          </Button>
                          <Button size="sm" variant="outline" className="hover:bg-muted/30 border-border/50">
                            <Calendar className="h-3 w-3 mr-2" />
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:block w-80 glass-effect border-l border-sidebar-border/50 overflow-y-auto">
            <div className="p-4 sticky top-0 glass-effect border-b border-sidebar-border/30 z-10">
              <UpdatesFeedContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
