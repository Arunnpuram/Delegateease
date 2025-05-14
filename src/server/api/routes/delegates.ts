import express from "express"
import multer from "multer"
import fs from "fs"
import { createGmailClient, listDelegates, addDelegate, removeDelegate } from "../../utils/gmail"

const router = express.Router()
const upload = multer({ dest: "uploads/" })

// Endpoint to list delegates
router.post("/list", upload.single("serviceAccount"), async (req, res) => {
  try {
    const { userEmail } = req.body

    if (!req.file || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Service account file and user email are required",
      })
    }

    // Read the uploaded service account file
    const serviceAccountJson = fs.readFileSync(req.file.path, "utf8")

    // Create Gmail client
    const gmail = await createGmailClient(serviceAccountJson, userEmail)

    if (!gmail) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Gmail client",
      })
    }

    // List delegates
    const delegates = await listDelegates(gmail)

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    return res.status(200).json({
      success: true,
      userEmail,
      operation: "list",
      message: "Delegates retrieved successfully",
      delegates,
    })
  } catch (error: any) {
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Error listing delegates",
    })
  }
})

// Endpoint to add delegate
router.post("/add", upload.single("serviceAccount"), async (req, res) => {
  try {
    const { userEmail, delegateEmail } = req.body

    if (!req.file || !userEmail || !delegateEmail) {
      return res.status(400).json({
        success: false,
        message: "Service account file, user email, and delegate email are required",
      })
    }

    // Read the uploaded service account file
    const serviceAccountJson = fs.readFileSync(req.file.path, "utf8")

    // Create Gmail client
    const gmail = await createGmailClient(serviceAccountJson, userEmail)

    if (!gmail) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Gmail client",
      })
    }

    // Add delegate
    const result = await addDelegate(gmail, delegateEmail)

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    return res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Error adding delegate",
    })
  }
})

// Endpoint to remove delegate
router.post("/remove", upload.single("serviceAccount"), async (req, res) => {
  try {
    const { userEmail, delegateEmail } = req.body

    if (!req.file || !userEmail || !delegateEmail) {
      return res.status(400).json({
        success: false,
        message: "Service account file, user email, and delegate email are required",
      })
    }

    // Read the uploaded service account file
    const serviceAccountJson = fs.readFileSync(req.file.path, "utf8")

    // Create Gmail client
    const gmail = await createGmailClient(serviceAccountJson, userEmail)

    if (!gmail) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Gmail client",
      })
    }

    // Remove delegate
    const result = await removeDelegate(gmail, delegateEmail)

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    return res.status(result.success ? 200 : 400).json(result)
  } catch (error: any) {
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Error removing delegate",
    })
  }
})

// Endpoint to handle batch operations
router.post("/batch", upload.single("serviceAccount"), async (req, res) => {
  try {
    const { operations } = req.body

    if (!req.file || !operations) {
      return res.status(400).json({
        success: false,
        message: "Service account file and operations are required",
      })
    }

    // Parse operations
    const parsedOperations = JSON.parse(operations)

    if (!Array.isArray(parsedOperations) || parsedOperations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Operations must be a non-empty array",
      })
    }

    // Read the uploaded service account file
    const serviceAccountJson = fs.readFileSync(req.file.path, "utf8")

    // Process each operation
    const results = []

    for (const op of parsedOperations) {
      const { userEmail, delegateEmail, operation } = op

      if (!userEmail || !operation || (operation !== "list" && !delegateEmail)) {
        results.push({
          success: false,
          userEmail: userEmail || "unknown",
          operation: operation || "unknown",
          message: "Invalid operation parameters",
        })
        continue
      }

      // Create Gmail client for this user
      const gmail = await createGmailClient(serviceAccountJson, userEmail)

      if (!gmail) {
        results.push({
          success: false,
          userEmail,
          operation,
          message: "Failed to create Gmail client",
        })
        continue
      }

      // Perform the operation
      let result

      if (operation === "add") {
        result = await addDelegate(gmail, delegateEmail!)
      } else if (operation === "remove") {
        result = await removeDelegate(gmail, delegateEmail!)
      } else if (operation === "list") {
        const delegates = await listDelegates(gmail)
        result = {
          success: true,
          userEmail,
          operation: "list",
          message: "Delegates retrieved successfully",
          delegates,
        }
      } else {
        result = {
          success: false,
          userEmail,
          operation,
          message: "Invalid operation type",
        }
      }

      results.push(result)
    }

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    return res.status(200).json({
      success: true,
      results,
    })
  } catch (error: any) {
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Error processing batch operations",
    })
  }
})

export default router
