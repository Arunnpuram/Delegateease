"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { useDelegateFormHandler } from "@/hooks/useDelegateFormHandler"

interface DelegateFormProps {
  serviceAccountFile: File | null
  onSubmit: (formData: FormData) => Promise<void>
}

const DelegateForm: React.FC<DelegateFormProps> = ({ serviceAccountFile, onSubmit }) => {
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
    onSubmit,
    serviceAccountFile,
    authMethod: "service-account",
    debugMode: false,
  })

  return (
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

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="batch-mode"
          checked={batchMode}
          onChange={(e) => setBatchMode(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label htmlFor="batch-mode" className="text-sm">
          Batch Mode
        </Label>
      </div>

      {batchMode ? (
        <div className="space-y-2">
          <Label htmlFor="batch-emails">Batch Operations</Label>
          <Textarea
            id="batch-emails"
            value={batchEmails}
            onChange={(e) => setBatchEmails(e.target.value)}
            placeholder="operation,userEmail,delegateEmail (one per line)"
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            Format: operation,userEmail,delegateEmail (one per line)
            <br />
            Example: add,shared@example.com,user@example.com
          </p>
        </div>
      ) : (
        <>
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
            </div>
          )}
        </>
      )}

      <Separator className="my-4" />

      <Button type="submit" disabled={!serviceAccountFile || isSubmitting} className="w-full">
        {isSubmitting ? (
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
        ) : operation === "list" ? (
          "List Delegates"
        ) : operation === "add" ? (
          "Add Delegate"
        ) : (
          "Remove Delegate"
        )}
      </Button>
    </form>
  )
}

export default DelegateForm
