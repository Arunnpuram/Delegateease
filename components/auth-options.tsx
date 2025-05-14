"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ServiceAccountUpload from "./service-account-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AuthOptionsProps } from "@/types"

export default function AuthOptions({ onServiceAccountUploaded, onOAuthComplete }: AuthOptionsProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const handleOAuthClick = () => {
    setIsAuthenticating(true)

    // Simulate OAuth flow
    setTimeout(() => {
      setIsAuthenticating(false)
      onOAuthComplete()
    }, 2000)
  }

  return (
    <Tabs defaultValue="service-account" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="service-account">Service Account</TabsTrigger>
        <TabsTrigger value="oauth">OAuth 2.0</TabsTrigger>
      </TabsList>

      <TabsContent value="service-account" className="space-y-4">
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
          <AlertDescription>
            Upload your Google service account JSON key file to authenticate with domain-wide delegation.
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-medium mb-2">Prerequisites:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Create a service account in Google Cloud Console</li>
            <li>Enable domain-wide delegation for the service account</li>
            <li>Download the JSON key file</li>
            <li>Configure the required OAuth scopes in Google Workspace admin console</li>
          </ol>
        </div>

        <ServiceAccountUpload onServiceAccountUploaded={onServiceAccountUploaded} />
      </TabsContent>

      <TabsContent value="oauth" className="space-y-4">
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
          <AlertDescription>
            Authenticate with your Google account using OAuth 2.0. This requires admin privileges.
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <h4 className="text-sm font-medium mb-2">Prerequisites:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Configure OAuth consent screen in Google Cloud Console</li>
            <li>Create OAuth client ID credentials</li>
            <li>Configure the application with your client ID and secret</li>
            <li>You must have admin privileges in Google Workspace</li>
          </ol>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleOAuthClick} className="w-full max-w-xs" disabled={isAuthenticating}>
            {isAuthenticating ? (
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
                Authenticating...
              </>
            ) : (
              "Sign in with Google"
            )}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
