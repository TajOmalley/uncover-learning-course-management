import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ReadingRequestData {
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
}

interface GeneratedReading {
  title: string
  content: string
  unitId: number
  unitTitle: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { courseData, unit }: ReadingRequestData = await request.json()

    // Validate required fields
    if (!courseData || !unit) {
      return NextResponse.json(
        { error: 'Missing required course or unit information' },
        { status: 400 }
      )
    }

    // Step 1: Prompt Engineering for Reading Content
    const systemPrompt = `You are an expert educational content creator and textbook author with deep knowledge of creating engaging, student-friendly reading materials. Your task is to create comprehensive reading content that is:

- Engaging and accessible for the target student level
- Well-structured with clear headings and sections
- Educational and informative
- Appropriate for the course subject and level
- Tailored to the specific unit topic

Your response should be formatted as a textbook chapter with proper headings, subheadings, and well-organized content. Use markdown formatting for structure.`

    const userPrompt = `Please create reading content for the following unit:

Course Information:
- Subject: ${courseData.subject}
- Course Name: ${courseData.courseName}
- Level: ${courseData.level}
- Unit: ${unit.title}
- Unit Description: ${unit.description || 'No description provided'}

Please create engaging reading content that:
1. Introduces the unit topic clearly
2. Provides comprehensive coverage of the subject matter
3. Uses appropriate language for ${courseData.level} students
4. Includes relevant examples and explanations
5. Is structured with clear headings and sections
6. Is engaging and educational

Format the content with markdown headings (# for main headings, ## for subheadings) and ensure it flows logically from introduction to conclusion.`

    // Step 2: LLM API Integration
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    try {
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Generate content
      const result = await model.generateContent(systemPrompt + "\n\n" + userPrompt)
      const response = await result.response
      const text = response.text()

      // Create the reading content object
      const generatedReading: GeneratedReading = {
        title: `Reading: ${unit.title}`,
        content: text,
        unitId: unit.id,
        unitTitle: unit.title
      }

      return NextResponse.json({
        success: true,
        reading: generatedReading,
        unit: unit
      })

    } catch (error) {
      console.error('Error calling Gemini API:', error)
      
      // Fallback to mock reading content if API fails
      const fallbackReading: GeneratedReading = {
        title: `Reading: ${unit.title}`,
        content: `# ${unit.title}

## Introduction

This reading provides an overview of the key concepts covered in ${unit.title}. 

## Main Content

The content for this unit will be generated based on the course context and unit objectives. This section will include detailed explanations, examples, and relevant information for ${courseData.level} students studying ${courseData.subject}.

## Key Takeaways

- Understanding of core concepts
- Application of theoretical knowledge
- Practical examples and case studies

## Conclusion

This reading has covered the essential elements of ${unit.title} and provides a foundation for further study and application.`,
        unitId: unit.id,
        unitTitle: unit.title
      }

      return NextResponse.json({
        success: true,
        reading: fallbackReading,
        unit: unit,
        error: 'LLM generation failed, using fallback content'
      })
    }

  } catch (error) {
    console.error('Error generating reading content:', error)
    return NextResponse.json(
      { error: 'Failed to generate reading content' },
      { status: 500 }
    )
  }
} 