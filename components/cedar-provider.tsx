"use client"

import { CedarCopilot } from "cedar-os"

export function CedarProvider({ children }: { children: React.ReactNode }) {
  return (
    <CedarCopilot
      llmProvider={{
        provider: 'openai',
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
      }}
    >
      {children}
    </CedarCopilot>
  )
}
