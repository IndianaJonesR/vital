"use client"

import { useEffect, useState, useRef } from 'react'

type ConnectionLineProps = {
  fromPosition: { x: number; y: number }
  toPosition: { x: number; y: number }
  isActive?: boolean
  animationDelay?: number
}

export function ConnectionLine({ 
  fromPosition, 
  toPosition, 
  isActive = false,
  animationDelay = 0 
}: ConnectionLineProps) {
  const [path, setPath] = useState<string>('')
  const [isVisible, setIsVisible] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    // Calculate the path for a curved line
    const dx = toPosition.x - fromPosition.x
    const dy = toPosition.y - fromPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Create a smooth curve with control points
    const controlPoint1X = fromPosition.x + dx * 0.5
    const controlPoint1Y = fromPosition.y + dy * 0.2
    const controlPoint2X = fromPosition.x + dx * 0.5
    const controlPoint2Y = fromPosition.y + dy * 0.8
    
    const pathData = `M ${fromPosition.x} ${fromPosition.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${toPosition.x} ${toPosition.y}`
    setPath(pathData)
    
    // Show the line with a slight delay for animation effect
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, animationDelay)
    
    return () => clearTimeout(timer)
  }, [fromPosition, toPosition, animationDelay])

  if (!isVisible) return null

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: '100vw', height: '100vh' }}
    >
      <defs>
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#3b82f6"
            opacity="0.8"
          />
        </marker>
      </defs>
      
      {/* Animated path */}
      <path
        d={path}
        stroke="url(#connectionGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        filter="url(#glow)"
        className={`transition-all duration-1000 ${
          isActive ? 'opacity-100' : 'opacity-60'
        }`}
        style={{
          strokeDasharray: '10 5',
          animation: isActive ? 'dash 2s linear infinite' : 'none',
        }}
      />
      
      {/* Pulse animation for active connections */}
      {isActive && (
        <path
          d={path}
          stroke="#3b82f6"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          opacity="0.3"
          className="animate-pulse"
        />
      )}
      
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -15;
          }
        }
      `}</style>
    </svg>
  )
}

type ConnectionManagerProps = {
  connections: Array<{
    id: string
    from: { x: number; y: number }
    to: { x: number; y: number }
    isActive?: boolean
  }>
}

export function ConnectionManager({ connections }: ConnectionManagerProps) {
  return (
    <>
      {connections.map((connection, index) => (
        <ConnectionLine
          key={connection.id}
          fromPosition={connection.from}
          toPosition={connection.to}
          isActive={connection.isActive}
          animationDelay={index * 200} // Stagger animations
        />
      ))}
    </>
  )
}
