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

const execPromise = promisify(exec)

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
      if (operation === "add") {
        // Execute the createDelegate.ts script
        const scriptPath = path.join(process.cwd(), "createDelegate.ts")

        // Create a temporary JSON file with the required parameters
        const paramsPath = path.join(os.tmpdir(), `params_${Date.now()}.json`)
        fs.writeFileSync(
          paramsPath,
          JSON.stringify({
            serviceAccountFile: tempFilePath,
            userEmails: userEmail,
            delegateEmails: delegateEmail,
          }),
        )

        try {
          // Execute the script with ts-node
          const { stdout, stderr } = await execPromise(`npx ts-node ${scriptPath} --params ${paramsPath}`)

          if (stderr && !stderr.includes("ExperimentalWarning")) {
            console.error("Script error:", stderr)
            return {
              success: false,
              userEmail,
              delegateEmail: delegateEmail!,
              operation: "add",
              message: "Error executing script",
              details: stderr,
            }
          }

          // Parse the output to determine success
          const success = !stdout.includes("Error")

          return {
            success,
            userEmail,
            delegateEmail: delegateEmail!,
            operation: "add",
            message: success
              ? `Delegate ${delegateEmail} added successfully to ${userEmail}.`
              : "Failed to add delegate. Check the details for more information.",
            details: stdout,
          }
        } finally {
          // Clean up the params file
          if (fs.existsSync(paramsPath)) {
            fs.unlinkSync(paramsPath)
          }
        }
      } else if (operation === "remove") {
        // Execute the deleteDelegate.ts script
        const scriptPath = path.join(process.cwd(), "deleteDelegate.ts")

        // Create a temporary JSON file with the required parameters
        const paramsPath = path.join(os.tmpdir(), `params_${Date.now()}.json`)
        fs.writeFileSync(
          paramsPath,
          JSON.stringify({
            serviceAccountFile: tempFilePath,
            userEmails: userEmail,
            delegateEmails: delegateEmail,
          }),
        )

        try {
          // Execute the script with ts-node
          const { stdout, stderr } = await execPromise(`npx ts-node ${scriptPath} --params ${paramsPath}`)

          if (stderr && !stderr.includes("ExperimentalWarning")) {
            console.error("Script error:", stderr)
            return {
              success: false,
              userEmail,
              delegateEmail: delegateEmail!,
              operation: "remove",
              message: "Error executing script",
              details: stderr,
            }
          }

          // Parse the output to determine success
          const success = !stdout.includes("Error")

          return {
            success,
            userEmail,
            delegateEmail: delegateEmail!,
            operation: "remove",
            message: success
              ? `Delegate ${delegateEmail} removed successfully from ${userEmail}.`
              : "Failed to remove delegate. Check the details for more information.",
            details: stdout,
          }
        } finally {
          // Clean up the params file
          if (fs.existsSync(paramsPath)) {
            fs.unlinkSync(paramsPath)
          }
        }
      } else {
        // List operation - use the Gmail API directly
        // Read the service account file
        const serviceAccountContent = fs.readFileSync(tempFilePath, "utf8")
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
        const response = await gmail.users.settings.delegates.list({
          userId: "me", // 'me' refers to the impersonated user
        })

        return {
          success: true,
          userEmail,
          operation: "list",
          message: "Delegates retrieved successfully",
          delegates: response.data.delegates || [],
        }
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
    operation: string
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

  // Save the service account file to a temporary location
  const tempFilePath = await saveServiceAccountToTemp(serviceAccountFile)

  try {
    const results: OperationResult[] = []

    for (const op of operations) {
      if (op.operation === "add" || op.operation === "remove" || op.operation === "list") {
        try {
          // Create a temporary JSON file with the required parameters
          const paramsPath = path.join(
            os.tmpdir(),
            `params_${Date.now()}_${Math.random().toString(36).substring(7)}.json`,
          )

          fs.writeFileSync(
            paramsPath,
            JSON.stringify({
              serviceAccountFile: tempFilePath,
              userEmails: op.userEmail,
              delegateEmails: op.delegateEmail || "",
            }),
          )

          try {
            if (op.operation === "list") {
              // For list operation, use the Gmail API directly
              const serviceAccountContent = fs.readFileSync(tempFilePath, "utf8")
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
                op.userEmail,
              )

              // Create the Gmail API client
              const gmail = google.gmail({ version: "v1", auth })

              // List delegates
              const response = await gmail.users.settings.delegates.list({
                userId: "me",
              })

              results.push({
                success: true,
                userEmail: op.userEmail,
                operation: "list",
                message: "Delegates retrieved successfully",
                delegates: response.data.delegates || [],
              })
            } else {
              // Execute the appropriate script
              const scriptPath = path.join(
                process.cwd(),
                op.operation === "add" ? "createDelegate.ts" : "deleteDelegate.ts",
              )

              // Execute the script with ts-node
              const { stdout, stderr } = await execPromise(`npx ts-node ${scriptPath} --params ${paramsPath}`)

              if (stderr && !stderr.includes("ExperimentalWarning")) {
                console.error("Script error:", stderr)
                results.push({
                  success: false,
                  userEmail: op.userEmail,
                  delegateEmail: op.delegateEmail,
                  operation: op.operation,
                  message: "Error executing script",
                  details: stderr,
                })
              } else {
                // Parse the output to determine success
                const success = !stdout.includes("Error")

                results.push({
                  success,
                  userEmail: op.userEmail,
                  delegateEmail: op.delegateEmail,
                  operation: op.operation,
                  message: success
                    ? op.operation === "add"
                      ? `Delegate ${op.delegateEmail} added successfully to ${op.userEmail}.`
                      : `Delegate ${op.delegateEmail} removed successfully from ${op.userEmail}.`
                    : `Failed to ${op.operation} delegate. Check the details for more information.`,
                  details: stdout,
                })
              }
            }
          } finally {
            // Clean up the params file
            if (fs.existsSync(paramsPath)) {
              fs.unlinkSync(paramsPath)
            }
          }
        } catch (opError: any) {
          results.push({
            success: false,
            userEmail: op.userEmail,
            delegateEmail: op.delegateEmail,
            operation: op.operation,
            message: opError.message || `Error during ${op.operation} operation`,
            details: opError.stack,
          })
        }
      } else {
        results.push({
          success: false,
          userEmail: op.userEmail,
          delegateEmail: op.delegateEmail,
          operation: op.operation,
          message: `Invalid operation type: ${op.operation}`,
        })
      }
    }

    return results
  } finally {
    // Clean up the temporary service account file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  }
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
