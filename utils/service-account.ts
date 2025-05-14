import fs from "fs"
import path from "path"
import os from "os"
import { randomUUID } from "crypto"

/**
 * Manages service account file operations
 */
export class ServiceAccountManager {
  private static readonly TEMP_DIR = path.join(os.tmpdir(), "delegateease")

  /**
   * Save a service account file to a temporary location
   * @param file The service account file to save
   * @returns Promise<string> The path to the saved file
   */
  static async saveFile(file: File): Promise<string> {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true })
    }

    // Generate a unique filename
    const filename = `sa_${Date.now()}_${randomUUID()}.json`
    const filepath = path.join(this.TEMP_DIR, filename)

    // Convert File to Buffer and write to disk
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filepath, buffer)

    return filepath
  }

  /**
   * Read a service account file
   * @param filepath The path to the service account file
   * @returns Promise<any> The parsed service account JSON
   */
  static async readFile(filepath: string): Promise<any> {
    const content = await fs.promises.readFile(filepath, "utf-8")
    return JSON.parse(content)
  }

  /**
   * Clean up a service account file
   * @param filepath The path to the service account file
   */
  static async cleanupFile(filepath: string): Promise<void> {
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath)
    }
  }

  /**
   * Clean up all temporary service account files
   */
  static async cleanupAll(): Promise<void> {
    if (fs.existsSync(this.TEMP_DIR)) {
      const files = await fs.promises.readdir(this.TEMP_DIR)
      await Promise.all(
        files.map((file) => fs.promises.unlink(path.join(this.TEMP_DIR, file)))
      )
    }
  }
} 