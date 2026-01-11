"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const currentTheme = resolvedTheme || theme
    const newTheme = currentTheme === "light" ? "dark" : "light"
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-full p-2 border-slate-300"
      >
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const currentTheme = resolvedTheme || theme

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="rounded-full p-2 bg-red-600 border-white dark:border-black hover:bg-red-700"
    >
      {currentTheme === 'dark' ? (
        <Moon className="h-4 w-4 text-white" />
      ) : (
        <Sun className="h-4 w-4 text-white" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}