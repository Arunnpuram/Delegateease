// Centralized type definitions for the entire application

// Gmail API related types
export interface Delegate {
  delegateEmail: string
  verificationStatus?: string
}

export interface DelegateOperation {
  userEmail: string
  delegateEmail?: string
  operation: "add" | "remove" | "list"
}

export interface OperationResult {
  success: boolean
  userEmail: string
  delegateEmail?: string
  operation: string
  message: string
  delegates?: Delegate[]
  details?: any
  rawOutput?: string
}

// Authentication related types
export type AuthMethod = "service-account" | "oauth" | null

// Component props types
export interface ServiceAccountUploadProps {
  onServiceAccountUploaded: (file: File) => void
}

export interface DelegateFormProps {
  authMethod: AuthMethod
  serviceAccountFile: File | null
  onSubmit: (formData: FormData, endpoint: string) => Promise<void>
  isLoading: boolean
  onDirectApiResult: (result: any) => void
  onDirectApiError: (error: string) => void
  onDirectApiLoading: (isLoading: boolean) => void
}

export interface ResultDisplayProps {
  results: OperationResult[] | null
  error: string | null
}

export interface SimpleListButtonProps {
  serviceAccountFile: File | null
  userEmail: string
  onResult: (result: any) => void
  onError: (error: string) => void
  onLoading: (isLoading: boolean) => void
}

export interface AuthOptionsProps {
  onServiceAccountUploaded: (file: File) => void
  onOAuthComplete: () => void
}
