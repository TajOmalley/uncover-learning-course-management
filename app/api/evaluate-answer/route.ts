import { NextRequest, NextResponse } from 'next/server'

interface AnswerEvaluationRequest {
  question: string
  correctAnswer: string
  userAnswer: string
  courseData: {
    courseName: string
    subject: string
    level: string
  }
}

interface AnswerEvaluationResponse {
  isCorrect: boolean
  feedback: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswer, userAnswer, courseData }: AnswerEvaluationRequest = await request.json()

    // Validate required fields
    if (!question || !correctAnswer || !userAnswer || !courseData) {
      return NextResponse.json(
        { error: 'Missing required question, correct answer, user answer, or course information' },
        { status: 400 }
      )
    }

    console.log('Answer evaluation request received for:', question.substring(0, 50) + '...')

    // Check for OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Create the system prompt for answer evaluation
    const systemPrompt = `You are an expert ${courseData.subject} professor evaluating a student's answer. Your role is to assess whether the student's response demonstrates understanding of the concept and provide constructive feedback.

EVALUATION CRITERIA:
- Assess conceptual understanding, not just word-for-word matching
- Consider if the student grasps the key ideas and principles
- Allow for different ways of expressing the same concept
- Be encouraging but honest about accuracy

RESPONSE FORMAT:
You must respond with ONLY valid JSON in this exact structure:
{
  "isCorrect": true/false,
  "feedback": "Detailed feedback explaining why the answer is correct or incorrect",
  "confidence": 0.95
}

- isCorrect: Boolean indicating if the student's answer demonstrates understanding
- feedback: Constructive explanation of what's right/wrong and how to improve
- confidence: Number between 0 and 1 indicating your confidence in the evaluation

COURSE CONTEXT:
- Course: ${courseData.courseName}
- Subject: ${courseData.subject}
- Level: ${courseData.level}

CRITICAL: Your response must be ONLY the JSON object above. No markdown code blocks, no explanations, no additional text. Start with { and end with }.`

    // Create the user prompt
    const userPrompt = `Please evaluate this student's answer:

Question: "${question}"
Correct Answer: "${correctAnswer}"
Student's Answer: "${userAnswer}"

Evaluate whether the student demonstrates understanding of the concept, considering that different phrasings can express the same understanding. Provide constructive feedback that helps the student learn.`

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
          temperature: 0.3, // Lower temperature for more consistent evaluation
          max_tokens: 1000
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
      let evaluation: AnswerEvaluationResponse
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
        evaluation = JSON.parse(cleanContent)
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', content)
        console.error('Parse error:', parseError)
        
        // Try to extract JSON from the response if it's wrapped in other text
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            evaluation = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('No JSON content found in response')
          }
        } catch (secondParseError) {
          console.error('Second parse attempt failed:', secondParseError)
          throw new Error('Invalid response format from AI model - unable to extract valid JSON')
        }
      }

      // Validate the structure
      if (typeof evaluation.isCorrect !== 'boolean' || !evaluation.feedback || typeof evaluation.confidence !== 'number') {
        throw new Error('Invalid evaluation structure received')
      }

      return NextResponse.json({
        success: true,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        confidence: evaluation.confidence
      })

    } catch (openaiError) {
      console.error('OpenAI API call failed:', openaiError)
      return NextResponse.json(
        { error: 'Failed to evaluate answer with AI model' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Answer evaluation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
