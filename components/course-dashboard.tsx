"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileText, PenTool, GraduationCap, Plus, Edit, Eye, Menu } from "lucide-react"
import { CourseCalendar } from "@/components/course-calendar"
import { ContentGenerator } from "@/components/content-generator"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import { ContentModal } from "@/components/content-modal"

interface CourseDashboardProps {
  courseData: any
  onBack?: () => void
}

export function CourseDashboard({ courseData, onBack }: CourseDashboardProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatorType, setGeneratorType] = useState("")
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set())
  const [savedReadingContent, setSavedReadingContent] = useState<any[]>([])
  const [savedHomeworkContent, setSavedHomeworkContent] = useState<any[]>([])
  const [savedLessonPlanContent, setSavedLessonPlanContent] = useState<any[]>([])
  const [savedExamContent, setSavedExamContent] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [allCourses, setAllCourses] = useState<any[]>([])
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)

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
          // Group content by type
          const reading = result.content.filter((item: any) => item.type === 'reading')
          const homework = result.content.filter((item: any) => item.type === 'homework')
          const lessonPlans = result.content.filter((item: any) => item.type === 'lesson-plan')
          const exams = result.content.filter((item: any) => item.type === 'exam')
          
          setSavedReadingContent(reading)
          setSavedHomeworkContent(homework)
          setSavedLessonPlanContent(lessonPlans)
          setSavedExamContent(exams)
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

  const contentTypes = [
    {
      id: "lesson-plan",
      title: "Lesson Plans",
      description: "Generate detailed lesson plans for your course units",
      icon: BookOpen,
      color: "from-[#47624f] to-[#707D7F]",
      count: 12,
    },
    {
      id: "reading",
      title: "Reading Content",
      description: "Create comprehensive reading materials and resources",
      icon: FileText,
      color: "from-[#C9F2C7] to-[#47624f]",
      count: 8,
    },
    {
      id: "homework",
      title: "Homework Problems",
      description: "Design practice problems and assignments",
      icon: PenTool,
      color: "from-[#B2A29E] to-[#707D7F]",
      count: 15,
    },
    {
      id: "exam",
      title: "Exams",
      description: "Generate comprehensive exams and assessments",
      icon: GraduationCap,
      color: "from-[#000000] to-[#707D7F]",
      count: 4,
    },
  ]

  const handleGenerateContent = (type: string) => {
    setGeneratorType(type)
    setShowGenerator(true)
  }

  if (showGenerator) {
    return <ContentGenerator type={generatorType} courseData={courseData} onBack={() => setShowGenerator(false)} />
  }

  return (
    <div className="min-h-screen flex">
      <NavigationSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={courseData.courseName}
        courses={allCourses}
        onCourseSelect={(course) => {
          // Navigate to the selected course
          const courseData = {
            courseName: course.title,
            subject: course.subject,
            level: course.level,
            startDate: course.startDate,
            endDate: course.endDate,
            lectureSchedule: course.lectureSchedule,
            calendar: course.units,
            courseId: course.id,
          }
          // This would need to be handled by the parent component
          // For now, we'll reload the page with the new course
          window.location.href = `/?courseId=${course.id}`
        }}
        onAddCourse={() => {
          window.location.href = '/setup'
        }}
      />
      
      <div className={`flex-1 relative transition-all duration-300 ${sidebarOpen ? 'ml-80' : ''}`}>
                {/* Header */}
        <div className="bg-gradient-to-r from-[#47624f] via-[#707D7F] to-[#47624f] text-white relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-1/2 left-8 z-10 text-white hover:text-[#C9F2C7] transition-colors transform -translate-y-1/2"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="ml-20">
                <h1 className="text-3xl font-bold">{courseData.courseName}</h1>
              <p className="text-[#C9F2C7] mt-2">
                {courseData.subject} • {courseData.level}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-white">
                  {courseData.startDate} - {courseData.endDate}
                </Badge>
                <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-white">
                  {courseData.calendar?.length || 0} Units
                </Badge>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 bg-[#F2F7F3] rounded-2xl border border-white/20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Build Your Course, Your Way
                </CardTitle>
                <CardDescription>
                  Create and organize course materials tailored to your teaching style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Card
                        key={type.id}
                        className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-[#47624f]/20"
                      >
                        <CardContent className="p-6">
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                                            <h3 className="font-semibold text-[#000000] mb-2">{type.title}</h3>
                  <p className="text-sm text-[#707D7F] mb-4">{type.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{type.count} items</Badge>
                            <Button
                              size="sm"
                              onClick={() => handleGenerateContent(type.id)}
                              className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Generate
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Course Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                                  <CardTitle>Course Structure</CardTitle>
                <CardDescription>Course units and timeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseData.calendar?.map((unit: any, index: number) => {
                      const unitReadingContent = savedReadingContent.filter(content => content.unitId === unit.id)
                      const unitHomeworkContent = savedHomeworkContent.filter(content => content.unitId === unit.id)
                      const unitLessonPlanContent = savedLessonPlanContent.filter(content => content.unitId === unit.id)
                      const unitExamContent = savedExamContent.filter(content => content.unitId === unit.id)
                      const isExpanded = expandedUnits.has(unit.id)
                      
                      return (
                        <div
                          key={unit.id}
                          className="rounded-lg bg-[#C9F2C7]/20 hover:bg-[#C9F2C7]/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 p-4">
                            <div className={`w-3 h-3 rounded-full ${unit.color}`}></div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[#000000]">{unit.title}</h4>
                              <p className="text-sm text-[#707D7F]">Week {unit.week}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  const newExpanded = new Set(expandedUnits)
                                  if (isExpanded) {
                                    newExpanded.delete(unit.id)
                                  } else {
                                    newExpanded.add(unit.id)
                                  }
                                  setExpandedUnits(newExpanded)
                                }}
                              >
                                {isExpanded ? '−' : '+'}
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expandable content section */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-[#B2A29E]/20">
                              <div className="pt-4 space-y-4">
                                {/* Reading Content Section */}
                                <div className="space-y-3">
                                  <h5 className="font-medium text-[#000000] text-sm">Reading Content</h5>
                                  {unitReadingContent.length > 0 ? (
                                    <div className="space-y-2">
                                      {unitReadingContent.map((content) => (
                                        <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#B2A29E]/20">
                                          <div>
                                            <p className="text-sm font-medium text-[#000000]">{content.title}</p>
                                            <p className="text-xs text-[#707D7F]">
                                              Created: {new Date(content.createdAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                          <Button size="sm" variant="outline">
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-[#707D7F] italic">No reading content generated yet</p>
                                  )}
                                </div>

                                {/* Homework Content Section */}
                                <div className="space-y-3">
                                  <h5 className="font-medium text-[#000000] text-sm">Homework Problems</h5>
                                  {unitHomeworkContent.length > 0 ? (
                                    <div className="space-y-2">
                                      {unitHomeworkContent.map((content) => (
                                        <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#B2A29E]/20">
                                          <div>
                                            <p className="text-sm font-medium text-[#000000]">{content.title}</p>
                                            <p className="text-xs text-[#707D7F]">
                                              Created: {new Date(content.createdAt).toLocaleDateString()}
                                              {content.problemSpecs && (
                                                <span className="ml-2">
                                                  ({content.problemSpecs.totalProblems} problems: {content.problemSpecs.wordProblems} word, {content.problemSpecs.multipleChoiceProblems} multiple choice)
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <Button size="sm" variant="outline">
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-[#707D7F] italic">No homework problems generated yet</p>
                                  )}
                                </div>

                                {/* Lesson Plan Content Section */}
                                <div className="space-y-3">
                                  <h5 className="font-medium text-[#000000] text-sm">Lesson Plans</h5>
                                  {unitLessonPlanContent.length > 0 ? (
                                    <div className="space-y-2">
                                      {unitLessonPlanContent.map((content) => (
                                        <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#B2A29E]/20">
                                          <div>
                                            <p className="text-sm font-medium text-[#000000]">{content.title}</p>
                                            <p className="text-xs text-[#707D7F]">
                                              Created: {new Date(content.createdAt).toLocaleDateString()}
                                              {content.lectureLength && (
                                                <span className="ml-2">
                                                  ({content.lectureLength} minutes)
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <Button size="sm" variant="outline">
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-[#707D7F] italic">No lesson plans generated yet</p>
                                  )}
                                </div>

                                {/* Exam Content Section */}
                                <div className="space-y-3">
                                  <h5 className="font-medium text-[#000000] text-sm">Exams</h5>
                                  {unitExamContent.length > 0 ? (
                                    <div className="space-y-2">
                                      {unitExamContent.map((content) => (
                                        <div key={content.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#B2A29E]/20">
                                          <div>
                                            <p className="text-sm font-medium text-[#000000]">{content.title}</p>
                                            <p className="text-xs text-[#707D7F]">
                                              Created: {new Date(content.createdAt).toLocaleDateString()}
                                              {content.examSpecs && (
                                                <span className="ml-2">
                                                  ({content.examSpecs.totalExamTime} min: {content.examSpecs.wordProblems.count} word, {content.examSpecs.essayProblems.count} essay, {content.examSpecs.multipleChoice.count} multiple choice)
                                                </span>
                                              )}
                                            </p>
                                          </div>
                                          <Button size="sm" variant="outline">
                                            <Eye className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-[#707D7F] italic">No exams generated yet</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#707D7F]">Total Units</span>
                    <Badge variant="secondary">{courseData.calendar?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#707D7F]">Course Duration</span>
                    <Badge variant="secondary">16 weeks</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#707D7F]">Generated Content</span>
                    <Badge variant="secondary">39 items</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#707D7F]">Last Updated</span>
                    <Badge variant="secondary">Today</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CourseCalendar 
              courseData={courseData}
              onOpenContent={(id) => {
                setSelectedContentId(id)
                setContentModalOpen(true)
              }}
              onRequestGenerate={(type, unitId) => {
                // Switch to generator tab and preselect
                setActiveTab("overview")
                setGeneratorType(type)
                setShowGenerator(true)
                // ContentGenerator will allow unit selection; we can enhance to preselect by id later
              }}
            />
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-8">
              {/* Reading Content Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#47624f]" />
                    Reading Content
                  </CardTitle>
                  <CardDescription>Comprehensive reading materials and study guides</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedReadingContent.length > 0 ? (
                    <div className="space-y-4">
                      {savedReadingContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between p-4 bg-[#C9F2C7]/10 rounded-lg border border-[#B2A29E]/20">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f]">
                                Reading
                              </Badge>
                              <span className="text-sm text-[#707D7F]">
                                {new Date(content.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-[#000000] font-medium">
                              View: Unit {courseData.calendar?.findIndex((unit: any) => unit.id === content.unitId) + 1} - {courseData.calendar?.find((unit: any) => unit.id === content.unitId)?.title || 'Unknown Unit'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedContentId(content.id)
                                setContentModalOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#707D7F]">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-[#B2A29E]" />
                      <p>No reading content generated yet</p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
                        onClick={() => handleGenerateContent('reading')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Reading Content
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Homework Content Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-[#47624f]" />
                    Homework Problems
                  </CardTitle>
                  <CardDescription>Practice problems and assignments with solutions</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedHomeworkContent.length > 0 ? (
                    <div className="space-y-4">
                      {savedHomeworkContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between p-4 bg-[#C9F2C7]/10 rounded-lg border border-[#B2A29E]/20">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f]">
                                Homework
                              </Badge>
                              <span className="text-sm text-[#707D7F]">
                                {new Date(content.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-[#000000] font-medium">
                              View: Unit {courseData.calendar?.findIndex((unit: any) => unit.id === content.unitId) + 1} - {courseData.calendar?.find((unit: any) => unit.id === content.unitId)?.title || 'Unknown Unit'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedContentId(content.id)
                                setContentModalOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#707D7F]">
                      <PenTool className="w-12 h-12 mx-auto mb-4 text-[#B2A29E]" />
                      <p>No homework problems generated yet</p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
                        onClick={() => handleGenerateContent('homework')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Homework Problems
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Plans Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#47624f]" />
                    Lesson Plans
                  </CardTitle>
                  <CardDescription>Detailed lesson plans with objectives, activities, and assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedLessonPlanContent.length > 0 ? (
                    <div className="space-y-4">
                      {savedLessonPlanContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between p-4 bg-[#C9F2C7]/10 rounded-lg border border-[#B2A29E]/20">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f]">
                                Lesson Plan
                              </Badge>
                              <span className="text-sm text-[#707D7F]">
                                {new Date(content.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-[#000000] font-medium">
                              View: Unit {courseData.calendar?.findIndex((unit: any) => unit.id === content.unitId) + 1} - {courseData.calendar?.find((unit: any) => unit.id === content.unitId)?.title || 'Unknown Unit'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedContentId(content.id)
                                setContentModalOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#707D7F]">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 text-[#B2A29E]" />
                      <p>No lesson plans generated yet</p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
                        onClick={() => handleGenerateContent('lesson-plan')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Lesson Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Exams Section */}
              <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#47624f]" />
                    Exams
                      </CardTitle>
                  <CardDescription>Comprehensive exams with multiple question types</CardDescription>
                    </CardHeader>
                    <CardContent>
                  {savedExamContent.length > 0 ? (
                    <div className="space-y-4">
                      {savedExamContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between p-4 bg-[#C9F2C7]/10 rounded-lg border border-[#B2A29E]/20">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f]">
                                Exam
                              </Badge>
                              <span className="text-sm text-[#707D7F]">
                                {new Date(content.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-[#000000] font-medium">
                              View: Unit {courseData.calendar?.findIndex((unit: any) => unit.id === content.unitId) + 1} - {courseData.calendar?.find((unit: any) => unit.id === content.unitId)?.title || 'Unknown Unit'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedContentId(content.id)
                                setContentModalOpen(true)
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#707D7F]">
                      <GraduationCap className="w-12 h-12 mx-auto mb-4 text-[#B2A29E]" />
                      <p>No exams generated yet</p>
                      <Button 
                        className="mt-4 bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
                        onClick={() => handleGenerateContent('exam')}
                      >
                          <Plus className="w-4 h-4 mr-2" />
                        Generate Exam
                        </Button>
                      </div>
                  )}
                    </CardContent>
                  </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
      
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
