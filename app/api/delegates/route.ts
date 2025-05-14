import { type NextRequest, NextResponse } from "next/server"
import { google, type gmail_v1 } from "googleapis"
import { ServiceAccountManager } from "../../../utils/service-account"
import { listDelegates as listDelegatesFromGmail, createGmailClient as createGmailClientFromUtils } from "../../../utils/gmail-integration"
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
    const serviceAccount = await ServiceAccountManager.readFile(serviceAccountPath)

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
  try {
    const formData = await request.formData()
    const serviceAccountFile = formData.get("serviceAccountFile") as File
    const userEmail = formData.get("userEmail") as string
    const delegateEmail = formData.get("delegateEmail") as string

    if (!serviceAccountFile || !userEmail || !delegateEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    // Save service account file temporarily
    const filepath = await ServiceAccountManager.saveFile(serviceAccountFile)

    try {
      // Read service account file
      const serviceAccount = await ServiceAccountManager.readFile(filepath)

      // Create Gmail client
      const gmail = await createGmailClientFromUtils(serviceAccount, userEmail)
      if (!gmail) {
        return NextResponse.json(
          { error: "Failed to create Gmail client" },
          { status: 500 },
        )
      }

      // List existing delegates
      const listResult = await listDelegatesFromGmail(gmail)
      if (!listResult.success) {
        return NextResponse.json(
          { error: listResult.message },
          { status: 500 },
        )
      }

      // Check if delegate already exists
      const existingDelegate = listResult.delegates?.find(
        (d) => d.delegateEmail === delegateEmail,
      )
      if (existingDelegate) {
        return NextResponse.json(
          { error: "Delegate already exists" },
          { status: 400 },
        )
      }

      // Add delegate
      await gmail.users.settings.delegates.create({
        userId: "me",
        requestBody: {
          delegateEmail,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Delegate added successfully",
      })
    } finally {
      // Clean up service account file
      await ServiceAccountManager.cleanupFile(filepath)
    }
  } catch (error: any) {
    console.error("Error in POST /api/delegates:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const formData = await request.formData()
    const serviceAccountFile = formData.get("serviceAccountFile") as File
    const userEmail = formData.get("userEmail") as string
    const delegateEmail = formData.get("delegateEmail") as string

    if (!serviceAccountFile || !userEmail || !delegateEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    // Save service account file temporarily
    const filepath = await ServiceAccountManager.saveFile(serviceAccountFile)

    try {
      // Read service account file
      const serviceAccount = await ServiceAccountManager.readFile(filepath)

      // Create Gmail client
      const gmail = await createGmailClientFromUtils(serviceAccount, userEmail)
      if (!gmail) {
        return NextResponse.json(
          { error: "Failed to create Gmail client" },
          { status: 500 },
        )
      }

      // List existing delegates
      const listResult = await listDelegatesFromGmail(gmail)
      if (!listResult.success) {
        return NextResponse.json(
          { error: listResult.message },
          { status: 500 },
        )
      }

      // Check if delegate exists
      const existingDelegate = listResult.delegates?.find(
        (d) => d.delegateEmail === delegateEmail,
      )
      if (!existingDelegate) {
        return NextResponse.json(
          { error: "Delegate does not exist" },
          { status: 400 },
        )
      }

      // Remove delegate
      await gmail.users.settings.delegates.delete({
        userId: "me",
        delegateEmail,
      })

      return NextResponse.json({
        success: true,
        message: "Delegate removed successfully",
      })
    } finally {
      // Clean up service account file
      await ServiceAccountManager.cleanupFile(filepath)
    }
  } catch (error: any) {
    console.error("Error in DELETE /api/delegates:", error)
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: error.stack,
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
