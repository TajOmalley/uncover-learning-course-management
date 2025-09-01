import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET - Get specific content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { contentId } = params

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      )
    }

    // Get the content record from database
    const { data: content, error: contentError } = await supabaseAdmin
      .from('GeneratedContent')
      .select('*')
      .eq('id', contentId)
      .eq('userId', session.user.id)
      .single()

    if (contentError || !content) {
      return NextResponse.json(
        { error: "Content not found or access denied" },
        { status: 404 }
      )
    }

    // Get related course and unit data separately
    const { data: course } = await supabaseAdmin
      .from('Course')
      .select('*')
      .eq('id', content.courseId)
      .single()

    const { data: unit } = await supabaseAdmin
      .from('Unit')
      .select('*')
      .eq('id', content.unitId)
      .single()

    // Parse the content and specifications
    const parsedContent = JSON.parse(content.content)

    return NextResponse.json({
      success: true,
      content: {
        id: content.id,
        courseId: content.courseId,
        unitId: content.unitId,
        type: content.type,
        content: parsedContent.content || content.content, // Fallback to original content if parsing fails
        specifications: parsedContent.specifications || {},
        storageFilename: content.storageFilename,
        createdAt: content.createdAt,
        course: course,
        unit: unit
      }
    })

  } catch (error) {
    console.error("Error fetching content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 