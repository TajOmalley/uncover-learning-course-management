import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface ExamRequestData {
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
  examSpecs: {
    wordProblems: {
      count: number
      timePerQuestion: number
    }
    essayProblems: {
      count: number
      timePerQuestion: number
    }
    multipleChoice: {
      count: number
      timePerQuestion: number
    }
    totalExamTime: number
  }
  customPrompt?: string
}

interface GeneratedExam {
  title: string
  content: string
  unitId: number
  unitTitle: string
  examSpecs: {
    wordProblems: {
      count: number
      timePerQuestion: number
    }
    essayProblems: {
      count: number
      timePerQuestion: number
    }
    multipleChoice: {
      count: number
      timePerQuestion: number
    }
    totalExamTime: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { courseData, unit, examSpecs, customPrompt }: ExamRequestData = await request.json()

    // Validate required fields
    if (!courseData || !unit || !examSpecs) {
      return NextResponse.json(
        { error: 'Missing required course, unit, or exam specification information' },
        { status: 400 }
      )
    }

    // Validate exam specifications
    const totalQuestions = examSpecs.wordProblems.count + examSpecs.essayProblems.count + examSpecs.multipleChoice.count
    const calculatedTime = (examSpecs.wordProblems.count * examSpecs.wordProblems.timePerQuestion) +
                          (examSpecs.essayProblems.count * examSpecs.essayProblems.timePerQuestion) +
                          (examSpecs.multipleChoice.count * examSpecs.multipleChoice.timePerQuestion)

    if (totalQuestions === 0) {
      return NextResponse.json(
        { error: 'At least one question type must be specified' },
        { status: 400 }
      )
    }

    if (Math.abs(calculatedTime - examSpecs.totalExamTime) > 5) {
      return NextResponse.json(
        { error: 'Calculated exam time does not match specified total time' },
        { status: 400 }
      )
    }

    // Step 1: Prompt Engineering for Exam Generation
    const systemPrompt = `You are an expert educational assessment designer and exam creator with deep knowledge of creating comprehensive, fair, and challenging exams for higher education. Your task is to create exams that are:

- Appropriate for the target student level and subject
- Well-structured with clear instructions and time allocations
- Balanced in difficulty and comprehensive in coverage
- Educational and aligned with learning objectives
- Fair and accessible to all students

Your response should be formatted as a detailed exam with specific time allocations, clear sections for different question types, and appropriate difficulty for the course level.`

    const userPrompt = `Please create a comprehensive exam for the following unit:

Course Information:
- Subject: ${courseData.subject}
- Course Name: ${courseData.courseName}
- Level: ${courseData.level}
- Unit: ${unit.title}
- Unit Description: ${unit.description || 'No description provided'}

Exam Specifications:
- Total Exam Time: ${examSpecs.totalExamTime} minutes
- Word Problems: ${examSpecs.wordProblems.count} questions (${examSpecs.wordProblems.timePerQuestion} minutes each)
- Essay Problems: ${examSpecs.essayProblems.count} questions (${examSpecs.essayProblems.timePerQuestion} minutes each)
- Multiple Choice: ${examSpecs.multipleChoice.count} questions (${examSpecs.multipleChoice.timePerQuestion} minutes each)

Please create an exam that includes:

1. **Clear Instructions** (5 minutes)
   - Exam format and structure
   - Time management guidelines
   - Grading criteria and expectations

2. **Word Problems** (${examSpecs.wordProblems.count} questions, ${examSpecs.wordProblems.count * examSpecs.wordProblems.timePerQuestion} minutes total)
   - Problem-solving questions that test application of concepts
   - Real-world scenarios and practical applications
   - Clear problem statements with all necessary information
   - Appropriate difficulty for ${courseData.level} students

3. **Essay Questions** (${examSpecs.essayProblems.count} questions, ${examSpecs.essayProblems.count * examSpecs.essayProblems.timePerQuestion} minutes total)
   - Analytical and critical thinking questions
   - Comparison and contrast questions
   - Application of theoretical knowledge
   - Clear prompts with specific requirements

4. **Multiple Choice Questions** (${examSpecs.multipleChoice.count} questions, ${examSpecs.multipleChoice.count * examSpecs.multipleChoice.timePerQuestion} minutes total)
   - Knowledge-based questions
   - Application questions
   - Analysis questions
   - 4 options (A, B, C, D) with one correct answer

5. **Answer Key** (for grading purposes)
   - Detailed solutions for word problems
   - Sample essay responses with key points
   - Correct answers for multiple choice questions
   - Grading rubrics and point allocations

${customPrompt ? `CUSTOM INSTRUCTIONS: ${customPrompt}
These instructions should guide the exam format, question types, and assessment focus. Please incorporate these requirements while maintaining the core educational structure.` : ''}

Format the exam with clear sections, time allocations, and detailed instructions. Ensure the exam is comprehensive, fair, and appropriate for ${courseData.level} students studying ${courseData.subject}.`

    // Step 2: LLM API Integration
    const llmProvider = process.env.LLM_PROVIDER || 'gemini'
    
    // Debug logging
    console.log('=== LLM PROVIDER DEBUG (Exam) ===')
    console.log('LLM_PROVIDER env var:', process.env.LLM_PROVIDER)
    console.log('Selected provider:', llmProvider)
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('=================================')
    
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
      // Create the exam content object
      const generatedExam: GeneratedExam = {
        title: `Exam: ${unit.title}`,
        content: text,
        unitId: unit.id,
        unitTitle: unit.title,
        examSpecs: examSpecs
      }

      return NextResponse.json({
        success: true,
        exam: generatedExam,
        unit: unit
      })

    } catch (error) {
      console.error('Error calling LLM API:', error)
      
      // Fallback to mock exam content if API fails
      const fallbackExam: GeneratedExam = {
        title: `Exam: ${unit.title}`,
        content: `# Exam: ${unit.title}

**Course:** ${courseData.courseName}  
**Subject:** ${courseData.subject}  
**Level:** ${courseData.level}  
**Duration:** ${examSpecs.totalExamTime} minutes  
**Unit:** ${unit.title}

## Instructions
- Read all questions carefully before beginning
- Manage your time effectively across all sections
- Show all work for partial credit on word problems
- Write clearly and concisely for essay questions
- Choose the best answer for multiple choice questions

## Section A: Word Problems (${examSpecs.wordProblems.count} questions, ${examSpecs.wordProblems.count * examSpecs.wordProblems.timePerQuestion} minutes)

${Array.from({ length: examSpecs.wordProblems.count }, (_, i) => `### Problem ${i + 1} (${examSpecs.wordProblems.timePerQuestion} minutes)
[Word problem ${i + 1} related to ${unit.title} with real-world application]

**Solution:**
[Detailed solution with step-by-step explanation]`).join('\n\n')}

## Section B: Essay Questions (${examSpecs.essayProblems.count} questions, ${examSpecs.essayProblems.count * examSpecs.essayProblems.timePerQuestion} minutes)

${Array.from({ length: examSpecs.essayProblems.count }, (_, i) => `### Essay ${i + 1} (${examSpecs.essayProblems.timePerQuestion} minutes)
[Essay prompt ${i + 1} requiring analysis and critical thinking about ${unit.title}]

**Key Points to Address:**
- [Point 1]
- [Point 2]
- [Point 3]`).join('\n\n')}

## Section C: Multiple Choice (${examSpecs.multipleChoice.count} questions, ${examSpecs.multipleChoice.count * examSpecs.multipleChoice.timePerQuestion} minutes)

${Array.from({ length: examSpecs.multipleChoice.count }, (_, i) => `${i + 1}. [Multiple choice question ${i + 1} related to ${unit.title}]
   A) [Option A]
   B) [Option B]
   C) [Option C]
   D) [Option D]

