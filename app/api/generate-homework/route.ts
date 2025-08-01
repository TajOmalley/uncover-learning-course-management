import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface HomeworkRequestData {
  courseData: {
    subject: string
    courseName: string
    level: string
    startDate: string
    endDate: string
    lectureSchedule: Record<string, string>
  }
  unit: {
    id: number
    title: string
    week: number
    type: string
    color: string
    description?: string
  }
  problemSpecs: {
    totalProblems: number
    wordProblems: number
    multipleChoiceProblems: number
  }
}

interface GeneratedHomework {
  title: string
  content: string
  unitId: number
  unitTitle: string
  problemSpecs: {
    totalProblems: number
    wordProblems: number
    multipleChoiceProblems: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { courseData, unit, problemSpecs }: HomeworkRequestData = await request.json()

    // Validate required fields
    if (!courseData || !unit || !problemSpecs) {
      return NextResponse.json(
        { error: 'Missing required course, unit, or problem specification information' },
        { status: 400 }
      )
    }

    // Validate problem specifications
    if (problemSpecs.wordProblems + problemSpecs.multipleChoiceProblems !== problemSpecs.totalProblems) {
      return NextResponse.json(
        { error: 'Word problems + multiple choice problems must equal total problems' },
        { status: 400 }
      )
    }

    // Step 1: Prompt Engineering for Homework Problems
    const systemPrompt = `You are an expert educational content creator and assessment designer with deep knowledge of creating engaging, appropriate homework problems for students. Your task is to create homework problems that are:

- Appropriate for the target student level and subject
- Well-structured with clear problem statements
- Educational and challenging but not overwhelming
- Tailored to the specific unit topic and course subject
- Mix of word problems and multiple choice questions as specified

Your response should be formatted as a homework assignment with numbered problems, clear instructions, and appropriate difficulty for the course level.`

    const userPrompt = `Please create homework problems for the following unit:

Course Information:
- Subject: ${courseData.subject}
- Course Name: ${courseData.courseName}
- Level: ${courseData.level}
- Unit: ${unit.title}
- Unit Description: ${unit.description || 'No description provided'}

Problem Specifications:
- Total Problems: ${problemSpecs.totalProblems}
- Word Problems: ${problemSpecs.wordProblems}
- Multiple Choice Problems: ${problemSpecs.multipleChoiceProblems}

Please create homework problems that:
1. Are appropriate for ${courseData.level} students studying ${courseData.subject}
2. Cover the content and concepts from ${unit.title}
3. Include ${problemSpecs.wordProblems} word problems that require critical thinking and application
4. Include ${problemSpecs.multipleChoiceProblems} multiple choice questions with 4 options (A, B, C, D)
5. Are clearly numbered and formatted
6. Include answer keys at the end
7. Vary in difficulty but are all appropriate for the course level

Format the content with clear headings, numbered problems, and separate answer key section.`

    // Step 2: LLM API Integration
    const llmProvider = process.env.LLM_PROVIDER || 'gemini'
    
    // Debug logging
    console.log('=== LLM PROVIDER DEBUG (Homework) ===')
    console.log('LLM_PROVIDER env var:', process.env.LLM_PROVIDER)
    console.log('Selected provider:', llmProvider)
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('=====================================')
    
    let text: string
    
    if (llmProvider === 'openai') {
      // OpenAI Integration
      const openaiApiKey = process.env.OPENAI_API_KEY
      if (!openaiApiKey) {
        console.error('OPENAI_API_KEY not found in environment variables')
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        )
      }

      try {
        const openai = new OpenAI({
          apiKey: openaiApiKey,
        })

                    const completion = await openai.chat.completions.create({
              model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.7,
            })

        text = completion.choices[0]?.message?.content || ''
      } catch (error) {
        console.error('Error calling OpenAI API:', error)
        throw error
      }
    } else {
      // Gemini Integration (default)
      const geminiApiKey = process.env.GEMINI_API_KEY
      if (!geminiApiKey) {
        console.error('GEMINI_API_KEY not found in environment variables')
        return NextResponse.json(
          { error: 'API key not configured' },
          { status: 500 }
        )
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt)
        const response = await result.response
        text = response.text()
      } catch (error) {
        console.error('Error calling Gemini API:', error)
        throw error
      }
    }

    try {
      // Create the homework content object
      const generatedHomework: GeneratedHomework = {
        title: `Homework: ${unit.title}`,
        content: text,
        unitId: unit.id,
        unitTitle: unit.title,
        problemSpecs: problemSpecs
      }

      return NextResponse.json({
        success: true,
        homework: generatedHomework,
        unit: unit
      })

    } catch (error) {
      console.error('Error calling LLM API:', error)
      
      // Fallback to mock homework content if API fails
      const fallbackHomework: GeneratedHomework = {
        title: `Homework: ${unit.title}`,
        content: `# Homework Assignment: ${unit.title}

## Instructions
Complete the following problems based on the material covered in ${unit.title}. Show all work for word problems and select the best answer for multiple choice questions.

## Problems

### Word Problems
${Array.from({ length: problemSpecs.wordProblems }, (_, i) => `${i + 1}. [Word problem ${i + 1} related to ${unit.title}]`).join('\n')}

### Multiple Choice Questions
${Array.from({ length: problemSpecs.multipleChoiceProblems }, (_, i) => `${problemSpecs.wordProblems + i + 1}. [Multiple choice question ${i + 1} related to ${unit.title}]
   A) [Option A]
   B) [Option B]
   C) [Option C]
   D) [Option D]`).join('\n\n')}

## Answer Key
Answers will be provided by the instructor.`,
        unitId: unit.id,
        unitTitle: unit.title,
        problemSpecs: problemSpecs
      }

      return NextResponse.json({
        success: true,
        homework: fallbackHomework,
        unit: unit,
        error: 'LLM generation failed, using fallback content'
      })
    }

  } catch (error) {
    console.error('Error generating homework content:', error)
    return NextResponse.json(
      { error: 'Failed to generate homework content' },
      { status: 500 }
    )
  }
} 