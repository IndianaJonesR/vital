'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap } from 'lucide-react'

interface VitalAiBadgeProps {
  isVisible: boolean
  onComplete: () => void
}

export function VitalAiBadge({ isVisible, onComplete }: VitalAiBadgeProps) {
  const [stage, setStage] = useState<'loading' | 'processing' | 'complete'>('loading')

  useEffect(() => {
    if (!isVisible) {
      setStage('loading')
      return
    }

    // Quick loading sequence for demo effect
    const timer1 = setTimeout(() => {
      setStage('processing')
    }, 300)

    const timer2 = setTimeout(() => {
      setStage('complete')
    }, 800)

    const timer3 = setTimeout(() => {
      onComplete()
    }, 1200)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <Badge 
        variant="outline" 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-4 py-2 text-sm font-medium shadow-lg"
      >
        {stage === 'loading' && (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            vital.ai initializing...
          </>
        )}
        {stage === 'processing' && (
          <>
            <Zap className="h-4 w-4 mr-2 animate-pulse" />
            vital.ai analyzing...
          </>
        )}
        {stage === 'complete' && (
          <>
            <Zap className="h-4 w-4 mr-2 text-green-300" />
            vital.ai match complete!
          </>
        )}
      </Badge>
    </div>
  )
}
