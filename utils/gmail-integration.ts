/**
 * This file serves as a bridge between the UI and the Gmail API.
 * It provides utility functions for Gmail delegation operations.
 */

import type { OperationResult } from "../types/delegates"
import { google, type gmail_v1 } from "googleapis"
import fs from "fs"
import path from "path"
import os from "os"
import { exec } from "child_process"
import { promisify } from "util"
import { ServiceAccountManager } from "./service-account"

const execPromise = promisify(exec)

/**
 * Create a Gmail API client
 * @param serviceAccount The service account JSON object
 * @param userEmail The email of the user to impersonate
 * @returns Promise<gmail_v1.Gmail | null> The Gmail API client or null if creation fails
 */
export async function createGmailClient(serviceAccount: any, userEmail: string): Promise<gmail_v1.Gmail | null> {
  try {
    // Configure Google Auth
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      undefined,
      serviceAccount.private_key,
      [
        "https://www.googleapis.com/auth/gmail.settings.sharing",
        "https://www.googleapis.com/auth/gmail.settings.basic",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
      userEmail,
    )

    // Verify token acquisition
    try {
      await auth.getAccessToken()
    } catch (tokenError: any) {
      console.error("Error obtaining access token:", tokenError)
      if (tokenError.response) {
        console.error("Token error response:", tokenError.response.data)
      }
      return null
    }

    // Create the Gmail API client
    const gmail: gmail_v1.Gmail = google.gmail({ version: "v1", auth })

    // Verify API access
    try {
      await gmail.users.getProfile({ userId: "me" })
      return gmail
    } catch (profileError: any) {
      console.error("Error accessing Gmail API:", profileError)
      if (profileError.response) {
        console.error("Profile error response:", profileError.response.data)
      }
      return null
    }
  } catch (error: any) {
    console.error("Error creating Gmail client:", error)
    return null
  }
}

/**
 * List delegates for a given Gmail client
 * @param gmail The Gmail API client
 * @returns Promise<OperationResult> The result of the operation
 */
export async function listDelegates(gmail: gmail_v1.Gmail): Promise<OperationResult> {
  try {
    const response = await gmail.users.settings.delegates.list({
      userId: "me", // 'me' refers to the impersonated user
    })

    return {
      success: true,
      operation: "list",
      message: "Delegates retrieved successfully",
      delegates: response.data.delegates?.map(delegate => ({
        delegateEmail: delegate.delegateEmail || undefined,
        verificationStatus: delegate.verificationStatus || undefined
      })) || [],
    }
  } catch (error: any) {
    console.error("Error listing delegates:", error)
    if (error.response) {
      console.error("List delegates error response:", error.response.data)
    }
    return {
      success: false,
      operation: "list",
      message: error.message || "Error listing delegates",
      details: error.response?.data || error.stack,
    }
  }
}

/**
 * Process a single delegation operation
 */
export async function processDelegateOperation(
  operation: "add" | "remove" | "list",
  userEmail: string,
  delegateEmail?: string,
  serviceAccountFile?: File,
): Promise<OperationResult> {
  try {
    if (!serviceAccountFile) {
      throw new Error("Service account file is required")
    }

    // Save the service account file to a temporary location
    const tempFilePath = await saveServiceAccountToTemp(serviceAccountFile)

    try {
      // Read service account file
      const serviceAccount = await ServiceAccountManager.readFile(tempFilePath)

      // Create Gmail client
      const gmail = await createGmailClient(serviceAccount, userEmail)
      if (!gmail) {
        return {
          success: false,
          userEmail,
          delegateEmail,
          operation,
          message: "Failed to create Gmail client",
        }
      }

      if (operation === "list") {
        return await listDelegates(gmail)
      }

      // For add/remove operations, check if delegate exists
      const listResult = await listDelegates(gmail)
      if (!listResult.success) {
        return listResult
      }

      const delegateExists = listResult.delegates?.some(
        (d) => d.delegateEmail === delegateEmail
      )

      if (operation === "add") {
        if (delegateExists) {
          return {
            success: false,
            userEmail,
            delegateEmail,
            operation,
            message: `Delegate ${delegateEmail} already exists`,
          }
        }

        await gmail.users.settings.delegates.create({
          userId: "me",
          requestBody: {
            delegateEmail,
          },
        })

        return {
          success: true,
          userEmail,
          delegateEmail,
          operation,
          message: `Delegate ${delegateEmail} added successfully`,
        }
      } else if (operation === "remove") {
        if (!delegateExists) {
          return {
            success: false,
            userEmail,
            delegateEmail,
            operation,
            message: `Delegate ${delegateEmail} does not exist`,
          }
        }

        await gmail.users.settings.delegates.delete({
          userId: "me",
          delegateEmail,
        })

        return {
          success: true,
          userEmail,
          delegateEmail,
          operation,
          message: `Delegate ${delegateEmail} removed successfully`,
        }
      }

      return {
        success: false,
        userEmail,
        delegateEmail,
        operation,
        message: `Invalid operation: ${operation}`,
      }
    } finally {
      // Clean up the temporary service account file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  } catch (error: any) {
    console.error("Operation error:", error)
    return {
      success: false,
      userEmail,
      delegateEmail,
      operation,
      message: error.message || "An error occurred during the operation",
      details: error.stack,
    }
  }
}

/**
 * Process batch delegation operations
 */
export async function processBatchOperations(
  operations: Array<{
    operation: "add" | "remove" | "list"
    userEmail: string
    delegateEmail?: string
  }>,
  serviceAccountFile?: File,
): Promise<OperationResult[]> {
  if (!serviceAccountFile) {
    return operations.map((op) => ({
      success: false,
      userEmail: op.userEmail,
      delegateEmail: op.delegateEmail,
      operation: op.operation,
      message: "Service account file is required",
    }))
  }

  const results: OperationResult[] = []

  for (const op of operations) {
    const result = await processDelegateOperation(
      op.operation,
      op.userEmail,
      op.delegateEmail,
      serviceAccountFile,
    )
    results.push(result)
  }

  return results
}

/**
 * Save a File object to a temporary file
 */
async function saveServiceAccountToTemp(file: File): Promise<string> {
  // Create a temporary directory if it doesn't exist
  const tempDir = path.join(os.tmpdir(), "delegateease")
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  // Generate a unique filename
  const tempFilePath = path.join(tempDir, `sa_${Date.now()}_${Math.random().toString(36).substring(7)}.json`)

  // Convert File to Buffer and write to disk
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  fs.writeFileSync(tempFilePath, buffer)

  return tempFilePath
}

/**
 * Helper function to read a file as text
 */
export async function readFileAsText(file?: File): Promise<string> {
  if (!file) {
    throw new Error("No file provided")
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
