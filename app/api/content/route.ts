import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// POST - Create new generated content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { courseId, unitId, type, content, specifications } = await request.json()

    // Validate required fields
    if (!courseId || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, type, or content" },
        { status: 400 }
      )
    }

    // Verify the course belongs to the authenticated user
    const { data: course, error: courseError } = await supabaseAdmin
      .from('Course')
      .select('*')
      .eq('id', courseId)
      .eq('userId', session.user.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }

    // Generate a unique ID for the content
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the generated content
    const { data: generatedContent, error: contentError } = await supabaseAdmin
      .from('GeneratedContent')
      .insert({
        id: contentId,
        courseId,
        unitId,
        type,
        content: JSON.stringify({ content, specifications }),
        storageFilename: null,
        userId: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (contentError) {
      console.error("Error creating content:", contentError)
      return NextResponse.json(
        { error: "Failed to save content" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: {
        id: generatedContent.id,
        courseId: generatedContent.courseId,
        unitId: generatedContent.unitId,
        type: generatedContent.type,
        content: content,
        specifications: specifications,
        storageFilename: generatedContent.storageFilename,
        createdAt: generatedContent.createdAt
      }
    })

  } catch (error) {
    console.error("Error saving content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get all content for a specific course
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    // Verify the course belongs to the authenticated user
    const { data: course, error: courseError } = await supabaseAdmin
      .from('Course')
      .select('*')
      .eq('id', courseId)
      .eq('userId', session.user.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 400 }
      )
    }

    // Get all content for the course
    const { data: content, error: contentError } = await supabaseAdmin
      .from('GeneratedContent')
      .select('*')
      .eq('courseId', courseId)
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (contentError) {
      console.error("Error fetching content:", contentError)
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      )
    }

    // Parse the content and specifications
    const parsedContent = (content || []).map((item: any) => {
      const parsedContent = JSON.parse(item.content)
      return {
        id: item.id,
        courseId: item.courseId,
        unitId: item.unitId,
        type: item.type,
        content: parsedContent.content,
        specifications: parsedContent.specifications,
        storageFilename: item.storageFilename,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      content: parsedContent
    })

  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 