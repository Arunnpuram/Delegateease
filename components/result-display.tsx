import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ResultDisplayProps } from "@/types"

export default function ResultDisplay({ results, error }: ResultDisplayProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!results || results.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div
          key={index}
          className={cn(
            "p-4 border rounded-lg",
            result.success
              ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
              : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20",
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {result.success ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-500 dark:text-green-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500 dark:text-red-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <div>
                <p className="font-medium">
                  {result.operation.charAt(0).toUpperCase() + result.operation.slice(1)} Operation for{" "}
                  {result.userEmail}
                </p>
                {result.delegateEmail && (
                  <p className="text-sm text-muted-foreground">Delegate: {result.delegateEmail}</p>
                )}
              </div>
            </div>
            <Badge variant={result.success ? "success" : "destructive"}>{result.success ? "Success" : "Failed"}</Badge>
          </div>

          <p className="mt-2 text-sm">{result.message}</p>

          {result.delegates && result.delegates.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Current Delegates:</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.delegates.map((delegate, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{delegate.delegateEmail}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            delegate.verificationStatus === "accepted"
                              ? "success"
                              : delegate.verificationStatus === "pending"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {delegate.verificationStatus || "unknown"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {(result.details || result.rawOutput) && (
            <Collapsible className="mt-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {result.details && (
                  <pre className="mt-2 text-xs whitespace-pre-wrap bg-muted p-2 rounded">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
                {result.rawOutput && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Script Output:</p>
                    <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">{result.rawOutput}</pre>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      ))}
    </div>
  )
}
