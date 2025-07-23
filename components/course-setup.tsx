"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Calendar, GraduationCap, Sparkles } from "lucide-react"

interface CourseSetupProps {
  onComplete: (data: any) => void
}

export function CourseSetup({ onComplete }: CourseSetupProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    subject: "",
    courseName: "",
    level: "",
    startDate: "",
    endDate: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)

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
      icon: Sparkles,
    },
    {
      id: "dateRange",
      title: "What is the date range of your course?",
      type: "dateRange",
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
    // Simulate LLM API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const courseData = {
      ...formData,
      calendar: generateMockCalendar(formData),
    }

    onComplete(courseData)
  }

  const generateMockCalendar = (data: any) => {
    // Mock calendar generation
    return [
      { id: 1, title: "Course Introduction & Fundamentals", week: 1, type: "unit", color: "bg-blue-500" },
      { id: 2, title: "Core Concepts & Theory", week: 3, type: "unit", color: "bg-purple-500" },
      { id: 3, title: "Practical Applications", week: 6, type: "unit", color: "bg-green-500" },
      { id: 4, title: "Advanced Topics", week: 9, type: "unit", color: "bg-orange-500" },
      { id: 5, title: "Final Projects & Assessment", week: 12, type: "unit", color: "bg-red-500" },
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <h3 className="text-lg font-semibold text-slate-800">Generating Your Course Calendar</h3>
              <p className="text-slate-600">
                Our AI is creating a personalized curriculum structure for your course...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Course Setup
          </CardTitle>
          <CardDescription className="text-lg text-slate-600">
            Step {currentStep + 1} of {questions.length}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">{currentQuestion.title}</h2>

            {currentQuestion.type === "select" ? (
              <Select
                value={formData[currentQuestion.id as keyof typeof formData]}
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
            ) : (
              <Input
                placeholder={currentQuestion.placeholder}
                value={formData[currentQuestion.id as keyof typeof formData]}
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
                (currentQuestion.type !== "dateRange" && !formData[currentQuestion.id as keyof typeof formData])
              }
              className="px-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {currentStep === questions.length - 1 ? "Generate Course" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
