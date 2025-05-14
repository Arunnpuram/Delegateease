"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ServiceAccountUploadProps } from "@/types"

export default function ServiceAccountUpload({ onServiceAccountUploaded }: ServiceAccountUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    // Check if file is JSON
    if (selectedFile.type !== "application/json" && !selectedFile.name.endsWith(".json")) {
      alert("Please upload a JSON service account file")
      return
    }

    setFile(selectedFile)
    onServiceAccountUploaded(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="serviceAccount">Google Service Account JSON</Label>
        <div
          className={cn(
            "mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200",
            isDragging ? "border-primary/50 bg-primary/5" : "border-input bg-muted/30 hover:bg-muted/50",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center">
            <p className="mt-2 text-sm font-medium">
              {file ? file.name : "Drag and drop your service account JSON file here"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">or</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              Browse Files
            </Button>
            <Input id="fileInput" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </div>
        </div>
        {file && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            File selected: {file.name}
          </p>
        )}
      </div>
    </div>
  )
}
