"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
} from "@chakra-ui/react"
import ServiceAccountUpload from "../components/ServiceAccountUpload"
import DelegateForm from "../components/DelegateForm"
import ResultDisplay from "../components/ResultDisplay"
import { ExternalLinkIcon } from "@chakra-ui/icons"

const Home: React.FC = () => {
  const [serviceAccountFile, setServiceAccountFile] = useState<File | null>(null)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toast = useToast()

  const handleServiceAccountUploaded = (file: File) => {
    setServiceAccountFile(file)
    setResults(null)
    setError(null)
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      setError(null)

      // Determine the endpoint based on the operation
      const isBatch = formData.has("operations")
      let endpoint = "/api/delegates/"

      if (isBatch) {
        endpoint += "batch"
      } else {
        const operation = formData.get("delegateEmail")
          ? formData.has("operation")
            ? formData.get("operation")
            : "add"
          : "list"
        endpoint += operation
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "An error occurred")
      }

      if (isBatch && data.results) {
        setResults(data.results)

        // Count successes and failures
        const successes = data.results.filter((r: any) => r.success).length
        const failures = data.results.length - successes

        toast({
          title: "Batch operation completed",
          description: `${successes} operations succeeded, ${failures} failed`,
          status: failures > 0 ? "warning" : "success",
          duration: 5000,
          isClosable: true,
        })
      } else {
        setResults([data])

        toast({
          title: data.success ? "Operation successful" : "Operation failed",
          description: data.message,
          status: data.success ? "success" : "error",
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "An unexpected error occurred")

      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            DelegateEase
          </Heading>
          <Text color="gray.600">Easily manage Gmail delegation access for your organization</Text>
        </Box>

        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Important!</AlertTitle>
            <AlertDescription>
              Your service account credentials are processed securely and are not stored on our servers.
              <br />
              <Link href="https://developers.google.com/gmail/api/auth/web-server" isExternal color="blue.500">
                Learn about Gmail API authentication <ExternalLinkIcon mx="2px" />
              </Link>
            </AlertDescription>
          </Box>
        </Alert>

        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>
            Step 1: Upload Service Account
          </Heading>
          <ServiceAccountUpload onServiceAccountUploaded={handleServiceAccountUploaded} />
        </Box>

        <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
          <Heading size="md" mb={4}>
            Step 2: Manage Delegates
          </Heading>
          <DelegateForm serviceAccountFile={serviceAccountFile} onSubmit={handleSubmit} />
        </Box>

        {(results || error) && (
          <Box p={6} borderWidth="1px" borderRadius="lg" bg="white">
            <ResultDisplay results={results} error={error} />
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export default Home
