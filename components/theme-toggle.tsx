"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    console.log('ThemeToggle mounted')
    setMounted(true)
  }, [])

  React.useEffect(() => {
    console.log('Current theme:', theme)
  }, [theme])

  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    console.log('Toggling theme from', theme, 'to', newTheme)
    
    // Force clear localStorage and set new theme
    localStorage.removeItem('msafiri-theme')
    localStorage.setItem('msafiri-theme', newTheme)
    
    setTheme(newTheme)
    
    // Force DOM update
    setTimeout(() => {
      document.documentElement.className = newTheme
    }, 0)
  }

  if (!mounted) {
    console.log('ThemeToggle not mounted yet')
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

  console.log('ThemeToggle rendering with theme:', theme)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="rounded-full p-2 border-slate-300"
    >
      {theme === 'dark' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}