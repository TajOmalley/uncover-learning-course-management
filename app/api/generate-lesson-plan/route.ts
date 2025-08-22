import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface LessonPlanRequestData {
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
  lectureLength: number // in minutes
  customPrompt?: string
}

interface GeneratedLessonPlan {
  title: string
  content: string
  unitId: number
  unitTitle: string
  lectureLength: number
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { courseData, unit, lectureLength, customPrompt }: LessonPlanRequestData = await request.json()

    // Validate required fields
    if (!courseData || !unit || !lectureLength) {
      return NextResponse.json(
        { error: 'Missing required course, unit, or lecture length information' },
        { status: 400 }
      )
    }

    // Validate lecture length
    if (lectureLength < 15 || lectureLength > 180) {
      return NextResponse.json(
        { error: 'Lecture length must be between 15 and 180 minutes' },
        { status: 400 }
      )
    }

    // Step 1: Prompt Engineering for Lesson Plans
    const systemPrompt = `You are an expert educational content creator and curriculum designer with deep knowledge of creating engaging, effective lesson plans for higher education. Your task is to create comprehensive lesson plans that are:

- Well-structured with clear time allocations
- Engaging and interactive for students
- Appropriate for the target student level and subject
- Balanced between lecture, discussion, and activities
- Educational and aligned with learning objectives

Your response should be formatted as a detailed lesson plan with specific time allocations, clear sections for different activities, and engaging content that promotes active learning.

MATH FORMATTING INSTRUCTIONS:
- For inline mathematical expressions, wrap them in single dollar signs: $expression$
- For block/display mathematical expressions, wrap them in double dollar signs: $$expression$$
- Use proper LaTeX syntax for all mathematical notation
- Examples:
  - Inline: "Introduce the derivative $f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$"
  - Block: "$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$"
  - Functions: "$f(x) = x^2 \cdot \sin(x)$"
  - Fractions: "$\frac{a}{b}$"
  - Greek letters: "$\alpha$, $\beta$, $\gamma$"
  - Subscripts/superscripts: "$x_1$, $x^2$"
  - Equations: "$2x + 3y = 7$"
  - Inequalities: "$x > 5$"
  - Sets: "$A = \{1, 2, 3\}$"
  - Limits: "$\lim_{x \to \infty} f(x)$"
  - Integrals: "$\int_0^1 x^2 dx$"
  - Summations: "$\sum_{i=1}^n x_i$"
  - Matrices: "$\begin{pmatrix} a & b \\ c & d \end{pmatrix}$"
  - Derivatives: "$\frac{d}{dx}f(x)$"
  - Partial derivatives: "$\frac{\partial f}{\partial x}$"`

    const userPrompt = `Please create a detailed lesson plan for the following unit:

Course Information:
- Subject: ${courseData.subject}
- Course Name: ${courseData.courseName}
- Level: ${courseData.level}
- Unit: ${unit.title}
- Unit Description: ${unit.description || 'No description provided'}
- Lecture Length: ${lectureLength} minutes

Please create a comprehensive lesson plan that includes:

1. **Introduction and Overview** (10-15% of time)
   - Brief overview of the day's objectives
   - Connection to previous material
   - Outline of what students will learn

2. **Professor Lecture Segments** (40-50% of time)
   - Clear time allocations for each topic
   - Detailed outline notes for the professor
   - Key points and concepts to emphasize
   - Examples and explanations to include

3. **Group Work and Discussion** (25-35% of time)
   - Structured discussion questions
   - Group activities that promote collaboration
   - Student-led discussions on key topics
   - Peer learning opportunities

4. **Engaging Activity** (15-25% of time)
   - Interactive activity that connects to the content
   - Hands-on learning experience
   - Application of concepts learned
   - Creative or problem-solving component

5. **Conclusion and Wrap-up** (5-10% of time)
   - Summary of key takeaways
   - Connection to next lesson
   - Assignment or homework preview

${customPrompt ? `CUSTOM INSTRUCTIONS: ${customPrompt}
These instructions should guide the lesson structure, activities, and teaching approach. Please incorporate these requirements while maintaining the core educational structure.` : ''}

Format the content with clear headings, time allocations, and detailed instructions for each section. Ensure the lesson plan is engaging, educational, and appropriate for ${courseData.level} students studying ${courseData.subject}.`

    // Step 2: LLM API Integration
    const llmProvider = process.env.LLM_PROVIDER || 'gemini'
    
