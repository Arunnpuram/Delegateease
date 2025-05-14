"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApiTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/test")
      const data = await response.json()
      setTestResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("API test error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const testDelegatesApi = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/delegates")
      const data = await response.json()
      setTestResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("API test error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">API Test Page</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test API Endpoints</CardTitle>
            <CardDescription>Verify that the API endpoints are working correctly</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
