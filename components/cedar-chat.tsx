"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Sparkles, Users } from "lucide-react"
import { CedarCopilot } from "cedar-os"

type CedarChatProps = {
  patients: any[]
  updates: any[]
  onHighlightPatients: (patientIds: string[]) => void
  onClearHighlights: () => void
}

export function CedarChatInterface({ 
  patients, 
  updates, 
  onHighlightPatients, 
  onClearHighlights 
}: CedarChatProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full w-14 h-14"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-background border border-border rounded-lg shadow-2xl">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Medical AI Assistant
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {patients.length} patients
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {updates.length} updates
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[500px]">
              <CedarCopilot
                placeholder="Ask me to analyze research updates and find matching patients..."
                className="h-full"
                // The CedarCopilot component will handle the chat interface
                // and automatically have access to all registered state
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
