"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useState, useEffect } from "react"

// Example data structure for delegate statistics
interface DelegateStats {
  mailbox: string
  delegateCount: number
}

export default function DelegateStatistics() {
  const [stats, setStats] = useState<DelegateStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading data - in a real app, this would fetch from your API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats([
        { mailbox: "shared1@example.com", delegateCount: 3 },
        { mailbox: "support@example.com", delegateCount: 5 },
        { mailbox: "info@example.com", delegateCount: 2 },
        { mailbox: "sales@example.com", delegateCount: 4 },
        { mailbox: "hr@example.com", delegateCount: 1 },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Delegate Statistics</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-32 bg-muted rounded mb-4"></div>
            <div className="h-[200px] w-full bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delegate Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mailbox" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="delegateCount" fill="#3b82f6" name="Delegates" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
