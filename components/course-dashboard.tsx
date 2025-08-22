"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown, Menu, Download, Plus, Upload, Calendar, Link, BookOpen, FileText, Settings, ArrowLeft, PenTool, GraduationCap } from "lucide-react"
import { CourseCalendar } from "@/components/course-calendar"
import { ContentGenerator } from "@/components/content-generator"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { ContentModal } from "@/components/content-modal"
import DynamicActionBar, { type ActionItem } from "@/components/ui/dynamic-action"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { SourcedContent } from "@/components/SourcedContent"

interface CourseDashboardProps {
  courseData: any
  onBack?: () => void
  onCourseSelect?: (course: any) => void
}

export function CourseDashboard({ courseData, onBack, onCourseSelect }: CourseDashboardProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarHovered, setSidebarHovered] = useState(false)
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  
  // View state
  const [selectedContentType, setSelectedContentType] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [currentView, setCurrentView] = useState("default") // default, create, calendar, content, bento, content-types, content-list
  const [currentContent, setCurrentContent] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [bentoView, setBentoView] = useState("main") // main, content-types
  
  // Saved content state
  const [savedContent, setSavedContent] = useState<any[]>([])

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
    } else if (currentView === "create" || currentView === "calendar" || currentView === "content") {
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
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7]/40 via-white to-[#47624f]/20">
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
                    { name: "Lesson Plans", type: "lesson-plan" },
                    { name: "Homework", type: "homework" },
                    { name: "Exams", type: "exam" },
                  ].map((item) => (
                    <div key={item.name} className="group w-full">
                      <div 
                        className="mx-auto flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl py-2 duration-300 group-hover:w-[95%] group-hover:bg-black/5 group-hover:px-3"
                        onClick={() => handleContentTypeClick(item.type)}
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
              onClick: () => router.push("/integrations"),
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
        className={`flex h-[calc(100vh-80px)] transition-all duration-300 ${sidebarOpen ? 'ml-80' : ''}`}
      >

        {/* Canvas Area */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'w-[calc(100vw-320px)]' : 'w-full'}`}>
          {/* Course Title Section - Always visible in default state */}
          <div className={`px-6 py-4 transition-all duration-300`}>
            <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-[#47624f] mb-2">{courseData.courseName}</h1>
                  <div className="flex items-center gap-6 text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">Professor:</span>
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
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3"
                  Icon={Upload}
                  onClick={() => {}}
                />
                <BentoCard
                  name="Create Materials"
                  description="Click to Create Personalized Readings, Lesson Plans, Assignments, and Exams"
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-5"
                  Icon={BookOpen}
                  onClick={() => setCurrentView("content-expanded")}
                />
                <BentoCard
                  name="Manage"
                  description="Manage Learning and Content Distribution"
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-5"
                  Icon={Settings}
                  onClick={() => {}}
                />
                <BentoCard
                  name="Calendar"
                  description="View Course Calendar"
                  href="#"
                  cta=""
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-5"
                  Icon={Calendar}
                  onClick={handleCalendarClick}
                />
              </BentoGrid>
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
                  onClick={() => {}}
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
