"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Edit, Trash2, BookOpen, FileText, PenTool, GraduationCap } from "lucide-react"
import { ContentModal } from "@/components/content-modal"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, addDays } from "date-fns"

interface CourseCalendarProps {
  courseData: any
  onOpenContent?: (contentId: string) => void
  onRequestGenerate?: (type: string, unitId: string) => void
}

interface CalendarItem {
  id: string
  title: string
  type: string
  unit: string
  date?: Date
  color: string
  content?: string
  createdAt?: string
  isGenerated?: boolean
}

export function CourseCalendar({ courseData, onOpenContent, onRequestGenerate }: CourseCalendarProps) {
  const router = useRouter()
  // Parse course date range
  const courseStartDate = courseData.startDate ? parseISO(courseData.startDate) : new Date()
  const courseEndDate = courseData.endDate ? parseISO(courseData.endDate) : new Date()
  
  // Initialize current month to course start date
  const [currentMonth, setCurrentMonth] = useState(courseStartDate)
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null)
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [savedContent, setSavedContent] = useState<any[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)

  // Load saved content when component mounts
  useEffect(() => {
    const loadSavedContent = async () => {
      if (!courseData.courseId) return
      
      setLoadingContent(true)
      try {
        const response = await fetch(`/api/content?courseId=${courseData.courseId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setSavedContent(result.content)
        }
      } catch (error) {
        console.error('Error loading saved content:', error)
      } finally {
        setLoadingContent(false)
      }
    }

    loadSavedContent()
  }, [courseData.courseId])

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

    return courseData.calendar?.map((unit: { id: string; title: string; color: string }) => {
      // Get saved content for this unit
      const unitContent = savedContent.filter(content => content.unitId === unit.id)
      
      return {
        id: unit.id,
        title: unit.title,
        color: unit.color,
        items: contentTypes.map(type => {
          // Find if there's saved content for this type and unit
          const savedItem = unitContent.find(content => content.type === type.id)
          
          return {
            id: `${type.id}-${unit.id}`,
            title: `${type.title} - ${unit.title}`,
            type: type.id,
            unit: unit.title,
            color: unit.color,
            content: savedItem ? savedItem.content : `Generated ${type.title.toLowerCase()} for ${unit.title}`,
            createdAt: savedItem?.createdAt,
            isGenerated: !!savedItem,
            typeInfo: type
          }
        })
      }
    }) || []
  }, [courseData.calendar, savedContent])

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

  // Auto-plan: place generated content across the course range using given rules
  const autoPlanContent = () => {
    if (!courseData?.calendar || courseData.calendar.length === 0) return

    const placements: CalendarItem[] = []

    // Build an index of dates within course range grouped by weekday for lecture matching
    const allDays: Date[] = eachDayOfInterval({ start: courseStartDate, end: courseEndDate })

    const findNextDateMatchingLecture = (startDate: Date): Date | null => {
      for (const d of allDays) {
        if (d < startDate) continue
        const lecture = getLectureForDate(d)
        if (lecture) return d
      }
      return null
    }

    const findSameWeekNextDate = (baseDate: Date) => addDays(baseDate, 7)

    // Iterate units sequentially
    let cursorDate: Date = courseStartDate
    const getSavedFor = (unitId: string, type: string) => savedContent.find(c => c.unitId === unitId && c.type === type)

    for (const unit of courseData.calendar) {
      // 1. Lesson plan on a lecture day
      const lesson = getSavedFor(unit.id, 'lesson-plan')
      let lessonDate: Date | null = null
      if (lesson) {
        const nextLectureDate = findNextDateMatchingLecture(cursorDate)
        if (nextLectureDate) {
          placements.push({
            id: lesson.id || `lesson-plan-${unit.id}`,
            title: `Lesson Plan - ${unit.title}`,
            type: 'lesson-plan',
            unit: unit.title,
            date: nextLectureDate,
            color: unit.color,
            isGenerated: true,
          })
          lessonDate = nextLectureDate
          cursorDate = addDays(nextLectureDate, 1)
        }
      }

      // 2. Reading on same day as lesson (if exists), else next day
      const reading = getSavedFor(unit.id, 'reading')
      if (reading && (lessonDate || cursorDate)) {
        const readingDate = lessonDate || cursorDate
        placements.push({
          id: reading.id || `reading-${unit.id}`,
          title: `Reading - ${unit.title}`,
          type: 'reading',
          unit: unit.title,
          date: readingDate,
          color: unit.color,
          isGenerated: true,
        })
        // keep cursor
      }

      // 3. Homework one week after lesson (or cursor if no lesson)
      const homework = getSavedFor(unit.id, 'homework')
      if (homework) {
        const base = lessonDate || cursorDate
        const hwDate = findSameWeekNextDate(base)
        if (hwDate <= courseEndDate) {
          placements.push({
            id: homework.id || `homework-${unit.id}`,
            title: `Homework - ${unit.title}`,
            type: 'homework',
            unit: unit.title,
            date: hwDate,
            color: unit.color,
            isGenerated: true,
          })
          cursorDate = addDays(hwDate, 1)
        }
      }

      // 4. Exam spans after lesson but before next unit; place start 3 days after lesson if possible
      const exam = getSavedFor(unit.id, 'exam')
      if (exam && (lessonDate || cursorDate)) {
        const base = lessonDate || cursorDate
        const examStart = addDays(base, 3)
        if (examStart <= courseEndDate) {
          placements.push({
            id: exam.id || `exam-${unit.id}`,
            title: `Exam - ${unit.title}`,
            type: 'exam',
            unit: unit.title,
            date: examStart,
            color: unit.color,
            isGenerated: true,
          })
          cursorDate = addDays(examStart, 1)
        }
      }
    }

    // Merge with existing items, de-dup by id+date
    setCalendarItems(prev => {
      const key = (it: CalendarItem) => `${it.id}-${it.date?.toDateString()}`
      const map = new Map<string, CalendarItem>()
      ;[...prev, ...placements].forEach(it => {
        if (it.date) map.set(key(it), it)
      })
      return Array.from(map.values())
    })
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
                className="bg-[#47624f] text-white hover:bg-[#000000]"
                size="sm"
                onClick={() => autoPlanContent()}
              >
                Auto-Plan
              </Button>
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
                          <div className="text-[10px] bg-[#47624f] text-white px-1.5 py-0.5 rounded font-medium inline-block">
                            Lecture: {lectureInfo}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {dayItems.map(item => (
                          <div
                            key={item.id}
                            className={`text-xs p-1 rounded ${item.color} text-white truncate cursor-pointer`}
                            onClick={() => {
                              if (item.isGenerated && item.id && item.id !== 'mock') {
                                onOpenContent?.(item.id)
                              } else {
                                // route to generator for this unit/type
                                const unit = courseData.calendar?.find((u: any) => u.title === item.unit || u.id === item.unit)
                                if (unit) {
                                  onRequestGenerate?.(item.type, unit.id)
                                }
                              }
                            }}
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
                {generatedContent.map((unit: { id: string; title: string; color: string; items: any[] }) => (
                  <Card key={unit.id} className="border-[#B2A29E]/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {unit.title.includes('Unit') ? unit.title : `Unit ${courseData.calendar?.findIndex((u: any) => u.id === unit.id) + 1}: ${unit.title}`}
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
                                                                                              onClick={() => {
                                   if (item.id && item.id !== 'mock') {
                                     setSelectedContentId(item.id)
                                     setContentModalOpen(true)
                                   }
                                 }}
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
                                View: Unit {courseData.calendar?.findIndex((u: any) => u.id === unit.id) + 1} - {unit.title}
                                {item.isGenerated && (
                                  <div className="mt-1">
                                    <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f] text-xs">
                                      ✓ Generated
                                    </Badge>
                                  </div>
                                )}
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
      
      {/* Content Modal */}
      <ContentModal
        isOpen={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false)
          setSelectedContentId(null)
        }}
        contentId={selectedContentId}
      />
    </div>
  )
}
