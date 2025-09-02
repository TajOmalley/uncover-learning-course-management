"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronLeft, ChevronDown, Menu, Download, Plus, Upload, Calendar, Link, BookOpen, FileText, Settings, ArrowLeft, PenTool, GraduationCap, MessageSquare } from "lucide-react"
import { CourseCalendar } from "@/components/course-calendar"
import { ContentGenerator } from "@/components/content-generator"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { ContentModal } from "@/components/content-modal"
import { UploadView } from "@/components/upload-view"
import DynamicActionBar, { type ActionItem } from "@/components/ui/dynamic-action"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { SourcedContent } from "@/components/SourcedContent"
import { CourseExport } from "@/components/course-export"
import { TutorMessage } from "@/components/TutorMessage"

interface CourseDashboardProps {
  courseData: any
  onBack?: () => void
  onCourseSelect?: (course: any) => void
}

export function CourseDashboard({ courseData, onBack, onCourseSelect }: CourseDashboardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  
  // Check if user is a student
  const isStudent = session?.user?.role === 'student'
  
  // View state
  const [selectedContentType, setSelectedContentType] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [currentView, setCurrentView] = useState("default") // default, create, calendar, content, bento, content-types, content-list, export
  const [currentContent, setCurrentContent] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [bentoView, setBentoView] = useState("main") // main, content-types
  
  // Saved content state
  const [savedContent, setSavedContent] = useState<any[]>([])
  
  // Tutor chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
    summary?: string
  }>>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Study Plan state
  const [studyPlanData, setStudyPlanData] = useState<{
    selectedUnit: any | null
    topic: string
    content: any | null
    currentCardIndex: number
    isFlipped: boolean
    wrongQuestions: any[]
    userAnswers: { [key: string]: string }
    questionResults: { [key: string]: { isCorrect: boolean; feedback: string } }
  }>({
    selectedUnit: null,
    topic: '',
    content: null,
    currentCardIndex: 0,
    isFlipped: false,
    wrongQuestions: [],
    userAnswers: {},
    questionResults: {}
  })
  const [isGeneratingStudyPlan, setIsGeneratingStudyPlan] = useState(false)
  const [studyPlanError, setStudyPlanError] = useState<string | null>(null)

  // Load saved content from database
  useEffect(() => {
    const fetchContent = async () => {
      if (!courseData.courseId) return
      
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
        console.error('Error fetching content:', error)
      }
    }

    fetchContent()
  }, [courseData.courseId])

  // Load all courses for sidebar
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success) {
          setAllCourses(result.courses)
        }
      } catch (error) {
        console.error('Error fetching courses:', error)
      }
    }

    fetchCourses()
  }, [])

  // Helper functions for course information
  const getCourseDuration = () => {
    if (!courseData.startDate || !courseData.endDate) return "Duration not set"
    const start = new Date(courseData.startDate)
    const end = new Date(courseData.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const weeks = Math.ceil(diffDays / 7)
    return `${weeks} weeks`
  }

  const getLectureSchedule = () => {
    if (!courseData.lectureSchedule) return "Schedule not set"
    
    // If it's already a string, return it
    if (typeof courseData.lectureSchedule === 'string') {
      return courseData.lectureSchedule
    }
    
    // If it's an object, format it as a string
    if (typeof courseData.lectureSchedule === 'object') {
      const schedule = courseData.lectureSchedule
      const days = Object.keys(schedule)
      if (days.length === 0) return "Schedule not set"
      
      return days.map(day => `${day}: ${schedule[day]}`).join(', ')
    }
    
    return "Schedule not set"
  }

  const handleCreateClick = (contentType: string) => {
    setSelectedContentType(contentType)
    setCurrentView("create")
    setSelectedUnit("")
    setCurrentContent(null)
  }



  const handleCalendarClick = () => {
    setCurrentView("calendar")
    setSelectedContentType("")
    setSelectedUnit("")
    setCurrentContent(null)
  }

  const handleBentoContentClick = () => {
    setCurrentView("bento")
    setBentoView("content-types")
  }

  const handleBentoReturnClick = () => {
    setBentoView("main")
  }

  const handleContentTypeClick = (contentType: string) => {
    // This now opens the viewing window for saved content
    setSelectedContentType(contentType)
    setCurrentView("content-list")
    setSelectedUnit("")
  }

  // Student-specific handlers
  const handleStudyClick = () => {
    setCurrentView("study")
  }

  const handleTutorClick = () => {
    setCurrentView("tutor")
  }

  const handleStudyPlanClick = () => {
    setCurrentView("study-plan")
  }

  const generateStudyPlan = async () => {
    if (!studyPlanData.selectedUnit || !studyPlanData.topic.trim()) return
    
    setIsGeneratingStudyPlan(true)
    setStudyPlanError(null)
    
    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: studyPlanData.topic,
          unit: studyPlanData.selectedUnit,
          unitId: studyPlanData.selectedUnit.id,
          courseData: {
            courseName: courseData.courseName,
            subject: courseData.subject,
            level: courseData.level,
            professor: courseData.professor
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate study plan')
      }

      const result = await response.json()
      
      if (result.success) {
        setStudyPlanData(prev => ({
          ...prev,
          content: result.studyPlan,
          currentCardIndex: 0,
          isFlipped: false
        }))
      } else {
        throw new Error(result.error || 'Failed to generate study plan')
      }
    } catch (error) {
      console.error('Error generating study plan:', error)
      setStudyPlanError(error instanceof Error ? error.message : 'An error occurred')
      // Show error toast
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({
          title: "Study Plan Generation Failed",
          description: error instanceof Error ? error.message : 'Please try again.',
        })
      } catch (_) {}
    } finally {
      setIsGeneratingStudyPlan(false)
    }
  }

  const nextCard = () => {
    if (studyPlanData.content && studyPlanData.currentCardIndex < studyPlanData.content.lessons.length - 1) {
      setStudyPlanData(prev => ({
        ...prev,
        currentCardIndex: prev.currentCardIndex + 1,
        isFlipped: false
      }))
    }
  }

  const prevCard = () => {
    if (studyPlanData.currentCardIndex > 0) {
      setStudyPlanData(prev => ({
        ...prev,
        currentCardIndex: prev.currentCardIndex - 1,
        isFlipped: false
      }))
    }
  }

  const flipCard = () => {
    setStudyPlanData(prev => ({
      ...prev,
      isFlipped: !prev.isFlipped
    }))
  }

  const resetStudyPlan = () => {
    setStudyPlanData({
      selectedUnit: null,
      topic: '',
      content: null,
      currentCardIndex: 0,
      isFlipped: false,
      wrongQuestions: [],
      userAnswers: {},
      questionResults: {}
    })
  }

  const evaluateAnswer = async (questionIndex: number, userAnswer: string) => {
    if (!studyPlanData.content || !studyPlanData.content.lessons) return
    
    const currentLesson = studyPlanData.content.lessons[studyPlanData.currentCardIndex]
    const question = currentLesson.questions[questionIndex]
    
    try {
      const response = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.text,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer,
          courseData: {
            courseName: courseData.courseName,
            subject: courseData.subject,
            level: courseData.level
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to evaluate answer')
      }

      const result = await response.json()
      
      if (result.success) {
        const questionKey = `${studyPlanData.currentCardIndex}-${questionIndex}`
        
        setStudyPlanData(prev => ({
          ...prev,
          questionResults: {
            ...prev.questionResults,
            [questionKey]: {
              isCorrect: result.isCorrect,
              feedback: result.feedback
            }
          }
        }))

        // If answer is wrong, add to wrong questions for spaced repetition
        if (!result.isCorrect) {
          setStudyPlanData(prev => ({
            ...prev,
            wrongQuestions: [...prev.wrongQuestions, {
              lessonIndex: studyPlanData.currentCardIndex,
              questionIndex: questionIndex,
              question: question.text,
              correctAnswer: question.correctAnswer,
              userAnswer: userAnswer
            }]
          }))
        }
      }
    } catch (error) {
      console.error('Error evaluating answer:', error)
      // Show error toast
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({
          title: "Answer Evaluation Failed",
          description: "Please try again.",
        })
      } catch (_) {}
    }
  }

  // Keyboard navigation for study plan
  useEffect(() => {
    if (currentView === "study-plan" && studyPlanData.content) {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          prevCard()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          nextCard()
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          flipCard()
        }
      }

      document.addEventListener('keydown', handleKeyPress)
      return () => document.removeEventListener('keydown', handleKeyPress)
    }
  }, [currentView, studyPlanData.content, studyPlanData.currentCardIndex, prevCard, nextCard, flipCard])

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return

    const message = userInput.trim()
    setUserInput('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage = {
      role: 'user' as const,
      content: message
    }
    setChatMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: message,
          courseData: {
            courseName: courseData.courseName,
            subject: courseData.subject,
            level: courseData.level,
            professor: courseData.professor
          },
          conversationHistory: chatMessages
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get tutor response')
      }

      const result = await response.json()
      
      if (result.success) {
        // Add assistant response to chat
        const newAssistantMessage = {
          role: 'assistant' as const,
          content: result.tutorResponse.response,
          summary: result.tutorResponse.conversationSummary
        }
        setChatMessages(prev => [...prev, newAssistantMessage])
      } else {
        throw new Error(result.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error message to chat
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.'
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value)
    // Auto-resize the textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const handleCourseSelect = (course: any) => {
    router.push(`/?courseId=${course.id}`)
    setSidebarOpen(false)
    setSidebarHovered(false)
    onCourseSelect?.(course)
  }

  const handleBackClick = () => {
    if (currentView === "content-list") {
      setCurrentView("bento")
      setBentoView("content-types")
    } else if (currentView === "bento" && bentoView === "content-types") {
      setCurrentView("default")
      setBentoView("main")
    } else if (currentView === "bento" && bentoView === "main") {
      setCurrentView("default")
      setBentoView("main")
    } else if (currentView === "create" || currentView === "calendar" || currentView === "content" || currentView === "export" || currentView === "study" || currentView === "study-plan" || currentView === "tutor") {
      setCurrentView("default")
      setBentoView("main")
    } else {
      setCurrentView("default")
      setBentoView("main")
    }
  }

  const handleContentClick = (content: any) => {
    setCurrentContent(content)
    setCurrentView("content")
  }

  const handleSave = async () => {
    if (!currentContent) return
    
    setIsSaving(true)
    try {
      // Save logic here - similar to existing save functionality
      console.log('Saving content:', currentContent)
      
      // Show success toast
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({
          title: "Content saved",
          description: "Your content has been saved successfully.",
        })
      } catch (_) {}
      
    } catch (error) {
      console.error('Error saving content:', error)
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({
          title: "Save failed",
          description: 'Please try again.',
        })
      } catch (_) {}
    } finally {
      setIsSaving(false)
    }
  }

  const getContentByType = (type: string) => {
    return savedContent.filter(content => content.type === type)
  }

  const getContentByUnit = (unitId: number) => {
    return savedContent.filter(content => content.unitId === unitId)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#C9F2C7]/40 via-white to-[#47624f]/20">
      {/* Unified Header with DynamicActionBar */}
      <div className={`px-6 py-4 transition-all duration-300 ${sidebarOpen ? 'ml-80' : ''} relative z-50`}>
        <DynamicActionBar 
          actions={[
            {
              id: "nav",
              label: "",
              icon: Menu,
              onClick: () => setSidebarOpen(true),
              onMouseEnter: () => {
                setSidebarOpen(true);
                setSidebarHovered(true);
              },
              content: <div className="p-4 text-center">Navigation menu</div>,
              dimensions: { width: 300, height: 100 },
            },
            {
              id: "upload",
              label: "Manage Uploads",
              icon: Upload,
              content: <div className="p-4 text-center">Upload functionality coming soon...</div>,
              dimensions: { width: 300, height: 100 },
            },
                         {
               id: "create",
               label: "View Materials",
               icon: BookOpen,
               content: (
                 <div className="flex flex-col items-center gap-1 py-4 px-6">
                   {[
                     { name: "Readings", type: "reading" },
                     { name: isStudent ? "Notes" : "Lesson Plans", type: isStudent ? "notes" : "lesson-plan" },
                     { name: "Homework", type: "homework" },
                     { name: isStudent ? "Flashcards" : "Exams", type: isStudent ? "flashcards" : "exam" },
                   ].map((item) => (
                     <div key={item.name} className="group w-full">
                       <div 
                         className="mx-auto flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl py-2 duration-300 group-hover:w-[95%] group-hover:bg-black/5 group-hover:px-3"
                         onClick={() => {
                           if (isStudent && (item.type === "notes" || item.type === "flashcards")) {
                             // No functionality for student notes/flashcards
                             console.log(`${item.name} clicked - functionality coming soon`)
                           } else {
                             handleContentTypeClick(item.type)
                           }
                         }}
                       >
                         <div className="flex items-center gap-3">
                           <span className="font-bold">{item.name}</span>
                         </div>
                       </div>
                     </div>
                   ))}
                   <div className="mt-4 h-[2px] w-full bg-black/10"></div>
                 </div>
               ),
               dimensions: { width: 300, height: 200 },
             },
            {
              id: "integrate",
              label: "Integrate",
              icon: Link,
              onClick: () => {
                setCurrentView("export")
              },
              content: null,
              dimensions: { width: 0, height: 0 },
            },
          ]}
          className="sticky top-0 z-50 relative"
        />
      </div>
      
      {/* Save button for content view */}
      {currentView === "content" && currentContent && (
        <div className="absolute top-4 right-4 z-50">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f] text-white"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}

             <div 
         className={`flex min-h-[calc(100vh-80px)] transition-all duration-300 ${sidebarOpen ? 'ml-80' : ''}`}
       >

                 {/* Canvas Area */}
         <div className={`flex-1 transition-all duration-300 overflow-y-auto ${sidebarOpen ? 'w-[calc(100vw-320px)]' : 'w-full'}`}>
          {/* Course Title Section - Always visible in default state */}
          <div className={`px-6 py-4 transition-all duration-300`}>
            <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-[#47624f] mb-2">{courseData.courseName}</h1>
                  <div className="flex items-center gap-6 text-gray-600">
                                         <span className="flex items-center gap-2">
                       <span className="font-semibold">{isStudent ? "Student:" : "Professor:"}</span>
                       <span>{courseData.professor || "User Name"}</span>
                     </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">Duration:</span>
                      <span>{getCourseDuration()}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">Schedule:</span>
                      <span>{getLectureSchedule()}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-[#47624f] text-white">
                    {courseData.subject} • {courseData.level}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {currentView === "default" && (
            <div className="px-6 h-[calc(100vh-280px)]">
              <BentoGrid className="lg:grid-rows-4 h-full">
                <BentoCard
                  name="Upload"
                  description="Add Previous Materials, Syllabi, and Curriculum Standards to Shape Course"
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-5"
                  Icon={Upload}
                  onClick={() => setCurrentView("upload")}
                />
                <BentoCard
                  name={isStudent ? "Study" : "Create Materials"}
                  description={isStudent ? "Access your study materials and tools" : "Click to Create Personalized Readings, Lesson Plans, Assignments, and Exams"}
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-5"
                  Icon={BookOpen}
                  onClick={isStudent ? handleStudyClick : () => setCurrentView("content-expanded")}
                />
                <BentoCard
                  name={isStudent ? "Tutor" : "Calendar"}
                  description={isStudent ? "Get help from AI tutor" : "View Course Calendar"}
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-5"
                  Icon={isStudent ? MessageSquare : Calendar}
                  onClick={isStudent ? handleTutorClick : handleCalendarClick}
                />
              </BentoGrid>
            </div>
          )}

          {currentView === "study" && (
            <div className="px-6 h-[calc(100vh-280px)]">
              <BentoGrid className="lg:grid-rows-4 h-full">
                <BentoCard
                  name="Upload"
                  description="Add Previous Materials, Syllabi, and Curriculum Standards to Shape Course"
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-5"
                  Icon={Upload}
                  onClick={() => setCurrentView("upload")}
                />
                <div className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-5 bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-4 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-[#47624f]">Study Tools</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentView("default")}
                        className="text-[#47624f] hover:bg-[#47624f] hover:text-white"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      {[
                        { name: "Study Plan", type: "study-plan", icon: Calendar },
                        { name: "Notes", type: "notes", icon: FileText },
                        { name: "Flashcards", type: "flashcards", icon: BookOpen },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div 
                            key={item.type}
                            className="group relative bg-white/20 backdrop-blur-sm border border-[#47624f]/30 rounded-lg p-3 cursor-pointer hover:bg-[#47624f] hover:border-[#47624f] transition-all duration-300 overflow-hidden"
                            onClick={() => {
                              if (item.type === "study-plan") {
                                handleStudyPlanClick()
                              } else {
                                // No functionality for now
                                console.log(`${item.name} clicked - functionality coming soon`)
                              }
                            }}
                          >
                            {/* Diagonal shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                            </div>
                            
                            <div className="relative z-10 flex items-center gap-3">
                              <Icon className="w-6 h-6 text-[#47624f] group-hover:text-white transition-colors duration-300" />
                              <h4 className="font-semibold text-[#47624f] group-hover:text-white transition-colors duration-300">
                                {item.name}
                              </h4>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <BentoCard
                  name="Tutor"
                  description="Get help from AI tutor"
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-5"
                  Icon={MessageSquare}
                  onClick={handleTutorClick}
                />
              </BentoGrid>
            </div>
          )}

          {currentView === "study-plan" && (
            <div className="px-6 min-h-[calc(100vh-280px)]">
              <div className="min-h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-[#47624f]">Study Plan</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView("study")}
                    className="text-[#47624f] hover:bg-[#47624f] hover:text-white"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </div>

                {!studyPlanData.content ? (
                  /* Unit Selection and Topic Input */
                  <div className="flex-1 bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <h3 className="text-2xl font-semibold text-[#47624f] text-center mb-6">
                        Create Your Study Plan
                      </h3>
                      
                      {/* Unit Selection */}
                      <div className="space-y-3">
                        <label className="block text-lg font-medium text-[#47624f]">
                          Select a Unit to Focus On:
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {courseData.calendar?.map((unit: any) => (
                            <div
                              key={unit.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                studyPlanData.selectedUnit?.id === unit.id
                                  ? 'border-[#47624f] bg-[#47624f]/10'
                                  : 'border-gray-300 hover:border-[#47624f]/50'
                              }`}
                              onClick={() => setStudyPlanData(prev => ({ ...prev, selectedUnit: unit }))}
                            >
                              <h4 className="font-semibold text-[#47624f]">{unit.title}</h4>
                              <p className="text-sm text-gray-600">Week {unit.week}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Topic Input */}
                      {studyPlanData.selectedUnit && (
                        <div className="space-y-3">
                          <label className="block text-lg font-medium text-[#47624f]">
                            What specific topic are you studying?
                          </label>
                          <textarea
                            value={studyPlanData.topic}
                            onChange={(e) => setStudyPlanData(prev => ({ ...prev, topic: e.target.value }))}
                            placeholder="e.g., Derivatives, Photosynthesis, Shakespeare's Sonnets..."
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47624f] focus:border-transparent resize-none"
                            rows={3}
                          />
                                                     <Button
                             onClick={generateStudyPlan}
                             disabled={!studyPlanData.topic.trim() || isGeneratingStudyPlan}
                             className="w-full bg-[#47624f] hover:bg-[#3a4f3f] text-white py-3 px-6 text-lg font-semibold disabled:opacity-50"
                           >
                             {isGeneratingStudyPlan ? (
                               <div className="flex items-center gap-2">
                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                 <span>Generating Study Plan...</span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-2">
                                 <Calendar className="w-5 h-5" />
                                 <span>Generate Study Plan</span>
                               </div>
                             )}
                           </Button>
                           
                           {isGeneratingStudyPlan && (
                             <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                               <p className="text-blue-700 text-sm text-center">
                                 AI is creating your personalized study plan. This may take a few moments...
                               </p>
                             </div>
                           )}
                          
                                                     {studyPlanError && (
                             <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                               <p className="text-red-700 text-sm font-medium">Error: {studyPlanError}</p>
                               <p className="text-red-600 text-xs mt-1">Please try again or contact support if the issue persists.</p>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                                 ) : studyPlanData.content && studyPlanData.content.lessons && studyPlanData.content.lessons.length > 0 ? (
                   /* Study Plan Content */
                                       <div className="flex-1 bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-6 overflow-y-auto">
                     <div className="min-h-full flex flex-col">
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-[#47624f] mb-2">
                          <span>Card {studyPlanData.currentCardIndex + 1} of {studyPlanData.content.lessons.length}</span>
                          <span>{Math.round(((studyPlanData.currentCardIndex + 1) / studyPlanData.content.lessons.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#47624f] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((studyPlanData.currentCardIndex + 1) / studyPlanData.content.lessons.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-2">
                          Use ← → arrow keys to navigate, Space/Enter to flip cards
                        </div>
                      </div>

                                             {/* Content Card */}
                       <div className="flex-1 flex items-center justify-center">
                         <div className="w-full max-w-4xl">
                           <div className="bg-white/90 backdrop-blur-sm border-2 border-[#47624f] rounded-xl shadow-lg p-8 min-h-[400px] max-h-[600px] relative overflow-y-auto">
                            {!studyPlanData.isFlipped ? (
                              /* Lesson Content */
                              <div className="h-full">
                                <div className="mb-6">
                                  <h3 className="text-2xl font-bold text-[#47624f] mb-2">
                                    {studyPlanData.content.lessons[studyPlanData.currentCardIndex].title}
                                  </h3>
                                  <p className="text-gray-600">
                                    Unit: {studyPlanData.selectedUnit.title} • Topic: {studyPlanData.topic}
                                  </p>
                                </div>
                                <div className="prose prose-lg max-w-none">
                                  <TutorMessage content={studyPlanData.content.lessons[studyPlanData.currentCardIndex].content} />
                                </div>
                                <div className="absolute bottom-4 right-4">
                                  <Button
                                    onClick={flipCard}
                                    className="bg-[#47624f] hover:bg-[#3a4f3f] text-white"
                                  >
                                    Practice Recall
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Recall Questions */
                              <div className="h-full">
                                <div className="mb-6">
                                  <h3 className="text-2xl font-bold text-[#47624f] mb-2">
                                    Active Recall Practice
                                  </h3>
                                  <p className="text-gray-600">
                                    Answer these questions to test your understanding
                                  </p>
                                </div>
                                                                                                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                                    {studyPlanData.content.lessons[studyPlanData.currentCardIndex].questions.map((question: any, qIndex: number) => {
                                     const questionKey = `${studyPlanData.currentCardIndex}-${qIndex}`
                                     const result = studyPlanData.questionResults[questionKey]
                                     const userAnswer = studyPlanData.userAnswers[questionKey] || ''
                                     
                                     return (
                                       <div key={qIndex} className="space-y-3">
                                         <h4 className="text-lg font-semibold text-[#47624f]">
                                           Question {qIndex + 1}: {question.text}
                                         </h4>
                                         
                                         {!result ? (
                                           <>
                                             <textarea
                                               value={userAnswer}
                                               onChange={(e) => setStudyPlanData(prev => ({
                                                 ...prev,
                                                 userAnswers: {
                                                   ...prev.userAnswers,
                                                   [questionKey]: e.target.value
                                                 }
                                               }))}
                                               placeholder="Type your answer here..."
                                               className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47624f] focus:border-transparent resize-none"
                                               rows={3}
                                             />
                                             <Button
                                               className="bg-[#47624f] hover:bg-[#3a4f3f] text-white"
                                               onClick={() => evaluateAnswer(qIndex, userAnswer)}
                                               disabled={!userAnswer.trim()}
                                             >
                                               Submit Answer
                                             </Button>
                                           </>
                                         ) : (
                                           <div className={`p-4 rounded-lg border-2 ${
                                             result.isCorrect 
                                               ? 'bg-green-50 border-green-200' 
                                               : 'bg-red-50 border-red-200'
                                           }`}>
                                             <div className="flex items-center gap-2 mb-2">
                                               {result.isCorrect ? (
                                                 <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                   <span className="text-white text-xs">✓</span>
                                                 </div>
                                               ) : (
                                                 <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                   <span className="text-white text-xs">✗</span>
                                                 </div>
                                               )}
                                               <span className={`font-semibold ${
                                                 result.isCorrect ? 'text-green-700' : 'text-red-700'
                                               }`}>
                                                 {result.isCorrect ? 'Correct!' : 'Incorrect'}
                                               </span>
                                             </div>
                                             <p className={`text-sm ${
                                               result.isCorrect ? 'text-green-600' : 'text-red-600'
                                             }`}>
                                               {result.feedback}
                                             </p>
                                             {!result.isCorrect && (
                                               <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                                 <p className="text-sm text-blue-700">
                                                   <strong>Correct Answer:</strong> {question.correctAnswer}
                                                 </p>
                                               </div>
                                             )}
                                           </div>
                                         )}
                                       </div>
                                     )
                                   })}
                                 </div>
                                <div className="absolute bottom-4 right-4">
                                  <Button
                                    onClick={flipCard}
                                    variant="outline"
                                    className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white"
                                  >
                                    Back to Content
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between mt-6">
                        <Button
                          onClick={prevCard}
                          disabled={studyPlanData.currentCardIndex === 0}
                          variant="outline"
                          className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                        
                        <Button
                          onClick={resetStudyPlan}
                          variant="ghost"
                          className="text-[#47624f] hover:bg-[#47624f] hover:text-white"
                        >
                          New Study Plan
                        </Button>

                        <Button
                          onClick={nextCard}
                          disabled={studyPlanData.currentCardIndex >= studyPlanData.content.lessons.length - 1}
                          className="bg-[#47624f] hover:bg-[#3a4f3f] text-white disabled:opacity-50"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Error State */
                  <div className="flex-1 bg-red-50 border-2 border-red-200 rounded-xl shadow-lg p-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-red-700 mb-2">Study Plan Error</h3>
                      <p className="text-red-600 mb-4">There was an issue loading your study plan content.</p>
                      <Button
                        onClick={resetStudyPlan}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Start Over
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === "content-expanded" && (
            <div className="px-6 h-[calc(100vh-280px)]">
              <BentoGrid className="lg:grid-rows-4 h-full">
                <BentoCard
                  name="Uploads"
                  description=""
                  href="#"
                  cta="View and Manage Uploads"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3"
                  Icon={Upload}
                  onClick={() => setCurrentView("upload")}
                />
                <div className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-5 bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-4 overflow-hidden">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-[#47624f]">Create Materials</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentView("default")}
                        className="text-[#47624f] hover:bg-[#47624f] hover:text-white"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      {[
                        { name: "Readings", type: "reading", icon: FileText },
                        { name: "Lesson Plans", type: "lesson-plan", icon: BookOpen },
                        { name: "Homework", type: "homework", icon: PenTool },
                        { name: "Exams", type: "exam", icon: GraduationCap },
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div 
                            key={item.type}
                            className="group relative bg-white/20 backdrop-blur-sm border border-[#47624f]/30 rounded-lg p-3 cursor-pointer hover:bg-[#47624f] hover:border-[#47624f] transition-all duration-300 overflow-hidden"
                            onClick={() => handleCreateClick(item.type)}
                          >
                            {/* Diagonal shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                            </div>
                            
                            <div className="relative z-10 flex items-center gap-3">
                              <Icon className="w-6 h-6 text-[#47624f] group-hover:text-white transition-colors duration-300" />
                              <h4 className="font-semibold text-[#47624f] group-hover:text-white transition-colors duration-300">
                                {item.name}
                              </h4>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <BentoCard
                  name="Manage"
                  description=""
                  href="#"
                  cta="Manage Learning and Content Distribution"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-5"
                  Icon={Settings}
                  onClick={() => {}}
                />
                <BentoCard
                  name="Calendar"
                  description=""
                  href="#"
                  cta="View Course Calendar"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-5"
                  Icon={Calendar}
                  onClick={handleCalendarClick}
                />
              </BentoGrid>
            </div>
          )}

          {currentView === "export" && (
            <div className="space-y-6 px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackClick}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              <CourseExport 
                courseId={courseData.courseId}
                courseName={courseData.courseName}
              />
            </div>
          )}

          {currentView === "create" && selectedContentType && (
            <div className="px-6 space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackClick}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              <ContentGenerator 
                type={selectedContentType}
                courseData={courseData}
                onBack={() => setCurrentView("default")}
              />
            </div>
          )}

          {currentView === "bento" && bentoView === "main" && (
            <div className="p-6 h-full">
              <BentoGrid className="lg:grid-rows-3 h-full">
                <BentoCard
                  name="Uploads"
                  description=""
                  href="#"
                  cta="View and Manage Uploads"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
                  Icon={Upload}
                  onClick={() => {}}
                />
                <BentoCard
                  name="Content"
                  description=""
                  href="#"
                  cta="View Created Content"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-4"
                  Icon={BookOpen}
                  onClick={handleBentoContentClick}
                />
                <BentoCard
                  name="Manage"
                  description=""
                  href="#"
                  cta="Manage Learning and Content Distribution"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-4"
                  Icon={Settings}
                  onClick={() => {}}
                />
                <BentoCard
                  name="Calendar"
                  description=""
                  href="#"
                  cta="View Course Calendar"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-4"
                  Icon={Calendar}
                  onClick={handleCalendarClick}
                />
              </BentoGrid>
            </div>
          )}

          {currentView === "calendar" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackClick}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
                <CourseCalendar courseData={courseData} />
              </div>
            </div>
          )}

          {currentView === "content-list" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackClick}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              
              <div className="space-y-4">
                <Card 
                  className="bg-gradient-to-r from-[#47624f] to-[#707D7F] text-white cursor-pointer hover:from-[#000000] hover:to-[#47624f] transition-all duration-200"
                  onClick={() => handleCreateClick(selectedContentType)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Plus className="w-6 h-6" />
                      <h3 className="text-xl font-semibold">
                        Create more {selectedContentType.replace('-', ' ')}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
                
                {courseData.calendar?.map((unit: any) => {
                  const unitContent = getContentByUnit(unit.id).filter((content: any) => content.type === selectedContentType)
                  if (unitContent.length === 0) return null
                  
                  return (
                    <Card key={unit.id} className="bg-white/80 backdrop-blur-sm border-2 border-[#47624f] shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-[#47624f]">{unit.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {unitContent.map((content: any) => (
                            <div
                              key={content.id}
                              className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                              onClick={() => handleContentClick(content)}
                            >
                              <h4 className="font-medium text-gray-900">{content.unitTitle || `${selectedContentType.replace('-', ' ')} content`}</h4>
                              <div className="text-sm text-gray-600 mt-1 prose prose-sm max-w-none">
                                <SourcedContent content={content.content.substring(0, 200) + '...'} citations={content.specifications?.citations || []} sources={content.specifications?.sources || []} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {currentView === "content" && currentContent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={handleBackClick}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-8 min-h-full shadow-lg">
                                    <SourcedContent content={currentContent.content} citations={currentContent.specifications?.citations || []} sources={currentContent.specifications?.sources || []} />
              </div>
            </div>
          )}

          {currentView === "upload" && (
            <div className="px-6 h-[calc(100vh-280px)] overflow-y-auto">
              <UploadView 
                courseData={courseData}
                onBack={() => setCurrentView("default")}
              />
            </div>
          )}

          {currentView === "tutor" && (
            <div className="px-6 h-[calc(100vh-280px)]">
              <div className="h-full flex flex-col">
                {/* Chat Messages Area */}
                <div className="flex-1 bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-6 mb-4 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Start a conversation with your AI tutor</p>
                    </div>
                  ) : (
                                         <div className="space-y-6">
                       {chatMessages.map((message, index) => (
                         <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                           {message.role === 'user' ? (
                             <div className="inline-block bg-[#47624f] text-white rounded-xl px-4 py-2 max-w-[80%]">
                               {message.content}
                             </div>
                                                       ) : (
                              <TutorMessage content={message.content} />
                            )}
                         </div>
                       ))}
                                             {isLoading && (
                         <div className="text-left">
                           <div className="flex items-center gap-2 text-gray-600">
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#47624f]"></div>
                             <span className="text-sm">Tutor is thinking...</span>
                           </div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-4">
                                     <div className="flex items-end gap-3">
                     <div className="flex-1 relative">
                       <textarea
                         value={userInput}
                         onChange={handleInputChange}
                         onKeyPress={handleKeyPress}
                         placeholder="Ask your tutor a question..."
                         disabled={isLoading}
                         rows={1}
                         className="w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#47624f] focus:border-transparent transition-all duration-200 disabled:opacity-50 resize-none overflow-hidden"
                         style={{ minHeight: '44px', maxHeight: '200px' }}
                       />
                     </div>
                    <button 
                      onClick={handleSendMessage}
                      disabled={isLoading || !userInput.trim()}
                      className="bg-[#47624f] hover:bg-[#3a4f3f] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors duration-200 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {isLoading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Sidebar */}
      <NavigationSidebar 
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setSidebarHovered(false);
        }}
        courses={allCourses}
        currentPage={courseData.courseName}
        onCourseSelect={handleCourseSelect}
        currentCourseId={courseData.courseId}
      />

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
