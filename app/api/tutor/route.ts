import { NextRequest, NextResponse } from 'next/server'

interface TutorRequestData {
  userMessage: string
  courseData: {
    courseName: string
    subject: string
    level: string
    professor?: string
  }
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    summary?: string
  }>
}

interface TutorResponse {
  response: string
  conversationSummary: string
}

export async function POST(request: NextRequest) {
  try {
    const { userMessage, courseData, conversationHistory }: TutorRequestData = await request.json()

    // Validate required fields
    if (!userMessage || !courseData) {
      return NextResponse.json(
        { error: 'Missing required message or course information' },
        { status: 400 }
      )
    }

    console.log('Tutor request received for course:', courseData.courseName)

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Build conversation context from history
    let conversationContext = ''
    if (conversationHistory && conversationHistory.length > 0) {
      // Use the most recent summary if available, otherwise create a brief context
      const lastMessage = conversationHistory[conversationHistory.length - 1]
      if (lastMessage.summary) {
        conversationContext = `Previous conversation summary: ${lastMessage.summary}\n\n`
      } else {
        // Create a brief context from recent messages
        const recentMessages = conversationHistory.slice(-3) // Last 3 messages
        conversationContext = `Recent conversation context:\n${recentMessages.map(msg => 
          `${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
        ).join('\n')}\n\n`
      }
    }

    // Create the system prompt for tutoring
    const systemPrompt = `You are an expert AI tutor for a ${courseData.level} ${courseData.subject} course called "${courseData.courseName}". Your role is to guide and teach students, not just provide answers.

TEACHING APPROACH:
- Guide students to discover answers through reasoning and understanding
- Ask clarifying questions when needed
- Provide explanations that build conceptual understanding
- Use analogies and examples when helpful
- Encourage critical thinking and problem-solving skills
- Be patient and supportive while maintaining academic rigor

COURSE CONTEXT:
- Course: ${courseData.courseName}
- Subject: ${courseData.subject}
- Level: ${courseData.level}
- Professor: ${courseData.professor || 'Not specified'}

MATH FORMATTING INSTRUCTIONS:
- Use proper LaTeX syntax for all mathematical expressions
- For inline math: Use single dollar signs like $E=mc^2$ or $x^2 + y^2 = z^2$
- For block/display math: Use double dollar signs like $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- Always escape backslashes in LaTeX: Use \\frac, \\sqrt, \\pm, etc.
- Common LaTeX commands: \\frac{numerator}{denominator}, \\sqrt{expression}, \\sum_{i=1}^{n}, \\int_{a}^{b}, \\lim_{x \\to \\infty}
- Greek letters: \\alpha, \\beta, \\gamma, \\delta, \\theta, \\pi, \\sigma, \\omega, etc.
- Subscripts and superscripts: x_i, x^2, x_{i,j}, x^{n+1}

CONVERSATION MEMORY:
- After each response, provide a brief internal summary (2-3 sentences) of the key points discussed
- This summary will be used for context in future messages
- Keep summaries concise but informative
- Focus on the main concepts and learning objectives addressed

RESPONSE FORMAT:
- Write in a clear, conversational tone
- Use proper markdown formatting for structure
- Include headings, bullet points, and emphasis where appropriate
- When using math, ensure proper LaTeX syntax with correct escaping
- End your response with "---SUMMARY: [brief summary of key points discussed]" on a new line

${conversationContext}

Remember: Your goal is to help the student learn and understand, not just get the right answer. Guide them through the thinking process. When mathematical concepts are involved, use proper LaTeX formatting to ensure clarity.`

    // Create the user prompt
    const userPrompt = `Student question: ${userMessage}

Please provide a helpful, educational response that guides the student toward understanding. If the question involves mathematics, use proper LaTeX formatting for all equations and mathematical expressions.`

    // Call OpenAI API
    const OpenAI = require('openai')
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    })
    
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })
    
    const fullResponse = completion.choices[0]?.message?.content || ''
    
    // Extract the summary from the response
    const summaryMatch = fullResponse.match(/---SUMMARY:\s*(.+)$/m)
    const conversationSummary = summaryMatch ? summaryMatch[1].trim() : 'Discussed course-related questions and provided guidance.'
    
    // Remove the summary from the displayed response
    const cleanResponse = fullResponse.replace(/---SUMMARY:\s*.+$/m, '').trim()

    const tutorResponse: TutorResponse = {
      response: cleanResponse,
      conversationSummary: conversationSummary
    }

    console.log('Tutor response generated successfully')

    return NextResponse.json({
      success: true,
      tutorResponse
    })

  } catch (error) {
    console.error('Error in tutor API:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate tutor response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
