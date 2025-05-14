"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "next-themes"
import DelegateEaseApp from "../components/delegate-ease-app"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // Ensure theme is only applied after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">DelegateEase - Gmail Delegation Manager</h1>
          <DelegateEaseApp />
        </div>
      </div>
    </ThemeProvider>
  )
}
