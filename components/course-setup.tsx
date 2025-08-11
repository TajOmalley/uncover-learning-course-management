"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Calendar, GraduationCap } from "lucide-react"

interface CourseSetupProps {
  onComplete: (data: any) => void
}

export function CourseSetup({ onComplete }: CourseSetupProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<{
    subject: string
    courseName: string
    level: string
    startDate: string
    endDate: string
    lectureSchedule: Record<string, string>
  }>({
    subject: "",
    courseName: "",
    level: "",
    startDate: "",
    endDate: "",
    lectureSchedule: {},
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  const questions = [
    {
      id: "subject",
      title: "What is the subject of your course?",
      placeholder: "e.g., Computer Science, Mathematics, History",
      icon: BookOpen,
    },
    {
      id: "courseName",
      title: "What is the name of your course?",
      placeholder: "e.g., Introduction to Data Structures",
      icon: GraduationCap,
    },
    {
      id: "level",
      title: "What is the level of your course?",
      type: "select",
      options: ["Undergraduate - Introductory", "Undergraduate - Intermediate", "Undergraduate - Advanced", "Graduate"],
      icon: BookOpen,
    },
    {
      id: "dateRange",
      title: "What is the date range of your course?",
      type: "dateRange",
      icon: Calendar,
    },
    {
      id: "lectureSchedule",
      title: "What is your lecture schedule?",
      type: "lectureSchedule",
      icon: Calendar,
    },
  ]

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setIsGenerating(true)
    
    try {
      // Call the LLM API to generate course units
      const response = await fetch('/api/generate-units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate course units')
      }

      // Save course to database
      const courseResponse = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.courseName,
          subject: formData.subject,
          level: formData.level,
          startDate: formData.startDate,
          endDate: formData.endDate,
          lectureSchedule: formData.lectureSchedule,
          numberOfUnits: result.units.length,
          units: result.units,
        }),
      })

      if (!courseResponse.ok) {
        throw new Error(`Failed to save course: ${courseResponse.status}`)
      }

      const courseResult = await courseResponse.json()
      
      if (!courseResult.success) {
        throw new Error(courseResult.error || 'Failed to save course')
      }

      const courseData = {
        ...formData,
        calendar: result.units,
        courseId: courseResult.course.id,
      }

      onComplete(courseData)
    } catch (error) {
      console.error('Error generating course units:', error)
      
      // Try to save course with mock units if generation fails
      try {
        const mockUnits = generateMockCalendar(formData)
        
        const courseResponse = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: formData.courseName,
            subject: formData.subject,
            level: formData.level,
            startDate: formData.startDate,
            endDate: formData.endDate,
            lectureSchedule: formData.lectureSchedule,
            numberOfUnits: mockUnits.length,
            units: mockUnits,
          }),
        })

        if (courseResponse.ok) {
          const courseResult = await courseResponse.json()
          if (courseResult.success) {
            const courseData = {
              ...formData,
              calendar: mockUnits,
              courseId: courseResult.course.id,
            }
            onComplete(courseData)
            return
          }
        }
      } catch (saveError) {
        console.error('Error saving course with mock data:', saveError)
      }
      
      // If all else fails, still complete with mock data
      const courseData = {
        ...formData,
        calendar: generateMockCalendar(formData),
      }
      
      onComplete(courseData)
    } finally {
      setIsGenerating(false)
    }
  }

      const generateMockCalendar = (data: any) => {
    // Mock calendar generation
    return [
      { id: 1, title: "Course Introduction & Fundamentals", week: 1, type: "unit", color: "bg-[#47624f]" },
      { id: 2, title: "Core Concepts & Theory", week: 3, type: "unit", color: "bg-[#707D7F]" },
      { id: 3, title: "Practical Applications", week: 6, type: "unit", color: "bg-[#B2A29E]" },
      { id: 4, title: "Advanced Topics", week: 9, type: "unit", color: "bg-[#C9F2C7]" },
      { id: 5, title: "Final Projects & Assessment", week: 12, type: "unit", color: "bg-[#000000]" },
    ]
  }

  const currentQuestion = questions[currentStep]
  const Icon = currentQuestion.icon

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47624f] mx-auto"></div>
                              <h3 className="text-lg font-semibold text-[#000000]">Building Your Course</h3>
              <p className="text-[#707D7F]">
                Creating a personalized curriculum structure for your course...
              </p>
              <p className="text-sm text-[#707D7F]">
                This may take a few moments...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <button
        onClick={() => window.location.href = '/'}
        className="absolute top-20 left-2 text-white hover:text-[#C9F2C7] transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#47624f] to-[#707D7F] rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#47624f] to-[#707D7F] bg-clip-text text-transparent">
            Course Setup
          </CardTitle>
          <CardDescription className="text-lg text-[#707D7F]">
            Step {currentStep + 1} of {questions.length}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="w-full bg-[#B2A29E] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#47624f] to-[#707D7F] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#000000]">{currentQuestion.title}</h2>

            {currentQuestion.type === "select" ? (
              <Select
                value={formData[currentQuestion.id as keyof Omit<typeof formData, 'lectureSchedule'>]}
                onValueChange={(value) => setFormData({ ...formData, [currentQuestion.id]: value })}
              >
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select course level" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : currentQuestion.type === "dateRange" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>
            ) : currentQuestion.type === "lectureSchedule" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        if (selectedDays.includes(day)) {
                          setSelectedDays(selectedDays.filter(d => d !== day))
                          const newSchedule = { ...formData.lectureSchedule }
                          delete newSchedule[day]
                          setFormData({ ...formData, lectureSchedule: newSchedule })
                        } else {
                          setSelectedDays([...selectedDays, day])
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedDays.includes(day)
                          ? 'border-[#47624f] bg-[#C9F2C7] text-[#000000]'
                          : 'border-[#B2A29E] bg-white text-[#707D7F] hover:border-[#47624f]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                
                {selectedDays.length > 0 && (
                  <div className="p-4 bg-[#C9F2C7]/20 rounded-lg border border-[#B2A29E]/20">
                    <Label htmlFor="duration">How long are the lectures on the selected days?</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="duration"
                        placeholder="e.g., 90 minutes"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const duration = (e.target as HTMLInputElement).value
                            const newSchedule = { ...formData.lectureSchedule }
                            selectedDays.forEach(day => {
                              newSchedule[day] = duration
                            })
                            setFormData({
                              ...formData,
                              lectureSchedule: newSchedule
                            })
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('duration') as HTMLInputElement
                          const duration = input.value
                          if (duration) {
                            const newSchedule = { ...formData.lectureSchedule }
                            selectedDays.forEach(day => {
                              newSchedule[day] = duration
                            })
                            setFormData({
                              ...formData,
                              lectureSchedule: newSchedule
                            })
                          }
                        }}
                        className="bg-gradient-to-r from-[#47624f] to-[#707D7F]"
                      >
                        Set for All Selected Days
                      </Button>
                    </div>
                  </div>
                )}
                
                {Object.keys(formData.lectureSchedule).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-[#000000]">Selected Schedule:</h4>
                    {Object.entries(formData.lectureSchedule).map(([day, duration]) => (
                      <div key={day} className="flex justify-between items-center p-2 bg-[#C9F2C7]/20 rounded">
                        <span className="text-[#000000]">{day}</span>
                        <span className="text-[#707D7F]">{duration}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Input
                placeholder={currentQuestion.placeholder}
                value={formData[currentQuestion.id as keyof Omit<typeof formData, 'lectureSchedule'>]}
                onChange={(e) => setFormData({ ...formData, [currentQuestion.id]: e.target.value })}
                className="h-12 text-lg"
              />
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-8"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (currentQuestion.type === "dateRange" && (!formData.startDate || !formData.endDate)) ||
                (currentQuestion.type === "lectureSchedule" && Object.keys(formData.lectureSchedule).length === 0) ||
                (currentQuestion.type !== "dateRange" && currentQuestion.type !== "lectureSchedule" && !formData[currentQuestion.id as keyof typeof formData])
              }
              className="px-8 bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
            >
              {currentStep === questions.length - 1 ? "Generate Course" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
