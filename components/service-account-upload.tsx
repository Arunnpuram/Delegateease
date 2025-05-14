"use client"

import React, { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ServiceAccountUploadProps } from "@/types"

export default function ServiceAccountUpload({ onServiceAccountUploaded }: ServiceAccountUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      onServiceAccountUploaded(selectedFile)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      onServiceAccountUploaded(droppedFile)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="serviceAccount">Google Service Account JSON</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-muted-foreground">
              {file ? (
                <div className="space-y-2">
                  <p className="font-medium">Selected file:</p>
                  <p className="text-sm">{file.name}</p>
                </div>
              ) : (
                <p>Drag and drop your service account JSON file here, or click to select</p>
              )}
            </div>
            <Input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
