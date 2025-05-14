import { type NextRequest, NextResponse } from "next/server"
import { google, type gmail_v1 } from "googleapis"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"
import { randomUUID } from "crypto"
import { promises as fsPromises } from "fs"

export async function POST(request: NextRequest) {
  console.log("Simple list API called with POST method")

  try {
    // Parse the form data
    const formData = await request.formData()

    // Get the service account file
    const serviceAccountFile = formData.get("serviceAccount") as File
    if (!serviceAccountFile) {
      return NextResponse.json({ success: false, message: "Service account file is required" }, { status: 400 })
    }

    // Get the user email
    const userEmail = formData.get("userEmail") as string
    if (!userEmail) {
      return NextResponse.json({ success: false, message: "User email is required" }, { status: 400 })
    }

    console.log("Processing request for user email:", userEmail)

    // Create a temporary file for the service account
    const tempFilePath = join(tmpdir(), `sa_${randomUUID()}.json`)

    try {
      // Convert the File to an ArrayBuffer and then to a Buffer
      const arrayBuffer = await serviceAccountFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Write the service account file to disk
      await writeFile(tempFilePath, buffer)
      console.log("Service account file saved to:", tempFilePath)

      // Read the service account file
      const serviceAccountContent = await fsPromises.readFile(tempFilePath, "utf-8")
      const serviceAccount = JSON.parse(serviceAccountContent)

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

      // Create the Gmail API client
      const gmail: gmail_v1.Gmail = google.gmail({ version: "v1", auth })

      // List delegates
      console.log("Listing delegates...")
      try {
        const response = await gmail.users.settings.delegates.list({
          userId: "me", // 'me' refers to the impersonated user
        })

        console.log("Delegates response:", response.data)

        return NextResponse.json({
          success: true,
          userEmail,
          operation: "list",
          message: "Delegates retrieved successfully",
          delegates: response.data.delegates || [],
        })
      } catch (gmailError: any) {
        console.error("Gmail API error:", gmailError)
        return NextResponse.json(
          {
            success: false,
            message: gmailError.message || "Error listing delegates",
            error: String(gmailError),
            stack: gmailError.stack,
          },
          { status: 500 },
        )
      }
    } finally {
      // Clean up the temporary file
      try {
        await unlink(tempFilePath)
        console.log("Cleaned up service account file")
      } catch (cleanupError) {
        console.error("Error cleaning up service account file:", cleanupError)
      }
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
    message: "Simple list API is working. Please use POST method with service account and user email.",
    timestamp: new Date().toISOString(),
  })
}
