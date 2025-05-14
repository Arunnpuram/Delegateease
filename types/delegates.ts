// Centralized type definitions for the entire application

// Gmail API related types
export interface Delegate {
  delegateEmail: string | null | undefined
  verificationStatus?: string
}

export interface OperationResult {
  success: boolean
  userEmail?: string
  delegateEmail?: string
  operation: "add" | "remove" | "list"
  message: string
  details?: any
  delegates?: Delegate[]
}
