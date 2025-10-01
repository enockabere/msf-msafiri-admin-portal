"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
  modifiers?: {
    hasAgenda?: (date: Date) => boolean
  }
  modifiersStyles?: {
    hasAgenda?: React.CSSProperties
  }
}

function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  modifiers,
  modifiersStyles,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1)
      } else {
        newMonth.setMonth(prev.getMonth() + 1)
      }
      return newMonth
    })
  }

  const isSelected = (date: Date) => {
    if (!selected || !date) return false
    return date.toDateString() === selected.toDateString()
  }

  const isToday = (date: Date) => {
    if (!date) return false
    return date.toDateString() === new Date().toDateString()
  }

  const isDisabled = (date: Date) => {
    if (!date || !disabled) return false
    return disabled(date)
  }

  const hasAgenda = (date: Date) => {
    if (!date || !modifiers?.hasAgenda) return false
    return modifiers.hasAgenda(date)
  }

  const days = getDaysInMonth(currentMonth)
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className={cn("p-3", className)}>
      <div className="flex justify-center pt-1 relative items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
          className="absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">{monthYear}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
          className="absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="w-full">
        <div className="flex mb-2">
          {weekDays.map(day => (
            <div key={day} className="flex-1 text-center text-sm font-normal text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-9 w-9" />
            }
            
            const isDateSelected = isSelected(date)
            const isDateToday = isToday(date)
            const isDateDisabled = isDisabled(date)
            const dateHasAgenda = hasAgenda(date)
            
            return (
              <Button
                key={index}
                variant="ghost"
                className={cn(
                  "h-9 w-9 p-0 font-normal",
                  isDateSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  isDateToday && !isDateSelected && "bg-accent text-accent-foreground",
                  isDateDisabled && "text-gray-300 opacity-50 cursor-not-allowed",
                  dateHasAgenda && !isDateSelected && "bg-red-100 text-red-800 font-bold"
                )}
                disabled={isDateDisabled}
                onClick={() => !isDateDisabled && onSelect?.(date)}
                style={dateHasAgenda ? modifiersStyles?.hasAgenda : undefined}
              >
                {date.getDate()}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }