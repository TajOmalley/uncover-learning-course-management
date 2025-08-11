import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'
import { buildSearchQuery, searchWeb } from '@/lib/search'

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
  citations?: Array<{ id: string; title: string; url: string }>
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

    const citationsEnabled = String(process.env.CITATIONS_ENABLED || 'true').toLowerCase() === 'true'
    const citationsEnforce = String(process.env.CITATIONS_ENFORCE || 'true').toLowerCase() === 'true'

    // Step 1: Retrieval for citations (mandatory)
    let sources: Array<{ id: string; title: string; url: string; snippet?: string }> = []
    if (citationsEnabled) {
      try {
        const query = buildSearchQuery({
          subject: courseData.subject,
          level: courseData.level,
          unitTitle: unit.title,
          unitDescription: unit.description,
        })
        sources = await searchWeb(query)
      } catch (err) {
        console.error('Citation retrieval failed:', err)
        if (citationsEnforce) {
          return NextResponse.json(
            { error: 'Citations are required but retrieval failed. Please check search provider configuration.' },
            { status: 500 }
          )
        }
      }
    }

    if (citationsEnforce && (!sources || sources.length === 0)) {
      return NextResponse.json(
        { error: 'Citations are required but no sources were found.' },
        { status: 500 }
      )
    }

    // Step 2: Prompt Engineering for Reading Content
    const systemPrompt = `You are an expert educational content creator and textbook author with deep knowledge of creating engaging, student-friendly reading materials. Your task is to create comprehensive reading content that is:

- Engaging and accessible for the target student level
- Well-structured with clear headings and sections
- Educational and informative
- Appropriate for the course subject and level
- Tailored to the specific unit topic

Your response should be formatted as a textbook chapter with proper headings, subheadings, and well-organized content. Use markdown formatting for structure.

CRITICAL CONTENT INSTRUCTIONS:
- Write clean, natural text without any citation syntax, brackets, or special formatting.
- Use the provided sources for factual information, but write the content normally.
- DO NOT include any citation markers like {{...}}, [...], or (...).
- DO NOT duplicate or repeat any content.
- Write each sentence or fact only once in natural, flowing prose.
- Keep the content clear and suitable for the specified student level.
- Ensure proper spacing and formatting - do not concatenate words or create run-on text.

EXAMPLE OF CORRECT WRITING:
❌ WRONG: "The YC application is {{detailed online form}}[S1]."
❌ WRONG: "The YC application is detailed. (The YC application is a detailed online form) [S1]."
✅ CORRECT: "The YC application is a detailed online form that asks about your startup, team, market, and progress."

Write naturally as if you're creating a textbook chapter. The citation system will automatically identify and underline factual claims based on the sources provided.
`

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

Format the content with markdown headings (# for main headings, ## for subheadings) and ensure it flows logically from introduction to conclusion.

Sources:
${(sources || []).map(s => `${s.id}: ${s.title} - ${s.url}`).join('\n')}

Remember: Write clean, natural text without any citation syntax. The citation system will automatically handle the underlining and source links.`

    // Step 3: LLM API Integration
    const llmProvider = process.env.LLM_PROVIDER || 'gemini'
    
    // Debug logging
    console.log('=== LLM PROVIDER DEBUG (Reading) ===')
    console.log('LLM_PROVIDER env var:', process.env.LLM_PROVIDER)
    console.log('Selected provider:', llmProvider)
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('====================================')
    
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
      // Create the reading content object
      const generatedReading: GeneratedReading = {
        title: `Reading: ${unit.title}`,
        content: text,
        unitId: unit.id,
        unitTitle: unit.title,
        citations: (sources || []).map(s => ({ id: s.id, title: s.title, url: s.url }))
      }

      return NextResponse.json({
        success: true,
        reading: generatedReading,
        unit: unit
      })

    } catch (error) {
      console.error('Error calling LLM API:', error)
      
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