"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActivityItem {
  id: string
  timestamp: string
  operation: "add" | "remove" | "list"
  userEmail: string
  delegateEmail?: string
  status: "success" | "error"
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading data
  useEffect(() => {
    setTimeout(() => {
      setActivities([
        {
          id: "1",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          operation: "add",
          userEmail: "shared@example.com",
          delegateEmail: "user1@example.com",
          status: "success",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          operation: "remove",
          userEmail: "shared@example.com",
          delegateEmail: "user2@example.com",
          status: "success",
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          operation: "list",
          userEmail: "shared@example.com",
          status: "success",
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          operation: "add",
          userEmail: "shared@example.com",
          delegateEmail: "user3@example.com",
          status: "error",
        },
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getOperationText = (activity: ActivityItem) => {
    switch (activity.operation) {
      case "add":
        return `Added ${activity.delegateEmail} to ${activity.userEmail}`
      case "remove":
        return `Removed ${activity.delegateEmail} from ${activity.userEmail}`
      case "list":
        return `Listed delegates for ${activity.userEmail}`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-12 bg-muted rounded"></div>
        <div className="animate-pulse h-12 bg-muted rounded"></div>
        <div className="animate-pulse h-12 bg-muted rounded"></div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center space-x-3">
              <div
                className={`w-2 h-2 rounded-full ${activity.status === "success" ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <div>
                <p className="text-sm font-medium">{getOperationText(activity)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(activity.timestamp)}</p>
              </div>
            </div>
            <Badge
              variant={
                activity.operation === "add" ? "default" : activity.operation === "remove" ? "destructive" : "outline"
              }
            >
              {activity.operation}
            </Badge>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
