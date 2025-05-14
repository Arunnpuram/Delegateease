// Script to Give delegated access to a user account for a shared mailbox via Gmail API
// Use read-line to take command line arguments for user email address and delegated email inbox
// https://developers.google.com/gmail/api/reference/rest/v1/users.settings.delegates/create

import { google, type gmail_v1 } from "googleapis"
import { createInterface } from "readline"
import { readFileSync } from "fs"

// Function to prompt for input
function askQuestion(query: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close()
      resolve(ans)
    }),
  )
}

async function listDelegates(service: gmail_v1.Gmail, userEmail: string): Promise<gmail_v1.Schema$Delegate[]> {
  try {
    const response = await service.users.settings.delegates.list({
      userId: "me", // 'me' refers to the impersonated user
    })
    return response.data.delegates || []
  } catch (error: any) {
    console.error("Error listing delegates:", error)
    if (error.response) {
      console.error("List delegates error response:", error.response.data)
    }
    return []
  }
}

async function addDelegateAccount(): Promise<void> {
  try {
    // Prompt for the JSON key file path
    const serviceAccountFile = await askQuestion("Enter the file path to your service account JSON key file: ")
    const userEmails = await askQuestion("Enter the email(s) of the inbox(es) (comma-separated): ")
    const delegateEmails = await askQuestion(
      "Enter the email(s) of the employee(s) that need to be given delegated access to (comma-separated): ",
    )

    // Split email strings into arrays for Inputting Multiple emails or inboxes at once
    const userEmailArray = userEmails.split(",").map((email) => email.trim())
    const delegateEmailArray = delegateEmails.split(",").map((email) => email.trim())

    console.log("Loading service account key file...")
    // Load the service account key file
    const keyFile = readFileSync(serviceAccountFile, "utf8")
    const key = JSON.parse(keyFile)
    console.log("Service account key file loaded successfully.")

    for (const userEmail of userEmailArray) {
      console.log(`Configuring Google Auth for user: ${userEmail}...`)
      // Configure Google Auth for each user (mailbox)
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
      console.log("Attempting to obtain access token...")
      try {
        const token = await auth.getAccessToken()
        console.log("Access token obtained successfully")
      } catch (tokenError: any) {
        console.error("Error obtaining access token:", tokenError)
        if (tokenError.response) {
          console.error("Token error response:", tokenError.response.data)
        }
        continue // Skip to next userEmail if token acquisition fails
      }

      console.log("Creating Gmail API client...")
      // Create the Gmail API client
      const gmail: gmail_v1.Gmail = google.gmail({ version: "v1", auth })

      // Verify API access
      console.log("Verifying API access...")
      try {
        await gmail.users.getProfile({ userId: "me" })
        console.log("Successfully accessed Gmail API")
      } catch (profileError: any) {
        console.error("Error accessing Gmail API:", profileError)
        if (profileError.response) {
          console.error("Profile error response:", profileError.response.data)
        }
        console.error("Profile error stack:", profileError.stack)
        return // Exit the function if we can't access the API
      }

      // Process each delegate email one by one
      for (const delegateEmail of delegateEmailArray) {
        // Check if the delegate already exists
        console.log(`Checking if delegate (${delegateEmail}) already exists for user: ${userEmail}...`)
        const delegates = await listDelegates(gmail, userEmail)
        const delegateExists = delegates.some((delegate) => delegate.delegateEmail === delegateEmail)

        if (delegateExists) {
          console.log(`Delegate ${delegateEmail} already exists for ${userEmail}. Skipping.`)
          continue // Skip to next delegate if already exists
        }

        // Create the delegate
        console.log(`Attempting to create delegate (${delegateEmail}) for user: ${userEmail}...`)
        const requestBody: gmail_v1.Schema$Delegate = {
          delegateEmail: delegateEmail,
        }

        try {
          const res = await gmail.users.settings.delegates.create({
            userId: "me", // 'me' refers to the impersonated user
            requestBody: requestBody,
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

addDelegateAccount()
