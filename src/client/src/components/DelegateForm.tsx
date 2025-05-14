"use client"

import type React from "react"
import { useState } from "react"
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Radio,
  RadioGroup,
  useToast,
  Textarea,
  Divider,
  Text,
} from "@chakra-ui/react"

interface DelegateFormProps {
  serviceAccountFile: File | null
  onSubmit: (formData: FormData) => Promise<void>
}

const DelegateForm: React.FC<DelegateFormProps> = ({ serviceAccountFile, onSubmit }) => {
  const [operation, setOperation] = useState<string>("list")
  const [userEmail, setUserEmail] = useState<string>("")
  const [delegateEmail, setDelegateEmail] = useState<string>("")
  const [batchMode, setBatchMode] = useState<boolean>(false)
  const [batchEmails, setBatchEmails] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const toast = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceAccountFile) {
      toast({
        title: "No service account file",
        description: "Please upload a service account file first",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!userEmail && !batchMode) {
      toast({
        title: "Missing information",
        description: "Please enter the mailbox email address",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if ((operation === "add" || operation === "remove") && !delegateEmail && !batchMode) {
      toast({
        title: "Missing information",
        description: "Please enter the delegate email address",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (batchMode && !batchEmails.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter batch operations",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      setIsSubmitting(true)

      const formData = new FormData()
      formData.append("serviceAccount", serviceAccountFile)

      if (batchMode) {
        // Parse batch operations
        try {
          const operations = batchEmails
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
              const [op, user, delegate] = line.split(",").map((item) => item.trim())
              return {
                operation: op,
                userEmail: user,
                delegateEmail: delegate,
              }
            })

          formData.append("operations", JSON.stringify(operations))
        } catch (error) {
          toast({
            title: "Invalid batch format",
            description: "Please check your batch operations format",
            status: "error",
            duration: 5000,
            isClosable: true,
          })
          setIsSubmitting(false)
          return
        }
      } else {
        formData.append("userEmail", userEmail)
        if (delegateEmail) {
          formData.append("delegateEmail", delegateEmail)
        }
      }

      await onSubmit(formData)

      // Reset form if successful
      if (!batchMode) {
        if (operation !== "list") {
          setDelegateEmail("")
        }
      } else {
        setBatchEmails("")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <RadioGroup onChange={setOperation} value={operation}>
          <HStack spacing={4}>
            <Radio value="list">List Delegates</Radio>
            <Radio value="add">Add Delegate</Radio>
            <Radio value="remove">Remove Delegate</Radio>
          </HStack>
        </RadioGroup>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="batch-mode" mb="0">
            Batch Mode
          </FormLabel>
          <input id="batch-mode" type="checkbox" checked={batchMode} onChange={(e) => setBatchMode(e.target.checked)} />
        </FormControl>

        {batchMode ? (
          <FormControl>
            <FormLabel>Batch Operations</FormLabel>
            <Textarea
              value={batchEmails}
              onChange={(e) => setBatchEmails(e.target.value)}
              placeholder="operation,userEmail,delegateEmail (one per line)"
              rows={6}
            />
            <Text fontSize="xs" mt={1} color="gray.500">
              Format: operation,userEmail,delegateEmail (one per line)
              <br />
              Example: add,shared@example.com,user@example.com
            </Text>
          </FormControl>
        ) : (
          <>
            <FormControl isRequired>
              <FormLabel>Mailbox Email</FormLabel>
              <Input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="shared@example.com"
              />
            </FormControl>

            {operation !== "list" && (
              <FormControl isRequired>
                <FormLabel>Delegate Email</FormLabel>
                <Input
                  type="email"
                  value={delegateEmail}
                  onChange={(e) => setDelegateEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </FormControl>
            )}
          </>
        )}

        <Divider />

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isSubmitting}
          loadingText="Processing"
          isDisabled={!serviceAccountFile}
        >
          {operation === "list" ? "List Delegates" : operation === "add" ? "Add Delegate" : "Remove Delegate"}
        </Button>
      </VStack>
    </Box>
  )
}

export default DelegateForm
