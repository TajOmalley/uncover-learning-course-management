import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { googleCloudStorage } from "@/lib/google-cloud-storage"
import { supabaseAdmin } from "@/lib/supabase"

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

    // Save file record to Supabase database
    const { data: uploadedFile, error: dbError } = await supabaseAdmin
      .from('uploadedfiles')
      .insert({
        originalname: file.name,
        storagepath: storagePath,
        filetype: type,
        mimetype: file.type,
        filesize: file.size,
        userid: session.user.id,
        courseid: courseId
      })
      .select()
      .single()

    if (dbError) {
      console.error("Error saving file record to database:", dbError)
      // Note: We don't fail the upload if database save fails, since the file was uploaded successfully
      // But we should log this for debugging
    }

    // Return success response with file metadata
    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile?.id || `upload-${Date.now()}`,
        originalName: file.name,
        storagePath: storagePath,
        fileType: type,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: uploadedFile?.createdat || new Date().toISOString()
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

// GET - Get all uploaded files for a course
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
      .select('id')
      .eq('id', courseId)
      .eq('userId', session.user.id)
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }

    // Get all uploaded files for the course
    const { data: files, error: filesError } = await supabaseAdmin
      .from('uploadedfiles')
      .select('*')
      .eq('courseid', courseId)
      .eq('userid', session.user.id)
      .order('createdat', { ascending: false })

    if (filesError) {
      console.error("Error fetching uploaded files:", filesError)
      return NextResponse.json(
        { error: "Failed to fetch uploaded files" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: files || []
    })

  } catch (error) {
    console.error("Error fetching uploaded files:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
