import { NextRequest, NextResponse } from 'next/server'
import { buildSearchQuery, searchWeb } from '@/lib/search'
import { analyzeSources } from '@/lib/source-processor'
import { generateSourcedContent } from '@/lib/content-generator'

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
  customPrompt?: string
}

interface GeneratedReading {
  title: string
  content: string
  unitId: number
  unitTitle: string
  citations: Array<{
    id: string
    sourceId: string
    sourceTitle: string
    sourceUrl: string
    factId: string
    text: string
    startIndex: number
    endIndex: number
  }>
  sources: Array<{ id: string; title: string; url: string }>
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { courseData, unit, customPrompt }: ReadingRequestData = await request.json()

    // Validate required fields
    if (!courseData || !unit) {
      return NextResponse.json(
        { error: 'Missing required course or unit information' },
        { status: 400 }
      )
    }

    console.log('Starting source-first content generation for:', unit.title)

    // Step 1: Search for authoritative sources
    const searchQuery = buildSearchQuery({
          subject: courseData.subject,
          level: courseData.level,
          unitTitle: unit.title,
          unitDescription: unit.description,
        })
    
    console.log('Search query:', searchQuery)
    
    let sources = await searchWeb(searchQuery)
    console.log('Sources found:', sources.length)

    // Step 2: Analyze sources and extract facts
    console.log('Analyzing sources...')
    const sourceAnalysis = await analyzeSources(sources)
    console.log('Source analysis complete. Facts extracted:', sourceAnalysis.factBank.length)

    // Step 3: Generate content with embedded citations
    console.log('Generating content with embedded citations...')
    const generatedContent = await generateSourcedContent(
      unit.title,
      courseData.subject,
      courseData.level,
      sourceAnalysis,
      customPrompt
    )
    
    console.log('Content generation complete. Citations embedded:', generatedContent.citations.length)

    // Step 4: Create the final reading object
      const generatedReading: GeneratedReading = {
        title: `Reading: ${unit.title}`,
      content: generatedContent.content,
        unitId: unit.id,
        unitTitle: unit.title,
      citations: generatedContent.citations,
      sources: generatedContent.sources
    }

    console.log('Final reading object created with:', {
      contentLength: generatedReading.content.length,
      citationsCount: generatedReading.citations.length,
      sourcesCount: generatedReading.sources.length
    })

      return NextResponse.json({
        success: true,
        reading: generatedReading,
        unit: unit
      })

    } catch (error) {
    console.error('Error generating reading content:', error)
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to generate reading content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 