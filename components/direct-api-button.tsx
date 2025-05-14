"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

interface DirectApiButtonProps {
  serviceAccountFile: File | null
  userEmail: string
  onResult: (result: any) => void
  onError: (error: string) => void
  onLoading: (isLoading: boolean) => void
}

export default function DirectApiButton({
  serviceAccountFile,
  userEmail,
  onResult,
  onError,
  onLoading,
}: DirectApiButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
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
        title: "Missing information",
        description: "Please enter the mailbox email address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      onLoading(true)

      const formData = new FormData()
      formData.append("serviceAccount", serviceAccountFile)
      formData.append("userEmail", userEmail)

      console.log("Submitting direct API request")
      console.log("Form data keys:", Array.from(formData.keys()))

      // Call the direct API endpoint
      const response = await fetch("/api/delegates/direct-list", {
        method: "POST",
        body: formData,
      })

      // Get the raw response text first for debugging
      const responseText = await response.text()
      console.log("Raw API response:", responseText)

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

      onResult([data])

      toast({
        title: "Operation successful",
        description: "Delegates retrieved successfully using direct API",
      })
    } catch (err: any) {
      console.error("Error:", err)
      onError(err.message || "An unexpected error occurred")

      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      onLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={isLoading || !serviceAccountFile || !userEmail}
      className="mt-2"
    >
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
          Processing...
        </>
      ) : (
        "Use Direct API (Fallback)"
      )}
    </Button>
  )
}
