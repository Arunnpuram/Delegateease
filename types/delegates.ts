export interface Delegate {
  delegateEmail: string
  verificationStatus?: string
}

export interface OperationResult {
  success: boolean
  userEmail: string
  delegateEmail?: string
  operation: string
  message: string
  delegates?: Delegate[]
  details?: any
}
