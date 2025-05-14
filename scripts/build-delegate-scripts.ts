import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

async function buildDelegateScripts() {
  console.log("Building delegate scripts...")

  try {
    // Create a dist directory if it doesn't exist
    const distDir = path.join(process.cwd(), "dist")
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }

    // Compile createDelegate.ts to JavaScript
    console.log("Compiling createDelegate.ts...")
    await execAsync(`npx tsc createDelegate.ts --outDir dist --esModuleInterop true --target es2018 --module commonjs`)

    // Compile deleteDelegate.ts to JavaScript
    console.log("Compiling deleteDelegate.ts...")
    await execAsync(`npx tsc deleteDelegate.ts --outDir dist --esModuleInterop true --target es2018 --module commonjs`)

    console.log("Delegate scripts compiled successfully!")
  } catch (error) {
    console.error("Error building delegate scripts:", error)
    process.exit(1)
  }
}

buildDelegateScripts()
