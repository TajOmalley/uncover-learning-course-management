"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Sparkles, Download, Copy, RefreshCw } from "lucide-react"

interface ContentGeneratorProps {
  type: string
  courseData: any
  onBack: () => void
}

export function ContentGenerator({ type, courseData, onBack }: ContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")

  const contentTypes = {
    "lesson-plan": {
      title: "Lesson Plan Generator",
      description: "Create detailed lesson plans with objectives, activities, and assessments",
      placeholder: "Additional requirements or focus areas for this lesson...",
    },
    reading: {
      title: "Reading Content Generator",
      description: "Generate comprehensive reading materials and study guides",
      placeholder: "Specific topics or concepts to emphasize in the reading...",
    },
    homework: {
      title: "Homework Problem Generator",
      description: "Create practice problems and assignments with solutions",
      placeholder: "Difficulty level, problem types, or specific skills to assess...",
    },
    exam: {
      title: "Exam Generator",
      description: "Generate comprehensive exams with multiple question types",
      placeholder: "Exam format, question types, or specific topics to cover...",
    },
  }

  const currentType = contentTypes[type as keyof typeof contentTypes]

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate LLM API call
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Mock generated content
    const mockContent = generateMockContent(type, selectedUnit, customPrompt)
    setGeneratedContent(mockContent)
    setIsGenerating(false)
  }

  const generateMockContent = (type: string, unit: string, prompt: string) => {
    const baseContent = {
      "lesson-plan": `# Lesson Plan: ${unit}

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

      reading: `# Reading Material: ${unit}

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

      homework: `# Homework Assignment: ${unit}

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

      exam: `# Exam: ${unit}

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

    return baseContent[type as keyof typeof baseContent] || "Generated content will appear here..."
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7] via-[#B2A29E] to-[#707D7F]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#000000]">{currentType.title}</h1>
            <p className="text-[#707D7F]">{currentType.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#47624f]" />
                Generation Settings
              </CardTitle>
              <CardDescription>Configure the AI generation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div>
                <Label htmlFor="prompt">Additional Instructions</Label>
                <Textarea
                  id="prompt"
                  placeholder={currentType.placeholder}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedUnit || isGenerating}
                className="w-full bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Content</CardTitle>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47624f] mx-auto"></div>
                  <h3 className="text-lg font-semibold text-[#000000]">Generating Content</h3>
                  <p className="text-[#707D7F]">AI is creating your {type.replace("-", " ")} content...</p>
                  </div>
                </div>
              ) : generatedContent ? (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-[#C9F2C7]/20 p-4 rounded-lg border">
                    {generatedContent}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12 text-[#707D7F]">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#B2A29E]" />
                  <p>Select a unit and click "Generate Content" to create AI-powered course materials.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
