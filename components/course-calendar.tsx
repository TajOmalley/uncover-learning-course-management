"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, BookOpen, FileText, PenTool, GraduationCap } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns"

interface CourseCalendarProps {
  courseData: any
}

interface CalendarItem {
  id: string
  title: string
  type: string
  unit: string
  date?: Date
  color: string
}

export function CourseCalendar({ courseData }: CourseCalendarProps) {
  // Parse course date range
  const courseStartDate = courseData.startDate ? parseISO(courseData.startDate) : new Date()
  const courseEndDate = courseData.endDate ? parseISO(courseData.endDate) : new Date()
  
  // Initialize current month to course start date
  const [currentMonth, setCurrentMonth] = useState(courseStartDate)
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null)
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])

  // Generate calendar days for current month with proper alignment
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const daysInMonth = eachDayOfInterval({ start, end })
    
    // Calculate which day of the week the 1st of the month starts on (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = start.getDay()
    
    // Create array with empty cells for proper alignment
    const alignedDays = []
    
    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      alignedDays.push(null)
    }
    
    // Add all days of the month
    alignedDays.push(...daysInMonth)
    
    return alignedDays
  }, [currentMonth])

  // Mock generated content organized by unit and type
  const generatedContent = useMemo(() => {
    const contentTypes = [
      { id: "lesson-plan", title: "Lesson Plans", icon: BookOpen, color: "from-[#47624f] to-[#707D7F]" },
      { id: "reading", title: "Reading Content", icon: FileText, color: "from-[#C9F2C7] to-[#47624f]" },
      { id: "homework", title: "Homework Problems", icon: PenTool, color: "from-[#B2A29E] to-[#707D7F]" },
      { id: "exam", title: "Exams", icon: GraduationCap, color: "from-[#000000] to-[#707D7F]" },
    ]

    return courseData.calendar?.map((unit: any) => ({
      id: unit.id,
      title: unit.title,
      color: unit.color,
      items: contentTypes.map(type => ({
        id: `${type.id}-${unit.id}`,
        title: `${type.title} - ${unit.title}`,
        type: type.id,
        unit: unit.title,
        color: unit.color,
        content: `Generated ${type.title.toLowerCase()} for ${unit.title}`,
        typeInfo: type
      })) || []
    })) || []
  }, [courseData.calendar])

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: CalendarItem) => {
    setDraggedItem(item)
    e.dataTransfer.setData('text/plain', JSON.stringify(item))
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    if (draggedItem) {
      const newItem = { ...draggedItem, date }
      setCalendarItems(prev => [...prev, newItem])
      setDraggedItem(null)
    }
  }

  // Check if date is within course range
  const isDateInCourseRange = (date: Date) => {
    return date >= courseStartDate && date <= courseEndDate
  }

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    return calendarItems.filter(item => item.date && isSameDay(item.date, date))
  }

  // Get lecture schedule for a specific date
  const getLectureForDate = (date: Date) => {
    // Only show lectures if the date is within the course range
    if (!isDateInCourseRange(date)) {
      return null
    }
    
    const fullDayName = format(date, 'EEEE') // Gets day name like "Monday", "Tuesday"
    
    // Map full day names to abbreviated format used in setup wizard
    const dayNameMap: Record<string, string> = {
      'Sunday': 'Sun',
      'Monday': 'Mon', 
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat'
    }
    
    const abbreviatedDayName = dayNameMap[fullDayName]
    return courseData.lectureSchedule?.[abbreviatedDayName] || null
  }

  // Check if we can navigate to previous month
  const canGoToPreviousMonth = () => {
    const previousMonth = subMonths(currentMonth, 1)
    return previousMonth >= startOfMonth(courseStartDate)
  }

  // Check if we can navigate to next month
  const canGoToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1)
    return nextMonth <= endOfMonth(courseEndDate)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#47624f]" />
              <CardTitle>Course Calendar</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                disabled={!canGoToPreviousMonth()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                disabled={!canGoToNextMonth()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-[#707D7F]">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  // Handle empty cells (null values for alignment)
                  if (day === null) {
                    return (
                      <div
                        key={index}
                        className="min-h-[100px] p-2 border border-[#B2A29E]/20 bg-[#B2A29E]/5"
                      >
                        {/* Empty cell */}
                      </div>
                    )
                  }
                  
                  const isInRange = isDateInCourseRange(day)
                  const dayItems = getItemsForDate(day)
                  const lectureInfo = getLectureForDate(day)
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border border-[#B2A29E]/20 ${
                        isInRange ? 'bg-[#C9F2C7]/10' : 'bg-[#B2A29E]/5'
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                    >
                      <div className={`text-sm font-medium ${
                        isInRange ? 'text-[#000000]' : 'text-[#707D7F]'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      {/* Lecture Schedule Display */}
                      {lectureInfo && (
                        <div className="mt-1 mb-2">
                          <div className="text-xs bg-[#47624f] text-white px-2 py-1 rounded font-medium">
                            Lecture: {lectureInfo}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {dayItems.map(item => (
                          <div
                            key={item.id}
                            className={`text-xs p-1 rounded ${item.color} text-white truncate`}
                          >
                            {item.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Content Sidebar */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#000000] mb-4">Units</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {generatedContent.map(unit => (
                  <Card key={unit.id} className="border-[#B2A29E]/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {unit.title.includes('Unit') ? unit.title : `Unit ${unit.id}: ${unit.title}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {unit.items.map((item: any) => {
                          const Icon = item.typeInfo.icon
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item)}
                              className="p-2 bg-[#C9F2C7]/20 rounded border border-[#B2A29E]/20 cursor-move hover:bg-[#C9F2C7]/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-4 h-4 rounded bg-gradient-to-r ${item.typeInfo.color} flex items-center justify-center`}>
                                  <Icon className="w-2 h-2 text-white" />
                                </div>
                                <div className="text-xs font-medium text-[#000000]">
                                  {item.typeInfo.title}
                                </div>
                              </div>
                              <div className="text-xs text-[#707D7F] ml-6">
                                {item.content}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
