import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { CedarProvider } from "@/components/cedar-provider"
import "./globals.css"


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-background text-foreground`}>
        <CedarProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
        </CedarProvider>
      </body>
    </html>
  )
}
