import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface CourseSetupData {
  subject: string
  courseName: string
  level: string
  startDate: string
  endDate: string
  lectureSchedule: Record<string, string>
}

interface GeneratedUnit {
  id: number
  title: string
  week: number
  type: string
  color: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const courseData: CourseSetupData = await request.json()

    // Validate required fields
    if (!courseData.subject || !courseData.courseName || !courseData.level) {
      return NextResponse.json(
        { error: 'Missing required course information' },
        { status: 400 }
      )
    }

    // Step 2: Prompt Engineering
    const systemPrompt = `You are an expert course designer and curriculum developer with deep knowledge of higher education pedagogy. Your task is to create a comprehensive course structure with well-organized units that follow educational best practices.

Your response must be a valid JSON array of course units. Each unit should:
- Have a clear, descriptive title that reflects the content
- Be appropriately paced for the course level and duration
- Build logically on previous units
- Include a brief description of what will be covered
- Be assigned to appropriate weeks based on the course timeline

Consider the course level, subject matter, and lecture schedule when designing the units. Ensure the progression makes sense for the target audience and course objectives.`

    const userPrompt = `Please generate a course structure for the following course:

Course Information:
- Subject: ${courseData.subject}
- Course Name: ${courseData.courseName}
- Level: ${courseData.level}
- Start Date: ${courseData.startDate}
- End Date: ${courseData.endDate}
- Lecture Schedule: ${JSON.stringify(courseData.lectureSchedule)}

Please create 5-7 units that would be appropriate for this course. Each unit should be structured as a JSON object with the following properties:
- id: sequential number starting from 1
- title: descriptive unit title
- week: the week number this unit should be taught
- type: "unit"
- color: one of the following color classes: "bg-[#47624f]", "bg-[#707D7F]", "bg-[#B2A29E]", "bg-[#C9F2C7]", "bg-[#000000]"
- description: a brief description of what this unit covers

Return only the JSON array, no additional text or explanation.`

    // Step 3: LLM API Integration
    const llmProvider = process.env.LLM_PROVIDER || 'gemini'
    
    // Debug logging
    console.log('=== LLM PROVIDER DEBUG ===')
    console.log('LLM_PROVIDER env var:', process.env.LLM_PROVIDER)
    console.log('Selected provider:', llmProvider)
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('========================')
    
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
      // Parse the JSON response
      let generatedUnits: GeneratedUnit[]
      try {
        // Extract JSON from the response (remove any markdown formatting)
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          throw new Error('No JSON array found in response')
        }
        
        generatedUnits = JSON.parse(jsonMatch[0])
        
        // Validate the structure
        if (!Array.isArray(generatedUnits)) {
          throw new Error('Response is not an array')
        }
        
        // Ensure each unit has required properties
        generatedUnits = generatedUnits.map((unit, index) => ({
          id: unit.id || index + 1,
          title: unit.title || `Unit ${index + 1}`,
          week: unit.week || Math.floor(index * 2.5) + 1,
          type: unit.type || "unit",
          color: unit.color || ["bg-[#47624f]", "bg-[#707D7F]", "bg-[#B2A29E]", "bg-[#C9F2C7]", "bg-[#000000]"][index % 5],
          description: unit.description || ""
        }))

      } catch (parseError) {
        console.error('Error parsing LLM response:', parseError)
        console.log('Raw response:', text)
        
        // Fallback to mock data if parsing fails
        generatedUnits = [
          { id: 1, title: "Course Introduction & Fundamentals", week: 1, type: "unit", color: "bg-[#47624f]" },
          { id: 2, title: "Core Concepts & Theory", week: 3, type: "unit", color: "bg-[#707D7F]" },
          { id: 3, title: "Practical Applications", week: 6, type: "unit", color: "bg-[#B2A29E]" },
          { id: 4, title: "Advanced Topics", week: 9, type: "unit", color: "bg-[#C9F2C7]" },
          { id: 5, title: "Final Projects & Assessment", week: 12, type: "unit", color: "bg-[#000000]" },
        ]
      }

      return NextResponse.json({
        success: true,
        units: generatedUnits,
        courseData: courseData,
        llmResponse: text // Include for debugging
      })

    } catch (error) {
      console.error('Error calling LLM API:', error)
      
      // Fallback to mock data if API fails
      const fallbackUnits: GeneratedUnit[] = [
        { id: 1, title: "Course Introduction & Fundamentals", week: 1, type: "unit", color: "bg-[#47624f]" },
        { id: 2, title: "Core Concepts & Theory", week: 3, type: "unit", color: "bg-[#707D7F]" },
        { id: 3, title: "Practical Applications", week: 6, type: "unit", color: "bg-[#B2A29E]" },
        { id: 4, title: "Advanced Topics", week: 9, type: "unit", color: "bg-[#C9F2C7]" },
        { id: 5, title: "Final Projects & Assessment", week: 12, type: "unit", color: "bg-[#000000]" },
      ]

      return NextResponse.json({
        success: true,
        units: fallbackUnits,
        courseData: courseData,
        error: 'LLM generation failed, using fallback data'
      })
    }

  } catch (error) {
    console.error('Error generating units:', error)
    return NextResponse.json(
      { error: 'Failed to generate course units' },
      { status: 500 }
    )
  }
} 