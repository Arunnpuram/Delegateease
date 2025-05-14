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
import { useDelegateFormHandler } from "@/hooks/useDelegateFormHandler"

export default function DelegateForm({
  authMethod,
  serviceAccountFile,
  onSubmit,
  isLoading,
  onDirectApiResult,
  onDirectApiError,
  onDirectApiLoading,
}: DelegateFormProps) {
  const {
    operation,
    setOperation,
    userEmail,
    setUserEmail,
    delegateEmail,
    setDelegateEmail,
    batchMode,
    setBatchMode,
    batchEmails,
    setBatchEmails,
    isSubmitting,
    showConfirmation,
    setShowConfirmation,
    handleSubmit,
    parseBatchOperations,
  } = useDelegateFormHandler({
    onSubmit: (formData, endpoint) => onSubmit(formData, endpoint),
    serviceAccountFile,
    authMethod: typeof authMethod === "string" ? authMethod : "",
  })

  const [batchInput, setBatchInput] = useState("")

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

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Operation Type</Label>
            <RadioGroup
              value={operation}
              onValueChange={(value: string) => setOperation(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add">Add Delegate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove">Remove Delegate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list" />
                <Label htmlFor="list">List Delegates</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>User Email</Label>
            <Input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-4">
            <Label>Delegate Email</Label>
            <Input
              type="email"
              value={delegateEmail}
              onChange={(e) => setDelegateEmail(e.target.value)}
              placeholder="delegate@example.com"
            />
          </div>

          <div className="space-y-4">
            <Label>Batch Operations</Label>
            <Textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder="operation,userEmail,delegateEmail (one per line)"
              className="min-h-[100px]"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Processing...
              </div>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
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
