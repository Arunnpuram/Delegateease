"use client"

import { useState } from "react"
import DelegateForm from "./delegate-form"
import ResultDisplay from "./result-display"
import AuthOptions from "./auth-options"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AuthMethod } from "@/types"

export default function DelegateEaseApp() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)
  const [serviceAccountFile, setServiceAccountFile] = useState<File | null>(null)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("auth")
  const [rawOutput, setRawOutput] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  const handleServiceAccountUploaded = (file: File) => {
    setServiceAccountFile(file)
    setAuthMethod("service-account")
    setResults(null)
    setError(null)
    setRawOutput(null)
    setDebugInfo(null)

    toast({
      title: "Service account uploaded",
      description: "Your service account file is ready to use",
    })
  }

  const handleOAuthComplete = () => {
    setAuthMethod("oauth")
    setServiceAccountFile(null)
    setResults(null)
    setError(null)
    setRawOutput(null)
    setDebugInfo(null)

    toast({
      title: "OAuth authentication complete",
      description: "You are now authenticated with Google",
    })
  }

  const handleSubmit = async (formData: FormData, endpoint: string) => {
    try {
      setError(null)
      setResults(null)
      setRawOutput(null)
      setDebugInfo(null)
      setIsLoading(true)

      // Add the service account file to the form data if using service account auth
      if (authMethod === "service-account" && serviceAccountFile) {
        formData.append("serviceAccount", serviceAccountFile)
      }

      console.log(`Submitting request to ${endpoint}`)
      console.log("Form data keys:", Array.from(formData.keys()))

      // Call the API
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      // Get the raw response text first for debugging
      const responseText = await response.text()
      console.log("Raw API response:", responseText)
      setDebugInfo(responseText)

      // Try to parse the response as JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        throw new Error(`Server returned an invalid JSON response. Status: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(data.message || `Server returned an error: ${response.status} ${response.statusText}`)
      }

      // Store raw output if available
      const isBatch = formData.has("operations")
      if (isBatch) {
        // For batch operations, collect all raw outputs
        const allRawOutputs = data.results
          .filter((result: any) => result.rawOutput)
          .map(
            (result: any) => `--- ${result.operation.toUpperCase()} for ${result.userEmail} ---\n${result.rawOutput}`,
          )
          .join("\n\n")

        if (allRawOutputs) {
          setRawOutput(allRawOutputs)
        }
      } else if (data.rawOutput) {
        setRawOutput(data.rawOutput)
      }

      // Handle the response
      if (isBatch && data.results) {
        setResults(data.results)

        // Count successes and failures
        const successes = data.results.filter((r: any) => r.success).length
        const failures = data.results.length - successes

        toast({
          title: "Batch operation completed",
          description: `${successes} operations succeeded, ${failures} failed`,
          variant: failures > 0 ? "destructive" : "default",
        })
      } else {
        setResults([data])

        toast({
          title: data.success ? "Operation successful" : "Operation failed",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        })
      }
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "An unexpected error occurred")

      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectApiResult = (result: any) => {
    setResults(result)
  }

  const handleDirectApiError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleDirectApiLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="bg-background">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="manage" disabled={!authMethod}>
              Manage Delegates
            </TabsTrigger>
          </TabsList>
          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle>Choose Authentication Method</CardTitle>
                <CardDescription>Select how you want to authenticate with the Gmail API</CardDescription>
              </CardHeader>
              <CardContent>
                <AuthOptions
                  onServiceAccountUploaded={(file) => {
                    handleServiceAccountUploaded(file)
                    // Automatically switch to manage tab after authentication
                    setActiveTab("manage")
                  }}
                  onOAuthComplete={() => {
                    handleOAuthComplete()
                    // Automatically switch to manage tab after authentication
                    setActiveTab("manage")
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Manage Delegates</CardTitle>
                <CardDescription>Add, remove, or list delegates for Gmail accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
                  <AlertDescription>
                    <p className="font-medium">Self-Hosted Application</p>
                    <p className="text-sm mt-1">
                      This application runs entirely on your own infrastructure. No data is sent to external services.
                    </p>
                  </AlertDescription>
                </Alert>

                <DelegateForm
                  authMethod={authMethod}
                  serviceAccountFile={serviceAccountFile}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  onDirectApiResult={handleDirectApiResult}
                  onDirectApiError={handleDirectApiError}
                  onDirectApiLoading={handleDirectApiLoading}
                />
              </CardContent>
            </Card>
            {(results || error) && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResultDisplay results={results} error={error} />
                </CardContent>
              </Card>
            )}
            {rawOutput && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Script Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs whitespace-pre-wrap">{rawOutput}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
            {debugInfo && error && (
              <Card className="mt-6 border-red-300 dark:border-red-800">
                <CardHeader>
                  <CardTitle>Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                    <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
