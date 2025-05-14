"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "next-themes"
import DelegateEaseApp from "../components/delegate-ease-app"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // Ensure theme is only applied after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">DelegateEase - Gmail Delegation Manager</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Optimized API Routes</CardTitle>
              <CardDescription>We've streamlined the application with consolidated API routes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">The application now uses a single API route for all delegate operations:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>
                  <code className="bg-muted px-1 py-0.5 rounded">/api/delegates</code> - Handles all delegate operations
                  (list, add, remove, batch)
                </li>
                <li>
                  <code className="bg-muted px-1 py-0.5 rounded">/api/test</code> - Simple test endpoint
                </li>
              </ul>
              <p>This consolidated approach reduces code duplication and improves reliability.</p>
            </CardContent>
          </Card>

          <DelegateEaseApp />
        </div>
      </div>
    </ThemeProvider>
  )
}
