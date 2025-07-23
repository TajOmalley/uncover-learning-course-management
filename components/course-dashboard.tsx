"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileText, PenTool, GraduationCap, Sparkles, Plus, Edit, Eye } from "lucide-react"
import { CourseCalendar } from "@/components/course-calendar"
import { ContentGenerator } from "@/components/content-generator"

interface CourseDashboardProps {
  courseData: any
}

export function CourseDashboard({ courseData }: CourseDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatorType, setGeneratorType] = useState("")

  const contentTypes = [
    {
      id: "lesson-plan",
      title: "Lesson Plans",
      description: "Generate detailed lesson plans for your course units",
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      count: 12,
    },
    {
      id: "reading",
      title: "Reading Content",
      description: "Create comprehensive reading materials and resources",
      icon: FileText,
      color: "from-green-500 to-green-600",
      count: 8,
    },
    {
      id: "homework",
      title: "Homework Problems",
      description: "Design practice problems and assignments",
      icon: PenTool,
      color: "from-purple-500 to-purple-600",
      count: 15,
    },
    {
      id: "exam",
      title: "Exams",
      description: "Generate comprehensive exams and assessments",
      icon: GraduationCap,
      color: "from-orange-500 to-orange-600",
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{courseData.courseName}</h1>
              <p className="text-slate-300 mt-2">
                {courseData.subject} • {courseData.level}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {courseData.startDate} - {courseData.endDate}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {courseData.calendar?.length || 0} Units
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Sparkles className="w-4 h-4" />
                AI-Powered Course Management
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  AI Content Generation
                </CardTitle>
                <CardDescription>
                  Generate course materials instantly using AI based on your course context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <Card
                        key={type.id}
                        className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-indigo-200"
                      >
                        <CardContent className="p-6">
                          <div
                            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                          >
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <h3 className="font-semibold text-slate-800 mb-2">{type.title}</h3>
                          <p className="text-sm text-slate-600 mb-4">{type.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{type.count} items</Badge>
                            <Button
                              size="sm"
                              onClick={() => handleGenerateContent(type.id)}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
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
                  <CardDescription>AI-generated course units and timeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseData.calendar?.map((unit: any, index: number) => (
                      <div
                        key={unit.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className={`w-3 h-3 rounded-full ${unit.color}`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{unit.title}</h4>
                          <p className="text-sm text-slate-600">Week {unit.week}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Units</span>
                    <Badge variant="secondary">{courseData.calendar?.length || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Course Duration</span>
                    <Badge variant="secondary">16 weeks</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Generated Content</span>
                    <Badge variant="secondary">39 items</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Last Updated</span>
                    <Badge variant="secondary">Today</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <CourseCalendar courseData={courseData} />
          </TabsContent>

          <TabsContent value="content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Card key={type.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {type.title}
                      </CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">Generated Items</span>
                          <Badge variant="secondary">{type.count}</Badge>
                        </div>
                        <Button className="w-full" onClick={() => handleGenerateContent(type.id)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Generate New
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
