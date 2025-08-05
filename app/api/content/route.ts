import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { googleCloudStorage } from "@/lib/google-cloud-storage"

const prisma = new PrismaClient()

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
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id
      }
    })

    if (!course) {
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
    const generatedContent = await prisma.generatedContent.create({
      data: {
        courseId,
        unitId,
        type,
        content: JSON.stringify({ content, specifications }),
        storageFilename,
        userId: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      content: {
        id: generatedContent.id,
        courseId: generatedContent.courseId,
        unitId: generatedContent.unitId,
        type: generatedContent.type,
        content: JSON.parse(generatedContent.content),
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
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }

    // Get all content for the course
    const content = await prisma.generatedContent.findMany({
      where: {
        courseId,
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse the content and specifications
    const parsedContent = content.map(item => {
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
    const content = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        userId: session.user.id
      }
    })

    if (!content) {
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
    await prisma.generatedContent.delete({
      where: {
        id: contentId
      }
    })

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