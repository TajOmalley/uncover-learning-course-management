"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Copy, RefreshCw } from "lucide-react"
import { ContentModal } from "@/components/content-modal"
import { CitedMarkdown } from '@/components/CitedMarkdown'
import { Badge } from "@/components/ui/badge"

interface ContentGeneratorProps {
  type: string
  courseData: any
  onBack: () => void
  onContentGenerated?: (content: any) => void
  onContentSaved?: (savedContent: any) => void
}

export function ContentGenerator({ type, courseData, onBack, onContentGenerated, onContentSaved }: ContentGeneratorProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [generatedCitations, setGeneratedCitations] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [selectedUnit, setSelectedUnit] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [instructionsAdded, setInstructionsAdded] = useState(false)
  const [storedInstructions, setStoredInstructions] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [savedContent, setSavedContent] = useState<any[]>([])
  const [loadingSavedContent, setLoadingSavedContent] = useState(false)
  const [contentModalOpen, setContentModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  
  // Homework problem specifications
  const [totalProblems, setTotalProblems] = useState(5)
  const [wordProblems, setWordProblems] = useState(3)
  const [multipleChoiceProblems, setMultipleChoiceProblems] = useState(2)
  
  // Exam specifications
  const [examSpecs, setExamSpecs] = useState({
    wordProblems: { count: 2, timePerQuestion: 15 },
    essayProblems: { count: 1, timePerQuestion: 30 },
    multipleChoice: { count: 10, timePerQuestion: 2 }
  })

  const contentTypes = {
    "lesson-plan": {
      title: "Lesson Plan Creator",
      description: "Create detailed lesson plans with objectives, activities, and assessments",
      placeholder: "e.g., Include more group activities, focus on hands-on learning, make it more interactive, emphasize student engagement...",
    },
    reading: {
      title: "Reading Content Creator",
      description: "Create comprehensive reading materials and study guides",
      placeholder: "e.g., Focus on practical applications, include case studies, make it more conversational, emphasize historical context...",
    },
    homework: {
      title: "Homework Problem Creator",
      description: "Create practice problems and assignments with solutions",
      placeholder: "e.g., Focus on real-world applications, include more word problems, make problems more challenging, emphasize critical thinking...",
    },
    exam: {
      title: "Exam Creator",
      description: "Create comprehensive exams with multiple question types",
      placeholder: "e.g., Focus on application questions, include more essay questions, make it more challenging, emphasize problem-solving...",
    },
  }

  const currentType = contentTypes[type as keyof typeof contentTypes]

  // Load saved content when component mounts
  useEffect(() => {
    if (courseData.courseId) {
      loadSavedContent()
    }
  }, [courseData.courseId])

  // Debug citations
  useEffect(() => {
    console.log('Citations state changed:', generatedCitations)
  }, [generatedCitations])

  const loadSavedContent = async () => {
    setLoadingSavedContent(true)
    try {
      const response = await fetch(`/api/content?courseId=${courseData.courseId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch saved content: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setSavedContent(result.content)
      } else {
        console.error('Failed to fetch saved content:', result.error)
      }
    } catch (error) {
      console.error('Error loading saved content:', error)
    } finally {
      setLoadingSavedContent(false)
    }
  }

  const handleAddInstructions = () => {
    if (customPrompt.trim()) {
      setStoredInstructions(customPrompt.trim())
      setCustomPrompt("")
      setInstructionsAdded(true)
    }
  }

  const handleResetInstructions = () => {
    setStoredInstructions("")
    setInstructionsAdded(false)
    setCustomPrompt("")
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      if (type === "reading") {
        // Call the reading creation API
        const selectedUnitData = courseData.calendar?.find((unit: any) => unit.title === selectedUnit)
        
        if (!selectedUnitData) {
          throw new Error('Selected unit not found')
        }

        const response = await fetch('/api/generate-reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseData: courseData,
            unit: selectedUnitData,
            customPrompt: storedInstructions || undefined
          }),
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create reading content')
        }

        console.log('Generated content received:', result.reading.content.substring(0, 100) + '...')
        console.log('Citations received:', result.reading.citations)
        setGeneratedContent(result.reading.content)
        setGeneratedCitations(result.reading.citations || [])
        if (onContentGenerated) {
          onContentGenerated({
            content: result.reading.content,
            citations: result.reading.citations || [],
            type: 'reading',
            unitTitle: selectedUnit
          })
        }
      } else if (type === "homework") {
        // Call the homework creation API
        const selectedUnitData = courseData.calendar?.find((unit: any) => unit.title === selectedUnit)
        
        if (!selectedUnitData) {
          throw new Error('Selected unit not found')
        }

        const response = await fetch('/api/generate-homework', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseData: courseData,
            unit: selectedUnitData,
            problemSpecs: {
              totalProblems: totalProblems,
              wordProblems: wordProblems,
              multipleChoiceProblems: multipleChoiceProblems
            },
            customPrompt: customPrompt || undefined
          }),
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create homework content')
        }

        setGeneratedContent(result.homework.content)
        if (onContentGenerated) {
          onContentGenerated({
            content: result.homework.content,
            type: 'homework',
            unitTitle: selectedUnit
          })
        }
      } else if (type === "lesson-plan") {
        // Call the lesson plan creation API
        const selectedUnitData = courseData.calendar?.find((unit: any) => unit.title === selectedUnit)
        
        if (!selectedUnitData) {
          throw new Error('Selected unit not found')
        }

        // Get the lecture length from the course data based on the unit's week
        // For now, use the first available lecture duration, or default to 90 minutes
        const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
        const defaultLectureLength = lectureDurations.length > 0 ? 
          parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90

        const response = await fetch('/api/generate-lesson-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseData: courseData,
            unit: selectedUnitData,
            lectureLength: defaultLectureLength,
            customPrompt: storedInstructions || undefined
          }),
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create lesson plan content')
        }

        setGeneratedContent(result.lessonPlan.content)
        if (onContentGenerated) {
          onContentGenerated({
            content: result.lessonPlan.content,
            type: 'lesson-plan',
            unitTitle: selectedUnit
          })
        }
      } else if (type === "exam") {
        // Call the exam creation API
        const selectedUnitData = courseData.calendar?.find((unit: any) => unit.title === selectedUnit)
        
        if (!selectedUnitData) {
          throw new Error('Selected unit not found')
        }

        // Get the lecture length from the course data for exam duration
        const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
        const lectureLength = lectureDurations.length > 0 ? 
          parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90

        // Calculate total exam time based on lecture length
        const totalExamTime = lectureLength

        const response = await fetch('/api/generate-exam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseData: courseData,
            unit: selectedUnitData,
            examSpecs: {
              ...examSpecs,
              totalExamTime: totalExamTime
            },
            customPrompt: storedInstructions || undefined
          }),
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create exam content')
        }

        setGeneratedContent(result.exam.content)
        if (onContentGenerated) {
          onContentGenerated({
            content: result.exam.content,
            type: 'exam',
            unitTitle: selectedUnit
          })
        }
      } else {
        // For other content types, use mock content for now
        const mockContent = generateMockContent(type, selectedUnit, storedInstructions)
        setGeneratedContent(mockContent)
        if (onContentGenerated) {
          onContentGenerated({
            content: mockContent,
            type: type,
            unitTitle: selectedUnit
          })
        }
      }
    } catch (error) {
      console.error('Error generating content:', error)
      
      // Fallback to mock content if API fails
      const mockContent = generateMockContent(type, selectedUnit, storedInstructions)
      setGeneratedContent(mockContent)
      if (onContentGenerated) {
        onContentGenerated({
          content: mockContent,
          type: type,
          unitTitle: selectedUnit
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent || !selectedUnit) return
    
    setIsSaving(true)
    
    try {
      const selectedUnitData = courseData.calendar?.find((unit: any) => unit.title === selectedUnit)
      
      if (!selectedUnitData) {
        throw new Error('Selected unit not found')
      }

      // Calculate lecture length for lesson plans
      const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
      const defaultLectureLength = lectureDurations.length > 0 ? 
        parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90

      const specifications = {
        customPrompt: storedInstructions,
        ...(type === "homework" && {
          problemSpecs: {
            totalProblems: totalProblems,
            wordProblems: wordProblems,
            multipleChoiceProblems: multipleChoiceProblems
          }
        }),
        ...(type === "lesson-plan" && {
          lectureLength: defaultLectureLength
        }),
        ...(type === "exam" && {
          examSpecs: {
            ...examSpecs,
            totalExamTime: (() => {
              const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
              const lectureLength = lectureDurations.length > 0 ? 
                parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90
              return lectureLength
            })()
          }
        })
      }

      // Save to database
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: courseData.courseId,
          unitId: selectedUnitData.id,
          type: type,
          content: generatedContent,
          specifications: {
            ...specifications,
            citations: generatedCitations
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save content: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save content')
      }

      console.log('Content saved successfully to database:', result.content)
      
      // Show success toast (styled)
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({
          title: "Content saved",
          description: `Your ${type.replace('-', ' ')} has been saved to the "${selectedUnit}" unit.`,
        })
      } catch (_) {}
      
              // Reset the creation window
      setGeneratedContent("")
      setCustomPrompt("")
      setSelectedUnit("")
      
      // Add the saved content to the list
      setSavedContent(prev => [...prev, result.content])
      
      // Notify parent component about the saved content
      if (onContentSaved) {
        onContentSaved(result.content)
      }
      
      // Show a link to view the saved content
      const viewLink = `#saved-content-${result.content.id}`
      console.log(`View saved content: ${viewLink}`)
      
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

  const generateMockContent = (type: string, unit: string, prompt: string) => {
    // Create a custom instruction note if prompt is provided
    const customInstructionNote = prompt ? `\n\n## Custom Instructions Applied\n${prompt}\n\n---\n` : ''
    
    const baseContent = {
      "lesson-plan": `# Lesson Plan: ${unit}${customInstructionNote}

## Learning Objectives
By the end of this lesson, students will be able to:
- Understand the fundamental concepts of ${unit.toLowerCase()}
- Apply theoretical knowledge to practical scenarios
- Analyze and evaluate different approaches

## Materials Needed
- Textbook chapters 3-4
- Online simulation tools
- Whiteboard and markers
- Student handouts

## Lesson Structure (90 minutes)

### Introduction (15 minutes)
- Review previous lesson concepts
- Introduce today's topic with real-world examples
- Set learning expectations

### Main Content (50 minutes)
- Theoretical foundation presentation
- Interactive demonstrations
- Guided practice exercises
- Small group discussions

### Assessment & Wrap-up (25 minutes)
- Quick comprehension check
- Q&A session
- Preview next lesson
- Assignment distribution

## Assessment Methods
- Formative: Exit tickets, peer discussions
- Summative: Weekly quiz, project milestone

## Homework Assignment
Complete practice problems 1-10 from the textbook and prepare for next week's lab session.`,

      reading: `# Reading Material: ${unit}${customInstructionNote}

## Chapter Overview
This chapter introduces the core principles of ${unit.toLowerCase()} and explores their applications in modern contexts.

## Key Concepts

### Concept 1: Fundamental Principles
The foundation of ${unit.toLowerCase()} rests on several key principles that have evolved over time. These principles form the basis for understanding more complex topics.

### Concept 2: Practical Applications
Real-world applications demonstrate how theoretical knowledge translates into practical solutions. Examples include:
- Industry case studies
- Current research developments
- Historical perspectives

### Concept 3: Advanced Topics
Building on the fundamentals, we explore more sophisticated concepts that prepare students for advanced coursework.

## Study Questions
1. What are the main principles discussed in this chapter?
2. How do these concepts apply to real-world scenarios?
3. What are the limitations of current approaches?

## Additional Resources
- Supplementary readings from academic journals
- Online tutorials and simulations
- Professional organization websites`,

      homework: `# Homework Assignment: ${unit}${customInstructionNote}

## Instructions
Complete the following problems to reinforce your understanding of ${unit.toLowerCase()}. Show all work and explain your reasoning.

## Problem Set 1: Fundamentals (30 points)

### Problem 1 (10 points)
Given the scenario described below, apply the principles learned in class to solve the following:
[Detailed problem description with specific parameters]

### Problem 2 (10 points)
Analyze the following case study and identify the key concepts at work:
[Case study with multiple components to analyze]

### Problem 3 (10 points)
Compare and contrast two different approaches to solving this type of problem:
[Comparative analysis question]

## Problem Set 2: Applications (40 points)

### Problem 4 (20 points)
Design a solution for the following real-world scenario:
[Complex application problem requiring synthesis]

### Problem 5 (20 points)
Evaluate the effectiveness of different strategies:
[Critical thinking and evaluation exercise]

## Submission Guidelines
- Due: Next class period
- Format: Typed or neatly handwritten
- Include all calculations and explanations
- Cite any external resources used

## Grading Rubric
- Accuracy: 50%
- Explanation quality: 30%
- Presentation: 20%`,

      exam: `# Exam: ${unit}${customInstructionNote}

**Course:** ${courseData.courseName}
**Duration:** 2 hours
**Total Points:** 100

## Instructions
- Read all questions carefully before beginning
- Show all work for partial credit
- Use only approved materials
- Manage your time effectively

## Section A: Multiple Choice (30 points)
*Choose the best answer for each question*

1. Which of the following best describes the primary concept of ${unit.toLowerCase()}?
   a) Option A
   b) Option B
   c) Option C
   d) Option D

[Additional multiple choice questions...]

## Section B: Short Answer (40 points)
*Provide concise but complete answers*

1. (10 points) Explain the relationship between concepts X and Y as discussed in ${unit}.

2. (15 points) Describe the process of implementing solution Z, including potential challenges.

3. (15 points) Compare the advantages and disadvantages of approaches A and B.

## Section C: Problem Solving (30 points)
*Show all work and explain your reasoning*

1. (15 points) Given the following scenario, calculate the optimal solution:
   [Detailed problem with specific parameters]

2. (15 points) Design and justify a comprehensive approach to address this complex situation:
   [Open-ended problem requiring synthesis and creativity]

## Answer Key Available After Exam
Detailed solutions and explanations will be provided during the review session.`,
    }

            return baseContent[type as keyof typeof baseContent] || "Content will appear here..."
  }

  return (
    <div className="space-y-6">
          {/* Content Settings */}
          <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-[#47624f]">Content Settings</h3>
            </div>
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                <div>
                  <Label htmlFor="unit">Select Course Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseData.calendar?.map((unit: any) => (
                        <SelectItem key={unit.id} value={unit.title}>
                          Week {unit.week}: {unit.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Homework Problem Specifications */}
                {type === "homework" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="totalProblems">Total Problems</Label>
                      <input
                        id="totalProblems"
                        type="number"
                        min="1"
                        max="20"
                        value={totalProblems}
                        onChange={(e) => {
                          const total = parseInt(e.target.value) || 0
                          setTotalProblems(total)
                          // Auto-adjust other values to maintain consistency
                          if (total < wordProblems + multipleChoiceProblems) {
                            setWordProblems(Math.max(1, Math.floor(total / 2)))
                            setMultipleChoiceProblems(total - Math.max(1, Math.floor(total / 2)))
                          }
                        }}
                        className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="wordProblems">Word Problems</Label>
                        <input
                          id="wordProblems"
                          type="number"
                          min="0"
                          max={totalProblems}
                          value={wordProblems}
                          onChange={(e) => {
                            const word = parseInt(e.target.value) || 0
                            setWordProblems(word)
                            setMultipleChoiceProblems(totalProblems - word)
                          }}
                          className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="multipleChoiceProblems">Multiple Choice</Label>
                        <input
                          id="multipleChoiceProblems"
                          type="number"
                          min="0"
                          max={totalProblems}
                          value={multipleChoiceProblems}
                          onChange={(e) => {
                            const mc = parseInt(e.target.value) || 0
                            setMultipleChoiceProblems(mc)
                            setWordProblems(totalProblems - mc)
                          }}
                          className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                        />
                      </div>
                    </div>
                    
                    {wordProblems + multipleChoiceProblems !== totalProblems && (
                      <p className="text-sm text-red-600">
                        Word problems + Multiple choice must equal total problems
                      </p>
                    )}
                  </div>
                )}

                {/* Exam Specifications */}
                {type === "exam" && (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#C9F2C7]/20 rounded-lg border border-[#B2A29E]/20">
                      <p className="text-sm text-[#707D7F]">
                        <strong>Exam Duration:</strong> Based on your lecture schedule ({(() => {
                          const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
                          const lectureLength = lectureDurations.length > 0 ? 
                            parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90
                          return lectureLength
                        })()} minutes)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="wordProblems">Word Problems</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="wordProblemsCount" className="text-xs text-[#707D7F]">Number of Questions</Label>
                            <input
                              id="wordProblemsCount"
                              type="number"
                              min="0"
                              max="20"
                              placeholder="Count"
                              value={examSpecs.wordProblems.count}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0
                                setExamSpecs(prev => ({
                                  ...prev,
                                  wordProblems: { ...prev.wordProblems, count }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="wordProblemsTime" className="text-xs text-[#707D7F]">Minutes per Question</Label>
                            <input
                              id="wordProblemsTime"
                              type="number"
                              min="1"
                              max="60"
                              placeholder="Minutes each"
                              value={examSpecs.wordProblems.timePerQuestion}
                              onChange={(e) => {
                                const time = parseInt(e.target.value) || 15
                                setExamSpecs(prev => ({
                                  ...prev,
                                  wordProblems: { ...prev.wordProblems, timePerQuestion: time }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="essayProblems">Essay Problems</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="essayProblemsCount" className="text-xs text-[#707D7F]">Number of Questions</Label>
                            <input
                              id="essayProblemsCount"
                              type="number"
                              min="0"
                              max="10"
                              placeholder="Count"
                              value={examSpecs.essayProblems.count}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0
                                setExamSpecs(prev => ({
                                  ...prev,
                                  essayProblems: { ...prev.essayProblems, count }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="essayProblemsTime" className="text-xs text-[#707D7F]">Minutes per Question</Label>
                            <input
                              id="essayProblemsTime"
                              type="number"
                              min="5"
                              max="60"
                              placeholder="Minutes each"
                              value={examSpecs.essayProblems.timePerQuestion}
                              onChange={(e) => {
                                const time = parseInt(e.target.value) || 30
                                setExamSpecs(prev => ({
                                  ...prev,
                                  essayProblems: { ...prev.essayProblems, timePerQuestion: time }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="multipleChoice">Multiple Choice</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="multipleChoiceCount" className="text-xs text-[#707D7F]">Number of Questions</Label>
                            <input
                              id="multipleChoiceCount"
                              type="number"
                              min="0"
                              max="50"
                              placeholder="Count"
                              value={examSpecs.multipleChoice.count}
                              onChange={(e) => {
                                const count = parseInt(e.target.value) || 0
                                setExamSpecs(prev => ({
                                  ...prev,
                                  multipleChoice: { ...prev.multipleChoice, count }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="multipleChoiceTime" className="text-xs text-[#707D7F]">Minutes per Question</Label>
                            <input
                              id="multipleChoiceTime"
                              type="number"
                              min="1"
                              max="10"
                              placeholder="Minutes each"
                              value={examSpecs.multipleChoice.timePerQuestion}
                              onChange={(e) => {
                                const time = parseInt(e.target.value) || 2
                                setExamSpecs(prev => ({
                                  ...prev,
                                  multipleChoice: { ...prev.multipleChoice, timePerQuestion: time }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-[#B2A29E] rounded-md focus:outline-none focus:ring-2 focus:ring-[#47624f]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time validation */}
                    {(() => {
                      const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
                      const lectureLength = lectureDurations.length > 0 ? 
                        parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90
                      
                      const calculatedTime = (examSpecs.wordProblems.count * examSpecs.wordProblems.timePerQuestion) +
                                            (examSpecs.essayProblems.count * examSpecs.essayProblems.timePerQuestion) +
                                            (examSpecs.multipleChoice.count * examSpecs.multipleChoice.timePerQuestion)
                      const difference = Math.abs(calculatedTime - lectureLength)
                      
                      return difference > 5 ? (
                        <p className="text-sm text-red-600">
                          Calculated time ({calculatedTime} min) doesn't match exam duration ({lectureLength} min)
                        </p>
                      ) : (
                        <p className="text-sm text-green-600">
                          Time allocation: {calculatedTime} minutes
                        </p>
                      )
                    })()}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!selectedUnit || isGenerating || 
                    (type === "homework" && wordProblems + multipleChoiceProblems !== totalProblems) ||
                    (type === "exam" && (() => {
                      const lectureDurations = Object.values(courseData.lectureSchedule || {}) as string[]
                      const lectureLength = lectureDurations.length > 0 ? 
                        parseInt(lectureDurations[0].replace(/\D/g, '')) || 90 : 90
                      
                      const calculatedTime = (examSpecs.wordProblems.count * examSpecs.wordProblems.timePerQuestion) +
                                            (examSpecs.essayProblems.count * examSpecs.essayProblems.timePerQuestion) +
                                            (examSpecs.multipleChoice.count * examSpecs.multipleChoice.timePerQuestion)
                      return Math.abs(calculatedTime - lectureLength) > 5
                    })())
                  }
                  className="w-full bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f] text-white"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Instructions Section */}
          <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-[#47624f]">Additional Instructions</h3>
              <p className="text-[#47624f]/80">Provide specific instructions to customize the content</p>
            </div>
            <div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt" className="text-[#47624f]">Custom Instructions</Label>
                  {instructionsAdded && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Instructions Active
                    </Badge>
                  )}
                </div>
                <Textarea
                  id="prompt"
                  placeholder={instructionsAdded ? "Instructions have been added. Click 'Reset Instructions' to add new ones." : currentType.placeholder}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                  className="w-full"
                  disabled={instructionsAdded}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddInstructions}
                    disabled={!customPrompt.trim() || instructionsAdded}
                    variant={instructionsAdded ? "secondary" : "default"}
                    className={instructionsAdded ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f] text-white"}
                  >
                    {instructionsAdded ? "Instructions Added" : "Add Instructions"}
                  </Button>
                  <Button
                    onClick={handleResetInstructions}
                    disabled={!instructionsAdded}
                    variant="outline"
                    className="ml-2 border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white"
                  >
                    Reset Instructions
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Content Display */}
          {generatedContent && (
            <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[#47624f]">Generated Content</h3>
                  <div className="flex items-center gap-2">
                    {generatedCitations.length > 0 && (
                      <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f]">
                        {generatedCitations.length} Citation{generatedCitations.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button
                      onClick={async () => {
                        navigator.clipboard.writeText(generatedContent)
                        // Show toast notification
                        try {
                          const { toast } = await import("@/hooks/use-toast")
                          toast({
                            title: "Content copied",
                            description: "Content has been copied to clipboard.",
                          })
                        } catch (_) {}
                      }}
                      variant="outline"
                      size="sm"
                      className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <div className="prose max-w-none">
                  <CitedMarkdown content={generatedContent} citations={generatedCitations} />
                  
                  {/* Debug: Show citations info */}
                  {generatedCitations.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                      <h4 className="font-semibold mb-2">Debug: Citations Found ({generatedCitations.length})</h4>
                      <ul className="text-sm space-y-1">
                        {generatedCitations.map((citation, index) => (
                          <li key={index}>
                            <strong>{citation.id}:</strong> {citation.title} - <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{citation.url}</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Save Content Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f] text-white"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Saved Content Section */}
          {savedContent.length > 0 && (
            <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-[#47624f]">Saved Content</h3>
                <p className="text-[#47624f]/80">
                  Previously saved content for this unit
                </p>
              </div>
              <div>
                <div className="space-y-4">
                  {savedContent.map((content: any) => (
                    <div
                      key={content.id}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setSelectedContentId(content.id)
                        setContentModalOpen(true)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {content.unitTitle || `${type.replace('-', ' ')} content`}
                        </h4>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Saved
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {content.content.substring(0, 150)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
