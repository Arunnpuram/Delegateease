import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

export interface UseDelegateFormHandlerOptions {
  onSubmit: (formData: FormData, endpoint?: string) => Promise<void>
  serviceAccountFile: File | null | undefined
  authMethod?: string
  endpoint?: string
  debugMode?: boolean
}

export function useDelegateFormHandler({
  onSubmit,
  serviceAccountFile,
  authMethod,
  endpoint = "/api/delegates",
  debugMode = false,
}: UseDelegateFormHandlerOptions) {
  const [operation, setOperation] = useState<string>("list")
  const [userEmail, setUserEmail] = useState<string>("")
  const [delegateEmail, setDelegateEmail] = useState<string>("")
  const [batchMode, setBatchMode] = useState<boolean>(false)
  const [batchEmails, setBatchEmails] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)

  // Batch parsing utility
  const parseBatchOperations = (batch: string) => {
    return batch
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
  }

  // Unified submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const safeAuthMethod = authMethod || ""
    if (!safeAuthMethod) {
      toast({
        title: "Authentication required",
        description: "Please authenticate first",
        variant: "destructive",
      })
      return
    }

    if (!batchMode && !userEmail) {
      toast({
        title: "Missing information",
        description: "Please enter the mailbox email address",
        variant: "destructive",
      })
      return
    }

    if (!batchMode && (operation === "add" || operation === "remove") && !delegateEmail) {
      toast({
        title: "Missing information",
        description: "Please enter the delegate email address",
        variant: "destructive",
      })
      return
    }

    if (batchMode && !batchEmails.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter batch operations",
        variant: "destructive",
      })
      return
    }

    // For destructive operations, show confirmation dialog
    if ((operation === "remove" || (batchMode && batchEmails.includes("remove"))) && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    try {
      setIsSubmitting(true)
      const formData = new FormData()

      if (safeAuthMethod === "service-account" && serviceAccountFile) {
        formData.append("serviceAccount", serviceAccountFile)
      } else {
        toast({
          title: "Missing service account",
          description: "Service account file is required",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      formData.append("authMethod", safeAuthMethod)
      formData.append("operation", operation)

      if (batchMode) {
        try {
          const operations = parseBatchOperations(batchEmails)
          formData.append("operations", JSON.stringify(operations))
        } catch (error) {
          toast({
            title: "Invalid format",
            description: "Please check your batch operations format",
            variant: "destructive",
          })
          setIsSubmitting(false)
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
        Array.from(formData.entries()).forEach(([key, value]) => {
          console.log(`${key}: ${value}`)
        })
      }

      await onSubmit(formData, endpoint)

      // Reset form if successful
      if (!batchMode) {
        if (operation !== "list") {
          setDelegateEmail("")
        }
      } else {
        setBatchEmails("")
      }
      setShowConfirmation(false)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
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
  }
} 