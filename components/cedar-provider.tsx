"use client"

import { CedarCopilot } from "cedar-os"

export function CedarProvider({ children }: { children: React.ReactNode }) {
  return (
    <CedarCopilot
      llmProvider={{
        provider: 'openai',
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
      }}
      // Enable structured responses for agentic actions
      enableStructuredResponses={true}
      // Configure agent context
      agentConfig={{
        systemPrompt: `You are a medical AI assistant that helps healthcare providers analyze research updates and identify which patients would be affected. 

Your capabilities include:
- Analyzing medical research updates for patient criteria
- Matching patients based on conditions, lab values, medications, and risk factors
- Highlighting relevant patients on the visual canvas
- Providing insights about patient care implications

Always be precise and only include patients who clearly meet the criteria mentioned in research updates. Use the available state setters and frontend tools to interact with the application.`,
        temperature: 0.1,
        maxTokens: 500
      }}
    >
      {children}
    </CedarCopilot>
  )
}
