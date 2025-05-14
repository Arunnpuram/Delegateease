"use client"

import type React from "react"
import { useState } from "react"
import { Box, Button, FormControl, FormLabel, Input, VStack, Text, useToast, Icon } from "@chakra-ui/react"
import { FiUpload } from "react-icons/fi"

interface ServiceAccountUploadProps {
  onServiceAccountUploaded: (file: File) => void
}

const ServiceAccountUpload: React.FC<ServiceAccountUploadProps> = ({ onServiceAccountUploaded }) => {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const toast = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    // Check if file is JSON
    if (selectedFile.type !== "application/json" && !selectedFile.name.endsWith(".json")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JSON service account file",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setFile(selectedFile)
    onServiceAccountUploaded(selectedFile)

    toast({
      title: "File uploaded",
      description: "Service account file is ready to use",
      status: "success",
      duration: 3000,
      isClosable: true,
    })
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
    <VStack spacing={4} align="stretch">
      <FormControl>
        <FormLabel>Google Service Account JSON</FormLabel>
        <Box
          border="2px dashed"
          borderColor={isDragging ? "blue.400" : "gray.200"}
          borderRadius="md"
          p={6}
          textAlign="center"
          bg={isDragging ? "blue.50" : "gray.50"}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          transition="all 0.2s"
        >
          <Icon as={FiUpload} w={10} h={10} color="gray.400" mb={2} />
          <Text mb={2}>{file ? file.name : "Drag and drop your service account JSON file here"}</Text>
          <Text fontSize="sm" color="gray.500" mb={4}>
            or
          </Text>
          <Button size="sm" colorScheme="blue" onClick={() => document.getElementById("fileInput")?.click()}>
            Browse Files
          </Button>
          <Input id="fileInput" type="file" accept=".json" onChange={handleFileChange} display="none" />
        </Box>
        {file && (
          <Text mt={2} fontSize="sm" color="green.500">
            File selected: {file.name}
          </Text>
        )}
      </FormControl>
    </VStack>
  )
}

export default ServiceAccountUpload
