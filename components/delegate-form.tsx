"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { DelegateFormProps } from "@/types"

export default function DelegateForm({
  authMethod,
  serviceAccountFile,
  onSubmit,
  isLoading,
  onDirectApiResult,
  onDirectApiError,
  onDirectApiLoading,
}: DelegateFormProps) {
  const [operation, setOperation] = useState<string>("list")
  const [userEmail, setUserEmail] = useState<string>("")
  const [delegateEmail, setDelegateEmail] = useState<string>("")
  const [batchEmails, setBatchEmails] = useState<string>("")
  const [debugMode, setDebugMode] = useState<boolean>(true) // Enable debug mode by default

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authMethod) {
      toast({
        title: "Authentication required",
        description: "Please authenticate first",
        variant: "destructive",
      })
      return
    }

    const isBatchMode = e.currentTarget.getAttribute("data-mode") === "batch"

    if (!isBatchMode && !userEmail) {
      toast({
        title: "Missing information",
        description: "Please enter the mailbox email address",
        variant: "destructive",
      })
      return
    }

    if (!isBatchMode && (operation === "add" || operation === "remove") && !delegateEmail) {
      toast({
        title: "Missing information",
        description: "Please enter the delegate email address",
        variant: "destructive",
      })
      return
    }

    if (isBatchMode && !batchEmails.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter batch operations",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()

      if (authMethod === "service-account" && serviceAccountFile) {
        formData.append("serviceAccount", serviceAccountFile)
      } else {
        toast({
          title: "Missing service account",
          description: "Service account file is required",
          variant: "destructive",
        })
        return
      }

      formData.append("authMethod", authMethod)
      formData.append("operation", operation)

      if (isBatchMode) {
        // Parse batch operations
        try {
          const operations = batchEmails
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
              const [op, user, delegate] = line.split(",").map((item) => item.trim())
              return {
                operation: op,
                userEmail: user,
                delegateEmail: delegate,
              }
            })

          formData.append("operations", JSON.stringify(operations))
        } catch (error) {
          toast({
            title: "Invalid format",
            description: "Please check your batch operations format",
            variant: "destructive",
          })
          return
        }
      } else {
        formData.append("userEmail", userEmail)
        if (delegateEmail) {
          formData.append("delegateEmail", delegateEmail)
        }
      }

      if (debugMode) {
        console.log("Form data being submitted:")
        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`)
        }
      }

      // Use the consolidated API endpoint
      const endpoint = "/api/delegates"
      console.log(`Submitting to endpoint: ${endpoint}`)

      await onSubmit(formData, endpoint)

      // Reset form if successful
      if (!isBatchMode) {
        if (operation !== "list") {
          setDelegateEmail("")
        }
      } else {
        setBatchEmails("")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const handleDirectApiClick = async () => {
    if (!serviceAccountFile) {
      toast({
        title: "Missing service account",
        description: "Service account file is required",
        variant: "destructive",
      })
      return
    }

    if (!userEmail) {
      toast({
        title: "Missing email",
        description: "Please enter a mailbox email address",
        variant: "destructive",
      })
      return
    }

    try {
      onDirectApiLoading(true)

      const formData = new FormData()
      formData.append("serviceAccount", serviceAccountFile)
      formData.append("userEmail", userEmail)
      formData.append("operation", "list")

      console.log("Submitting to API route: /api/delegates")

      const response = await fetch("/api/delegates", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Server returned an error: ${response.status} ${response.statusText}`)
      }

      onDirectApiResult([data])

      toast({
        title: "Operation successful",
        description: "Delegates retrieved successfully",
      })
    } catch (err: any) {
      console.error("Error:", err)
      onDirectApiError(err.message || "An unexpected error occurred")

      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      onDirectApiLoading(false)
    }
  }

  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single">Single Operation</TabsTrigger>
        <TabsTrigger value="batch">Batch Operations</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        {operation === "list" && (
          <div className="mb-6 mt-4 p-4 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-900/20">
            <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-2">Recommended: Use Direct API</h3>
            <p className="text-sm mb-4">This is a simplified API that directly lists delegates.</p>
            <Button
              type="button"
              variant="default"
              onClick={handleDirectApiClick}
              disabled={isLoading}
              className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "USE DIRECT API (CLICK HERE)"
              )}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Operation</Label>
            <RadioGroup defaultValue="list" value={operation} onValueChange={setOperation} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list" />
                <Label htmlFor="list" className="cursor-pointer">
                  List Delegates
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="cursor-pointer">
                  Add Delegate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove" className="cursor-pointer">
                  Remove Delegate
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Mailbox Email</Label>
            <Input
              id="user-email"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="shared@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">The email address of the shared mailbox</p>
          </div>

          {operation !== "list" && (
            <div className="space-y-2">
              <Label htmlFor="delegate-email">Delegate Email</Label>
              <Input
                id="delegate-email"
                type="email"
                value={delegateEmail}
                onChange={(e) => setDelegateEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                The email address of the user who will {operation === "add" ? "receive" : "lose"} access
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="debug-mode"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="debug-mode" className="text-sm">
              Debug Mode (logs form data to console)
            </Label>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Button type="submit" disabled={!authMethod || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : operation === "list" ? (
                "List Delegates"
              ) : operation === "add" ? (
                "Add Delegate"
              ) : (
                "Remove Delegate"
              )}
            </Button>
          </div>
        </form>

        <Alert className="mt-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
          <AlertDescription className="text-xs">
            Debug Mode is enabled by default. Check the browser console (F12) for detailed logs.
            {operation === "list" && (
              <div className="mt-1">
                <strong>Tip:</strong> If you're having trouble with the List operation, try the "USE DIRECT API" button
                above.
              </div>
            )}
          </AlertDescription>
        </Alert>
      </TabsContent>

      <TabsContent value="batch">
        <form onSubmit={handleSubmit} data-mode="batch" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-emails">Batch Operations</Label>
            <Textarea
              id="batch-emails"
              value={batchEmails}
              onChange={(e) => setBatchEmails(e.target.value)}
              placeholder="operation,userEmail,delegateEmail (one per line)"
              rows={8}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Format: operation,userEmail,delegateEmail (one per line)</p>
              <p>Example:</p>
              <pre className="bg-muted p-2 rounded text-xs">
                add,shared@example.com,user1@example.com
                <br />
                add,shared@example.com,user2@example.com
                <br />
                remove,shared@example.com,user3@example.com
                <br />
                list,shared@example.com,
              </pre>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="debug-mode-batch"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="debug-mode-batch" className="text-sm">
              Debug Mode (logs form data to console)
            </Label>
          </div>

          <Separator className="my-4" />

          <Button type="submit" disabled={!authMethod || isLoading || !batchEmails.trim()} className="w-full">
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing Batch...
              </>
            ) : (
              "Process Batch Operations"
            )}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  )
}
