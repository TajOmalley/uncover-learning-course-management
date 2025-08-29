import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { googleCloudStorage } from "@/lib/google-cloud-storage"
import { supabaseAdmin } from "@/lib/supabase"

// POST - Save generated content to database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { 
      courseId, 
      unitId, 
      type, 
      content, 
      specifications 
    } = await request.json()

    // Validate required fields
    if (!courseId || !unitId || !type || !content) {
      return NextResponse.json(
        { error: "Missing required content information" },
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

    // Upload content to Google Cloud Storage
    const contentData = JSON.stringify({ content, specifications })
    const storageFilename = await googleCloudStorage.uploadContent(
      contentData,
      {
        courseId,
        unitId,
        type,
        userId: session.user.id,
        specifications
      }
    )

    // Create the generated content record in database
    const { data: generatedContent, error: contentError } = await supabaseAdmin
      .from('GeneratedContent')
      .insert({
        courseId,
        unitId,
        type,
        content: JSON.stringify({ content, specifications }),
        storageFilename,
        userId: session.user.id
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
        storageFilename,
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
        { status: 404 }
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
        createdAt: item.createdAt
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

// DELETE - Delete content from both database and cloud storage
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      )
    }

    // Get the content record
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

    // Delete from Google Cloud Storage if filename exists
    if (content.storageFilename) {
      try {
        await googleCloudStorage.deleteContent(content.storageFilename)
      } catch (storageError) {
        console.error('Error deleting from cloud storage:', storageError)
        // Continue with database deletion even if cloud storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('GeneratedContent')
      .delete()
      .eq('id', contentId)

    if (deleteError) {
      console.error("Error deleting content:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete content" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Content deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 