import { type NextRequest, NextResponse } from "next/server"
import { google, type gmail_v1 } from "googleapis"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { promises as fsPromises } from "fs"
import { exec } from "child_process"
import { promisify } from "util"

const execPromise = promisify(exec)

// Helper function to save service account file temporarily
async function saveServiceAccountFile(file: File): Promise<string> {
  const tempFilePath = join(tmpdir(), `sa_${randomUUID()}.json`)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await writeFile(tempFilePath, buffer)
  return tempFilePath
}

// Helper function to clean up temporary files
async function cleanupFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch (error) {
    console.error("Error cleaning up file:", error)
  }
}

// Helper function to create Gmail client
async function createGmailClient(serviceAccountPath: string, userEmail: string): Promise<gmail_v1.Gmail | null> {
  try {
    const serviceAccountContent = await fsPromises.readFile(serviceAccountPath, "utf-8")
    const serviceAccount = JSON.parse(serviceAccountContent)

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

    const gmail: gmail_v1.Gmail = google.gmail({ version: "v1", auth })
    return gmail
  } catch (error) {
    console.error("Error creating Gmail client:", error)
    return null
  }
}

// List delegates operation
async function listDelegates(gmail: gmail_v1.Gmail): Promise<any> {
  try {
    const response = await gmail.users.settings.delegates.list({
      userId: "me",
    })
    return {
      success: true,
      delegates: response.data.delegates || [],
    }
  } catch (error: any) {
    console.error("Error listing delegates:", error)
    return {
      success: false,
      message: error.message || "Error listing delegates",
      error: String(error),
    }
  }
}

// Add delegate operation using direct Gmail API
async function addDelegateDirectly(gmail: gmail_v1.Gmail, delegateEmail: string): Promise<any> {
  try {
    // Check if delegate already exists
    const listResult = await listDelegates(gmail)
    if (listResult.success && listResult.delegates) {
      const delegateExists = listResult.delegates.some((delegate: any) => delegate.delegateEmail === delegateEmail)

      if (delegateExists) {
        return {
          success: false,
          message: `Delegate ${delegateEmail} already exists`,
        }
      }
    }

    // Add delegate
    const response = await gmail.users.settings.delegates.create({
      userId: "me",
      requestBody: {
        delegateEmail: delegateEmail,
      },
    })

    return {
      success: true,
      message: `Delegate ${delegateEmail} added successfully`,
      details: response.data,
    }
  } catch (error: any) {
    console.error("Error adding delegate:", error)
    return {
      success: false,
      message: error.message || "Error adding delegate",
      error: String(error),
    }
  }
}

// Remove delegate operation using direct Gmail API
async function removeDelegateDirectly(gmail: gmail_v1.Gmail, delegateEmail: string): Promise<any> {
  try {
    // Check if delegate exists
    const listResult = await listDelegates(gmail)
    if (listResult.success && listResult.delegates) {
      const delegateExists = listResult.delegates.some((delegate: any) => delegate.delegateEmail === delegateEmail)

      if (!delegateExists) {
        return {
          success: false,
          message: `Delegate ${delegateEmail} does not exist`,
        }
      }
    }

    // Remove delegate
    await gmail.users.settings.delegates.delete({
      userId: "me",
      delegateEmail: delegateEmail,
    })

    return {
      success: true,
      message: `Delegate ${delegateEmail} removed successfully`,
    }
  } catch (error: any) {
    console.error("Error removing delegate:", error)
    return {
      success: false,
      message: error.message || "Error removing delegate",
      error: String(error),
    }
  }
}