**Answer:** [Correct option]`).join('\n\n')}

## Answer Key

### Word Problem Solutions
${Array.from({ length: examSpecs.wordProblems.count }, (_, i) => `**Problem ${i + 1}:** [Detailed solution with calculations and explanations]`).join('\n')}

### Essay Grading Rubrics
${Array.from({ length: examSpecs.essayProblems.count }, (_, i) => `**Essay ${i + 1}:** 
- Excellent (90-100%): [Criteria]
- Good (80-89%): [Criteria]
- Satisfactory (70-79%): [Criteria]
- Needs Improvement (60-69%): [Criteria]`).join('\n')}

### Multiple Choice Answers
${Array.from({ length: examSpecs.multipleChoice.count }, (_, i) => `${i + 1}. [Correct answer with brief explanation]`).join('\n')}

## Total Points: [Calculate based on question types and difficulty]`,
        unitId: unit.id,
        unitTitle: unit.title,
        examSpecs: examSpecs
      }

      return NextResponse.json({
        success: true,
        exam: fallbackExam,
        unit: unit,
        error: 'LLM generation failed, using fallback content'
      })
    }

  } catch (error) {
    console.error('Error generating exam content:', error)
    return NextResponse.json(
      { error: 'Failed to generate exam content' },
      { status: 500 }
    )
  }
} 