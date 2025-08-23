import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { googleCloudStorage } from "@/lib/google-cloud-storage"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    const courseId = formData.get("courseId") as string

    // Validate required fields
    if (!file || !type || !courseId) {
      return NextResponse.json(
        { error: "Missing required fields: file, type, or courseId" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "application/rtf"
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported types: PDF, Word, PowerPoint, Text, RTF" },
        { status: 400 }
      )
    }

    // Validate upload type
    const allowedUploadTypes = [
      "syllabus",
      "lecture slides",
      "lecture notes",
      "homework assignments",
      "news articles",
      "research papers"
    ]

    if (!allowedUploadTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid upload type" },
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExtension = file.name.split('.').pop()
    const filename = `${file.name.replace(/\.[^/.]+$/, "")}-${timestamp}.${fileExtension}`

    // Upload to Google Cloud Storage
    const storagePath = `professor uploads/${type}/${filename}`
    
    try {
      await googleCloudStorage.uploadFile(
        buffer,
        storagePath,
        {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadType: type,
            courseId: courseId,
            userId: session.user.id,
            uploadedAt: new Date().toISOString()
          }
        }
      )
    } catch (storageError) {
      console.error("Error uploading to Google Cloud Storage:", storageError)
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      )
    }

    // Return success response with file metadata
    return NextResponse.json({
      success: true,
      file: {
        id: `upload-${Date.now()}`, // Generate a simple ID
        originalName: file.name,
        storagePath: storagePath,
        fileType: type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET - Get all uploaded files for a course (placeholder for now)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    files: [] // Return empty array for now
  })
}
