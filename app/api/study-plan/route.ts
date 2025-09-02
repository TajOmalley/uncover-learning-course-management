import { NextRequest, NextResponse } from 'next/server'

interface StudyPlanRequestData {
  topic: string
  unit: {
    id: string
    title: string
    week: number
  }
  unitId: string
  courseData: {
    courseName: string
    subject: string
    level: string
    professor?: string
  }
}

interface StudyPlanResponse {
  lessons: Array<{
    title: string
    content: string
    questions: Array<{
      text: string
      correctAnswer: string
    }>
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { topic, unit, courseData }: StudyPlanRequestData = await request.json()

    // Validate required fields
    if (!topic || !unit || !courseData) {
      return NextResponse.json(
        { error: 'Missing required topic, unit, or course information' },
        { status: 400 }
      )
    }

    console.log('Study plan request received for topic:', topic, 'in unit:', unit.title)

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create the system prompt for study plan generation
    const systemPrompt = `You are an expert professor creating a comprehensive study plan for a ${courseData.level} ${courseData.subject} student. Your role is to teach everything the student needs to know about the specified topic through a structured framework.

STUDY PLAN FRAMEWORK:
You must create exactly 3-5 lesson cards, each following this structure:
1. LESSON: Clear, concise content that teaches the topic
2. RECALL: 2 active recall questions to test understanding
3. QUIZ: Questions that reinforce learning
4. PROJECT: Application-based learning (we'll implement this later)

CONTENT REQUIREMENTS:
- Write content that is concise and easy to understand for ${courseData.level} level
- Include illustrative examples to clarify concepts
- Use proper mathematical formatting with LaTeX syntax when needed
- Avoid overly wordy explanations - be direct and clear
- Structure content with clear headings and bullet points
- Make content engaging and memorable

COURSE CONTEXT:
- Course: ${courseData.courseName}
- Subject: ${courseData.subject}
- Level: ${courseData.level}
- Unit: ${unit.title} (Week ${unit.week})
- Topic: ${topic}
- Professor: ${courseData.professor || 'Not specified'}

MATH FORMATTING INSTRUCTIONS:
- Use proper LaTeX syntax for all mathematical expressions
- For inline math: Use single dollar signs like $E=mc^2$ or $x^2 + y^2 = z^2$
- For block/display math: Use double dollar signs like $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- Always escape backslashes in LaTeX: Use \\frac, \\sqrt, \\pm, etc.
- Common LaTeX commands: \\frac{numerator}{denominator}, \\sqrt{expression}, \\sum_{i=1}^{n}, \\int_{a}^{b}, \\lim_{x \\to \\infty}
- Greek letters: \\alpha, \\beta, \\gamma, \\delta, \\theta, \\pi, \\sigma, \\omega, etc.
- Subscripts and superscripts: x_i, x^2, x_{i,j}, x^{n+1}

 RESPONSE FORMAT:
 You must respond with ONLY valid JSON in this exact structure. Do not include any markdown formatting, explanations, or additional text:
 {
   "lessons": [
     {
       "title": "Lesson Title",
       "content": "Lesson content with markdown formatting and LaTeX math",
       "questions": [
         {
           "text": "Question text",
           "correctAnswer": "Correct answer explanation"
         },
         {
           "text": "Second question text", 
           "correctAnswer": "Second correct answer explanation"
         }
       ]
     }
   ]
 }

 CRITICAL: Your response must be ONLY the JSON object above. No markdown code blocks, no explanations, no additional text. Start with { and end with }.`

    // Create the user prompt
    const userPrompt = `Create a comprehensive study plan for the topic "${topic}" within the context of ${unit.title} (Week ${unit.week}) in the ${courseData.subject} course. Focus on making the content accessible for ${courseData.level} students while maintaining academic rigor.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('OpenAI API error:', errorData)
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content received from OpenAI')
      }

      console.log('Raw OpenAI response length:', content.length)
      console.log('Response preview:', content.substring(0, 200) + '...')

      // Parse the JSON response
      let studyPlan: StudyPlanResponse
      try {
        // Clean the content to ensure it's valid JSON
        let cleanContent = content.trim()
        
        // Remove any markdown code blocks if present
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        // Try to parse the cleaned content
        studyPlan = JSON.parse(cleanContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', content)
        console.error('Parse error:', parseError)
        
        // Try to extract JSON from the response if it's wrapped in other text
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            studyPlan = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('No JSON content found in response')
          }
        } catch (secondParseError) {
          console.error('Second parse attempt failed:', secondParseError)
          throw new Error('Invalid response format from AI model - unable to extract valid JSON')
        }
      }

      // Validate the structure
      if (!studyPlan.lessons || !Array.isArray(studyPlan.lessons) || studyPlan.lessons.length === 0) {
        throw new Error('Invalid study plan structure received')
      }

      return NextResponse.json({
        success: true,
        studyPlan
      })

    } catch (openaiError) {
      console.error('OpenAI API call failed:', openaiError)
      return NextResponse.json(
        { error: 'Failed to generate study plan with AI model' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Study plan generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