    // Debug logging
    console.log('=== LLM PROVIDER DEBUG (Lesson Plan) ===')
    console.log('LLM_PROVIDER env var:', process.env.LLM_PROVIDER)
    console.log('Selected provider:', llmProvider)
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('Gemini API Key exists:', !!process.env.GEMINI_API_KEY)
    console.log('========================================')
    
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
      // Create the lesson plan content object
      const generatedLessonPlan: GeneratedLessonPlan = {
        title: `Lesson Plan: ${unit.title}`,
        content: text,
        unitId: unit.id,
        unitTitle: unit.title,
        lectureLength: lectureLength
      }

      return NextResponse.json({
        success: true,
        lessonPlan: generatedLessonPlan,
        unit: unit
      })

    } catch (error) {
      console.error('Error calling LLM API:', error)
      
      // Fallback to mock lesson plan content if API fails
      const fallbackLessonPlan: GeneratedLessonPlan = {
        title: `Lesson Plan: ${unit.title}`,
        content: `# Lesson Plan: ${unit.title}

**Course:** ${courseData.courseName}  
**Subject:** ${courseData.subject}  
**Level:** ${courseData.level}  
**Duration:** ${lectureLength} minutes  
**Unit:** ${unit.title}

## Learning Objectives
By the end of this lesson, students will be able to:
- Understand the key concepts of ${unit.title}
- Apply theoretical knowledge to practical scenarios
- Collaborate effectively in group discussions
- Demonstrate comprehension through interactive activities

## Lesson Structure

### 1. Introduction and Overview (${Math.round(lectureLength * 0.1)} minutes)
- Welcome and review of previous material
- Introduction to today's topic: ${unit.title}
- Overview of learning objectives
- Connection to course themes

### 2. Professor Lecture Segments (${Math.round(lectureLength * 0.45)} minutes)

#### Segment 1: Core Concepts (${Math.round(lectureLength * 0.2)} minutes)
**Professor Notes:**
- Key concept 1: [Main point with explanation]
- Key concept 2: [Main point with explanation]
- Key concept 3: [Main point with explanation]

**Examples to Include:**
- Real-world application example
- Historical context or background
- Current relevance to the field

#### Segment 2: Advanced Topics (${Math.round(lectureLength * 0.15)} minutes)
**Professor Notes:**
- Advanced concept 1: [Detailed explanation]
- Advanced concept 2: [Detailed explanation]

**Discussion Points:**
- How these concepts build on previous knowledge
- Implications for future learning

#### Segment 3: Practical Applications (${Math.round(lectureLength * 0.1)} minutes)
**Professor Notes:**
- Application 1: [How to apply in practice]
- Application 2: [How to apply in practice]

### 3. Group Work and Discussion (${Math.round(lectureLength * 0.3)} minutes)

#### Small Group Discussion (${Math.round(lectureLength * 0.15)} minutes)
**Discussion Questions:**
1. How do the concepts from today's lecture apply to real-world scenarios?
2. What are the potential challenges in implementing these ideas?
3. How might these concepts evolve in the future?

**Group Activities:**
- Case study analysis in pairs
- Problem-solving scenarios
- Peer teaching exercises

#### Class Discussion (${Math.round(lectureLength * 0.15)} minutes)
- Share insights from group work
- Address common misconceptions
- Explore different perspectives
- Connect to broader course themes

### 4. Engaging Activity (${Math.round(lectureLength * 0.2)} minutes)

**Activity: Interactive Application Exercise**
- Students work in teams to apply concepts
- Hands-on problem-solving scenario
- Creative application of learned material
- Presentation of findings to class

**Activity Instructions:**
1. Divide class into groups of 3-4 students
2. Provide scenario or problem related to ${unit.title}
3. Allow 10 minutes for group work
4. Each group presents their solution (2-3 minutes each)
5. Class discussion of different approaches

### 5. Conclusion and Wrap-up (${Math.round(lectureLength * 0.05)} minutes)
- Summary of key takeaways
- Connection to next lesson
- Preview of upcoming assignments
- Questions and clarifications

## Assessment and Evaluation
- Informal assessment through discussion participation
- Group work evaluation
- Activity completion and presentation
- Student engagement and understanding

## Materials Needed
- Whiteboard and markers
- Handouts for group activities
- Technology for presentations (if applicable)
- Additional resources as needed

## Notes for Professor
- Be prepared to adapt timing based on student engagement
- Encourage participation from all students
- Connect activities to real-world applications
- Provide clear transitions between sections`,
        unitId: unit.id,
        unitTitle: unit.title,
        lectureLength: lectureLength
      }

      return NextResponse.json({
        success: true,
        lessonPlan: fallbackLessonPlan,
        unit: unit,
        error: 'LLM generation failed, using fallback content'
      })
    }

  } catch (error) {
    console.error('Error generating lesson plan content:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson plan content' },
      { status: 500 }
    )
  }
} 