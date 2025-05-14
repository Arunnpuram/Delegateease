import type React from "react"
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react"

interface Delegate {
  delegateEmail: string
  verificationStatus?: string
}

interface OperationResult {
  success: boolean
  userEmail: string
  delegateEmail?: string
  operation: string
  message: string
  delegates?: Delegate[]
  details?: any
}

interface ResultDisplayProps {
  results: OperationResult[] | null
  error: string | null
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ results, error }) => {
  if (error) {
    return (
      <Alert status="error" variant="solid" borderRadius="md">
        <AlertIcon />
        <AlertTitle>Error:</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!results || results.length === 0) {
    return null
  }

  return (
    <Box mt={6}>
      <Heading size="md" mb={4}>
        Results
      </Heading>

      {results.map((result, index) => (
        <Box
          key={index}
          mb={4}
          p={4}
          borderWidth="1px"
          borderRadius="md"
          borderColor={result.success ? "green.200" : "red.200"}
          bg={result.success ? "green.50" : "red.50"}
        >
          <Text fontWeight="bold">
            {result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} Operation for {result.userEmail}
            <Badge ml={2} colorScheme={result.success ? "green" : "red"}>
              {result.success ? "Success" : "Failed"}
            </Badge>
          </Text>

          {result.delegateEmail && <Text mt={1}>Delegate: {result.delegateEmail}</Text>}

          <Text mt={1}>{result.message}</Text>

          {result.delegates && result.delegates.length > 0 && (
            <Box mt={3}>
              <Text fontWeight="bold" mb={2}>
                Current Delegates:
              </Text>
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Email</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {result.delegates.map((delegate, idx) => (
                    <Tr key={idx}>
                      <Td>{delegate.delegateEmail}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            delegate.verificationStatus === "accepted"
                              ? "green"
                              : delegate.verificationStatus === "pending"
                                ? "yellow"
                                : "gray"
                          }
                        >
                          {delegate.verificationStatus || "unknown"}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {result.details && (
            <Accordion allowToggle mt={2}>
              <AccordionItem border="none">
                <AccordionButton p={1}>
                  <Text fontSize="sm" color="gray.600">
                    Details
                  </Text>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <pre style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </Box>
      ))}
    </Box>
  )
}

export default ResultDisplay
