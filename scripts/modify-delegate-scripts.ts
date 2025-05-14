import fs from "fs"
import path from "path"

// Paths to the original scripts
const createDelegatePath = path.join(process.cwd(), "createDelegate.ts")
const deleteDelegatePath = path.join(process.cwd(), "deleteDelegate.ts")

// Read the original scripts
const createDelegateContent = fs.readFileSync(createDelegatePath, "utf8")
const deleteDelegateContent = fs.readFileSync(deleteDelegatePath, "utf8")

// Function to modify the script to accept parameters from a file
function modifyScript(content: string, scriptName: string) {
  // Check if the script has already been modified
  if (content.includes("// Modified for web interface")) {
    console.log(`${scriptName} has already been modified.`)
    return content
  }

  // Add imports for command line arguments
  const importSection = `import { readFileSync } from "fs"
import { join } from "path"

// Modified for web interface
function parseCommandLineArgs() {
  const args = process.argv.slice(2)
  const paramsIndex = args.indexOf('--params')
  
  if (paramsIndex !== -1 && paramsIndex + 1 < args.length) {
    const paramsPath = args[paramsIndex + 1]
    try {
      const paramsContent = readFileSync(paramsPath, 'utf8')
      return JSON.parse(paramsContent)
    } catch (error) {
      console.error('Error reading params file:', error)
      process.exit(1)
    }
  }
  
  return null
}

const params = parseCommandLineArgs()
`

  // Replace the askQuestion function with a version that uses params if available
  const modifiedAskQuestion = `function askQuestion(query: string, paramKey?: string): Promise<string> {
  // If params are provided and the key exists, use that value
  if (params && paramKey && params[paramKey] !== undefined) {
    return Promise.resolve(params[paramKey])
  }

  // Otherwise, use the original readline approach
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
}`

  // Replace the original askQuestion function
  let modifiedContent = content.replace(
    /function askQuestion$$query: string$$: Promise<string> {[\s\S]*?}\)/,
    modifiedAskQuestion,
  )

  // Modify the main function to use the params
  if (scriptName === "createDelegate.ts") {
    modifiedContent = modifiedContent.replace(
      `const serviceAccountFile = await askQuestion("Enter the file path to your service account JSON key file: ")`,
      `const serviceAccountFile = await askQuestion("Enter the file path to your service account JSON key file: ", "serviceAccountFile")`,
    )

    modifiedContent = modifiedContent.replace(
      `const userEmails = await askQuestion("Enter the email(s) of the inbox(es) (comma-separated): ")`,
      `const userEmails = await askQuestion("Enter the email(s) of the inbox(es) (comma-separated): ", "userEmails")`,
    )

    modifiedContent = modifiedContent.replace(
      `const delegateEmails = await askQuestion("Enter the email(s) of the employee(s) that need to be given delegated access to (comma-separated): ")`,
      `const delegateEmails = await askQuestion("Enter the email(s) of the employee(s) that need to be given delegated access to (comma-separated): ", "delegateEmails")`,
    )
  } else {
    modifiedContent = modifiedContent.replace(
      `const serviceAccountFile = await askQuestion("Enter the file path to your service account JSON key file: ")`,
      `const serviceAccountFile = await askQuestion("Enter the file path to your service account JSON key file: ", "serviceAccountFile")`,
    )

    modifiedContent = modifiedContent.replace(
      `const userEmails = await askQuestion("Enter the email(s) of the inbox(es) (comma-separated): ")`,
      `const userEmails = await askQuestion("Enter the email(s) of the inbox(es) (comma-separated): ", "userEmails")`,
    )

    modifiedContent = modifiedContent.replace(
      `const delegateEmails = await askQuestion("Enter the email(s) of  the employee(s) to remove delegated access to (comma-separated): ")`,
      `const delegateEmails = await askQuestion("Enter the email(s) of  the employee(s) to remove delegated access to (comma-separated): ", "delegateEmails")`,
    )
  }

  // Add the import section at the beginning of the file
  modifiedContent = importSection + modifiedContent

  return modifiedContent
}

// Modify the scripts
const modifiedCreateDelegate = modifyScript(createDelegateContent, "createDelegate.ts")
const modifiedDeleteDelegate = modifyScript(deleteDelegateContent, "deleteDelegate.ts")

// Write the modified scripts back to disk
fs.writeFileSync(createDelegatePath, modifiedCreateDelegate)
fs.writeFileSync(deleteDelegatePath, modifiedDeleteDelegate)

console.log("Scripts have been modified to accept parameters from a file.")
