"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, ChevronDown, Menu, Download, Plus, Upload, Calendar, Link, BookOpen, FileText, Settings, ArrowLeft } from "lucide-react"
import { CourseCalendar } from "@/components/course-calendar"
import { ContentGenerator } from "@/components/content-generator"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { ContentModal } from "@/components/content-modal"
import DynamicActionBar, { type ActionItem } from "@/components/ui/dynamic-action"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { CitedMarkdown } from "@/components/CitedMarkdown"

interface CourseDashboardProps {
  courseData: any
  onBack?: () => void
}

export function CourseDashboard({ courseData, onBack }: CourseDashboardProps) {
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
    setCurrentView("content-list")
    setSelectedContentType(contentType)
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
              label: courseData.courseName,
              icon: Menu,
              content: <div className="p-4 text-center">Navigation menu</div>,
              dimensions: { width: 300, height: 100 },
              onClick: () => setSidebarOpen(true),
              onMouseEnter: () => {
                setSidebarOpen(true);
                setSidebarHovered(true);
              },
            },
            {
              id: "upload",
              label: "Upload",
              icon: Upload,
              content: <div className="p-4 text-center">Upload functionality coming soon...</div>,
              dimensions: { width: 300, height: 100 },
            },
            {
              id: "create",
              label: "Create",
              icon: Plus,
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
                        onClick={() => handleCreateClick(item.type)}
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
              content: <div className="p-4 text-center">Integration functionality coming soon...</div>,
              dimensions: { width: 300, height: 100 },
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
        <div className="flex-1 p-6">
          {currentView === "default" && (
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

          {currentView === "create" && selectedContentType && (
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
                <ContentGenerator 
                  type={selectedContentType}
                  courseData={courseData}
                  onBack={() => setCurrentView("default")}
                  onContentGenerated={(content) => {
                    setCurrentContent(content)
                    setCurrentView("content")
                  }}
                />
              </div>
            </div>
          )}

          {currentView === "bento" && bentoView === "content-types" && (
            <div className="p-6 h-full">
              <BentoGrid className="lg:grid-rows-3 h-full">
                <BentoCard
                  name="Readings"
                  description=""
                  href="#"
                  cta="View Readings"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
                  Icon={FileText}
                  onClick={() => handleContentTypeClick("reading")}
                />
                <BentoCard
                  name="Return"
                  description=""
                  href="#"
                  cta="Return to Course Dashboard"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-4"
                  Icon={ArrowLeft}
                  onClick={handleBentoReturnClick}
                />
                <BentoCard
                  name="Lesson Plans"
                  description=""
                  href="#"
                  cta="View Lesson Plans"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3"
                  Icon={BookOpen}
                  onClick={() => handleContentTypeClick("lesson-plan")}
                />
                <BentoCard
                  name="Homework"
                  description=""
                  href="#"
                  cta="View Homework"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2"
                  Icon={FileText}
                  onClick={() => handleContentTypeClick("homework")}
                />
                <BentoCard
                  name="Exams"
                  description=""
                  href="#"
                  cta="View Exams"
                  background={<div className="absolute -right-20 -top-20 opacity-60" />}
                  className="lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-4"
                  Icon={FileText}
                  onClick={() => handleContentTypeClick("exam")}
                />
              </BentoGrid>
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
                                <CitedMarkdown content={content.content.substring(0, 200) + '...'} />
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
                <CitedMarkdown content={currentContent.content} />
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