// Process batch operations
async function processBatch(serviceAccountPath: string, operations: any[]): Promise<any[]> {
  const results = []

  for (const op of operations) {
    const { operation, userEmail, delegateEmail } = op

    // Create Gmail client for this user
    const gmail = await createGmailClient(serviceAccountPath, userEmail)
    if (!gmail) {
      results.push({
        success: false,
        userEmail,
        operation,
        message: "Failed to create Gmail client",
      })
      continue
    }

    if (operation === "list") {
      const listResult = await listDelegates(gmail)
      results.push({
        ...listResult,
        userEmail,
        operation: "list",
        message: listResult.success ? "Delegates retrieved successfully" : listResult.message,
      })
    } else if (operation === "add") {
      const addResult = await addDelegateDirectly(gmail, delegateEmail)
      results.push({
        ...addResult,
        userEmail,
        delegateEmail,
        operation: "add",
      })
    } else if (operation === "remove") {
      const removeResult = await removeDelegateDirectly(gmail, delegateEmail)
      results.push({
        ...removeResult,
        userEmail,
        delegateEmail,
        operation: "remove",
      })
    } else {
      results.push({
        success: false,
        userEmail,
        delegateEmail,
        operation,
        message: `Invalid operation: ${operation}`,
      })
    }
  }

  return results
}

// Main API handler
export async function POST(request: NextRequest) {
  console.log("Delegates API called with POST method")

  try {
    // Parse the form data
    const formData = await request.formData()

    // Get the service account file
    const serviceAccountFile = formData.get("serviceAccount") as File
    if (!serviceAccountFile) {
      return NextResponse.json({ success: false, message: "Service account file is required" }, { status: 400 })
    }

    // Save service account file temporarily
    const serviceAccountPath = await saveServiceAccountFile(serviceAccountFile)

    try {
      // Check if this is a batch operation
      const operationsJson = formData.get("operations")
      if (operationsJson) {
        // Process batch operations
        const operations = JSON.parse(operationsJson as string)
        const results = await processBatch(serviceAccountPath, operations)

        return NextResponse.json({
          success: true,
          results,
        })
      }

      // Single operation
      const operation = (formData.get("operation") as string) || "list"
      const userEmail = formData.get("userEmail") as string

      if (!userEmail) {
        return NextResponse.json({ success: false, message: "User email is required" }, { status: 400 })
      }

      // Create Gmail client
      const gmail = await createGmailClient(serviceAccountPath, userEmail)
      if (!gmail) {
        return NextResponse.json({ success: false, message: "Failed to create Gmail client" }, { status: 500 })
      }

      if (operation === "list") {
        // List delegates
        const listResult = await listDelegates(gmail)
        return NextResponse.json({
          ...listResult,
          userEmail,
          operation: "list",
          message: listResult.success ? "Delegates retrieved successfully" : listResult.message,
        })
      } else if (operation === "add") {
        const delegateEmail = formData.get("delegateEmail") as string

        if (!delegateEmail) {
          return NextResponse.json({ success: false, message: "Delegate email is required" }, { status: 400 })
        }

        // Add delegate directly using the Gmail API
        const addResult = await addDelegateDirectly(gmail, delegateEmail)
        return NextResponse.json({
          ...addResult,
          userEmail,
          delegateEmail,
          operation: "add",
        })
      } else if (operation === "remove") {
        const delegateEmail = formData.get("delegateEmail") as string

        if (!delegateEmail) {
          return NextResponse.json({ success: false, message: "Delegate email is required" }, { status: 400 })
        }

        // Remove delegate directly using the Gmail API
        const removeResult = await removeDelegateDirectly(gmail, delegateEmail)
        return NextResponse.json({
          ...removeResult,
          userEmail,
          delegateEmail,
          operation: "remove",
        })
      } else {
        return NextResponse.json({ success: false, message: "Invalid operation" }, { status: 400 })
      }
    } finally {
      // Clean up the temporary service account file
      await cleanupFile(serviceAccountPath)
    }
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An unexpected error occurred",
        error: String(error),
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

// Also support GET requests for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Delegates API is working. Please use POST method with service account and operation details.",
    timestamp: new Date().toISOString(),
  })
}
