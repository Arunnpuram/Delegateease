"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DirectApi() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      if (!fileInputRef.current?.files?.[0]) {
        throw new Error("Please select a service account file")
      }

      if (!userEmail) {
        throw new Error("Please enter a user email")
      }

      const formData = new FormData()
      formData.append("serviceAccount", fileInputRef.current.files[0])
      formData.append("userEmail", userEmail)
      formData.append("operation", "list")

      console.log("Submitting to /api/delegates")
      const response = await fetch("/api/delegates", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()
      console.log("Raw response:", responseText)

      try {
        const data = JSON.parse(responseText)
        if (!response.ok) {
          throw new Error(data.message || `Error: ${response.status} ${response.statusText}`)
        }
        setResult(data)
      } catch (parseError) {
        console.error("Parse error:", parseError)
        throw new Error(`Invalid JSON response. Status: ${response.status} ${response.statusText}`)
      }
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Direct API Access</h1>
        <p className="mb-6">
          This page allows you to directly access the API without using the main interface. Use this if you're having
          trouble with the buttons in the main app.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>List Delegates</CardTitle>
            <CardDescription>Directly call the delegates API endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="service-account">Service Account File</Label>
                <Input id="service-account" type="file" accept=".json" ref={fileInputRef} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">User Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="shared@example.com"
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Processing..." : "List Delegates"}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  <p className="font-medium">Error:</p>
                  <p className="text-sm">{error}</p>
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="mt-4">
                <AlertDescription>
                  <p className="font-medium">Success:</p>
                  <pre className="text-sm overflow-auto p-2 bg-muted rounded mt-2">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">API Information</h2>
          <p>
            This page uses the <code className="bg-muted px-1 py-0.5 rounded">/api/delegates</code> endpoint, which is a
            consolidated API that handles all delegate operations.
          </p>
          <p>
            You can also test if the API is working at all by visiting{" "}
            <a href="/api/test" target="_blank" className="text-blue-600 dark:text-blue-400 underline" rel="noreferrer">
              /api/test
            </a>
            .
          </p>

          <Alert className="mt-4">
            <AlertDescription>
              <p className="font-medium">Note about Vercel Deployments:</p>
              <p className="text-sm mt-1">
                These API routes use the App Router format which should work better with Vercel deployments. The older
                Pages Router API routes in <code>/pages/api</code> might not work correctly on Vercel.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
