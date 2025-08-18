import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { googleCloudStorage } from "@/lib/google-cloud-storage"
import { prisma } from "@/lib/prisma"

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
    const content = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        userId: session.user.id
      },
      include: {
        course: true,
        unit: true
      }
    })

    if (!content) {
      return NextResponse.json(
        { error: "Content not found or access denied" },
        { status: 404 }
      )
    }

    // Parse the content and specifications
    const parsedContent = JSON.parse(content.content)

    // Try to get additional content from Google Cloud Storage if available
    let cloudStorageContent = null
    if (content.storageFilename) {
      try {
        const cloudContent = await googleCloudStorage.downloadContent(content.storageFilename)
        cloudStorageContent = JSON.parse(cloudContent)
      } catch (error) {
        console.error('Error fetching from cloud storage:', error)
        // Continue without cloud storage content
      }
    }

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
        course: content.course,
        unit: content.unit,
        cloudStorageContent
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