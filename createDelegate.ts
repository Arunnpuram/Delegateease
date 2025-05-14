// Script to Give delegated access to a user account for a shared mailbox via Gmail API
// https://developers.google.com/gmail/api/reference/rest/v1/users.settings.delegates/create

import { readFileSync } from "fs"
import { createGmailClient, listDelegates } from "./utils/gmail-integration"

async function addDelegateAccount(
  serviceAccountFile: string,
  userEmails: string,
  delegateEmails: string
): Promise<void> {
  try {
    // Split email strings into arrays for Inputting Multiple emails or inboxes at once
    const userEmailArray = userEmails.split(",").map((email) => email.trim())
    const delegateEmailArray = delegateEmails.split(",").map((email) => email.trim())

    console.log("Loading service account key file...")
    // Load the service account key file
    const key = JSON.parse(readFileSync(serviceAccountFile, "utf8"))
    console.log("Service account key file loaded successfully.")

    for (const userEmail of userEmailArray) {
      console.log(`Creating Gmail client for user: ${userEmail}...`)
      // Create Gmail client using centralized function
      const gmail = await createGmailClient(key, userEmail)
      if (!gmail) {
        console.error(`Failed to create Gmail client for ${userEmail}. Skipping.`)
        continue
      }
      console.log("Gmail client created successfully.")

      // Process each delegate email one by one
      for (const delegateEmail of delegateEmailArray) {
        // Check if the delegate already exists
        console.log(`Checking if delegate (${delegateEmail}) already exists for user: ${userEmail}...`)
        const result = await listDelegates(gmail)
        const delegateExists = result.success && result.delegates?.some(
          (delegate) => delegate.delegateEmail === delegateEmail
        )

        if (delegateExists) {
          console.log(`Delegate ${delegateEmail} already exists for ${userEmail}. Skipping.`)
          continue // Skip to next delegate if already exists
        }

        // Create the delegate
        console.log(`Attempting to create delegate (${delegateEmail}) for user: ${userEmail}...`)
        try {
          const res = await gmail.users.settings.delegates.create({
            userId: "me", // 'me' refers to the impersonated user
            requestBody: {
              delegateEmail,
            },
          })
          console.log(`Delegate ${delegateEmail} added successfully to ${userEmail}.`)
          console.log("Response:", res.data)
        } catch (error: any) {
          console.error(`Error adding delegate (${delegateEmail}) to ${userEmail}:`, error)
          if (error.response) {
            console.error("Error response:", error.response.data)
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Error adding user accounts as delegatees:", error)
    if (error.response) {
      console.error("Error response:", error.response.data)
    }
    console.error("Error stack:", error.stack)
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2)
  const paramsIndex = args.indexOf("--params")
  
  if (paramsIndex === -1 || paramsIndex === args.length - 1) {
    console.error("Please provide a params file using --params")
    process.exit(1)
  }

  const paramsFile = args[paramsIndex + 1]
  const params = JSON.parse(readFileSync(paramsFile, "utf8"))

  addDelegateAccount(
    params.serviceAccountFile,
    params.userEmails,
    params.delegateEmails
  ).catch((error) => {
    console.error("Script execution failed:", error)
    process.exit(1)
  })
}
