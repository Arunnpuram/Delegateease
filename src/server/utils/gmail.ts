import { google, type gmail_v1 } from "googleapis"
import fs from "fs"
import path from "path"
import os from "os"

// Interface for delegate operations
export interface DelegateOperation {
  userEmail: string
  delegateEmail: string
  operation: "add" | "remove" | "list"
}

// Interface for operation results
export interface OperationResult {
  success: boolean
  userEmail: string
  delegateEmail?: string
  operation: string
  message: string
  details?: any
}

// Function to create Gmail API client
export async function createGmailClient(serviceAccountJson: string, userEmail: string): Promise<gmail_v1.Gmail | null> {
  try {
    // Parse the service account JSON
    const key = JSON.parse(serviceAccountJson)

    // Configure Google Auth
    const auth = new google.auth.JWT(
      key.client_email,
      undefined,
      key.private_key,
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
      return null
    }
  } catch (error: any) {
    console.error("Error creating Gmail client:", error)
    return null
  }
}

// Function to list delegates for a user
export async function listDelegates(gmail: gmail_v1.Gmail): Promise<gmail_v1.Schema$Delegate[]> {
  try {
    const response = await gmail.users.settings.delegates.list({
      userId: "me", // 'me' refers to the impersonated user
    })
    return response.data.delegates || []
  } catch (error: any) {
    console.error("Error listing delegates:", error)
    return []
  }
}

// Function to add a delegate
export async function addDelegate(gmail: gmail_v1.Gmail, delegateEmail: string): Promise<OperationResult> {
  try {
    // Check if the delegate already exists
    const delegates = await listDelegates(gmail)
    const delegateExists = delegates.some((delegate) => delegate.delegateEmail === delegateEmail)

    if (delegateExists) {
      return {
        success: false,
        userEmail: "me",
        delegateEmail,
        operation: "add",
        message: "Delegate already exists",
      }
    }

    // Create the delegate
    const requestBody: gmail_v1.Schema$Delegate = {
      delegateEmail: delegateEmail,
    }

    const res = await gmail.users.settings.delegates.create({
      userId: "me",
      requestBody: requestBody,
    })

    return {
      success: true,
      userEmail: "me",
      delegateEmail,
      operation: "add",
      message: "Delegate added successfully",
      details: res.data,
    }
  } catch (error: any) {
    return {
      success: false,
      userEmail: "me",
      delegateEmail,
      operation: "add",
      message: error.message || "Error adding delegate",
      details: error.response?.data,
    }
  }
}

// Function to remove a delegate
export async function removeDelegate(gmail: gmail_v1.Gmail, delegateEmail: string): Promise<OperationResult> {
  try {
    // Check if the delegate exists
    const delegates = await listDelegates(gmail)
    const delegateExists = delegates.some((delegate) => delegate.delegateEmail === delegateEmail)

    if (!delegateExists) {
      return {
        success: false,
        userEmail: "me",
        delegateEmail,
        operation: "remove",
        message: "Delegate does not exist",
      }
    }

    // Delete the delegate
    await gmail.users.settings.delegates.delete({
      userId: "me",
      delegateEmail: delegateEmail,
    })

    return {
      success: true,
      userEmail: "me",
      delegateEmail,
      operation: "remove",
      message: "Delegate removed successfully",
    }
  } catch (error: any) {
    return {
      success: false,
      userEmail: "me",
      delegateEmail,
      operation: "remove",
      message: error.message || "Error removing delegate",
      details: error.response?.data,
    }
  }
}

// Function to save service account temporarily
export async function saveServiceAccount(serviceAccountJson: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), "delegateease")

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  // Generate a unique filename
  const filename = `sa_${Date.now()}.json`
  const filepath = path.join(tempDir, filename)

  // Write the file
  fs.writeFileSync(filepath, serviceAccountJson)

  return filepath
}

// Function to clean up temporary service account files
export function cleanupServiceAccount(filepath: string): void {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
  } catch (error) {
    console.error("Error cleaning up service account file:", error)
  }
}
