import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET - Get all courses for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get courses first
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('Course')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (coursesError) {
      console.error("Error fetching courses:", coursesError)
      return NextResponse.json(
        { error: "Failed to fetch courses" },
        { status: 500 }
      )
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        success: true,
        courses: []
      })
    }

    // Get course IDs
    const courseIds = courses.map(course => course.id)

    // Get units for all courses
    const { data: units, error: unitsError } = await supabaseAdmin
      .from('Unit')
      .select('*')
      .in('courseId', courseIds)

    if (unitsError) {
      console.error("Error fetching units:", unitsError)
      return NextResponse.json(
        { error: "Failed to fetch course units" },
        { status: 500 }
      )
    }

    // Get generated content for all courses
    const { data: generatedContent, error: contentError } = await supabaseAdmin
      .from('GeneratedContent')
      .select('*')
      .in('courseId', courseIds)

    if (contentError) {
      console.error("Error fetching generated content:", contentError)
      return NextResponse.json(
        { error: "Failed to fetch course content" },
        { status: 500 }
      )
    }

    // Combine the data manually
    const transformedCourses = courses.map(course => {
      const courseUnits = units?.filter(unit => unit.courseId === course.id) || []
      const courseContent = generatedContent?.filter(content => content.courseId === course.id) || []
      
      return {
        id: course.id,
        title: course.title, // Use title directly from database
        subject: course.subject,
        level: course.level,
        startDate: course.startDate,
        endDate: course.endDate,
        lectureSchedule: course.lectureSchedule,
        numberOfUnits: course.numberOfUnits,
        userId: course.userId,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        canvasCourseId: course.canvasCourseId,
        moodleCourseId: course.moodleCourseId,
        units: courseUnits,
        generatedContent: courseContent
      }
    })

    return NextResponse.json({
      success: true,
      courses: transformedCourses
    })

  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create a new course for the authenticated user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { title, subject, level, startDate, endDate, lectureSchedule, numberOfUnits, units } = await request.json()

    // Validate required fields
    if (!title || !subject || !level || !startDate || !endDate || !numberOfUnits) {
      return NextResponse.json(
        { error: "Missing required course information" },
        { status: 400 }
      )
    }

    // Generate a unique ID for the course
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create the course with the generated ID
    const { data: course, error: courseError } = await supabaseAdmin
      .from('Course')
      .insert({
        id: courseId,
        title,
        subject,
        level,
        startDate,
        endDate,
        lectureSchedule: lectureSchedule || null,
        numberOfUnits,
        userId: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()

    if (courseError) {
      console.error("Error creating course:", courseError)
      return NextResponse.json(
        { error: "Failed to create course" },
        { status: 500 }
      )
    }

    // Create units if provided
    if (units && Array.isArray(units)) {
      for (const unit of units) {
        // Generate unique ID for each unit
        const unitId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        await supabaseAdmin
          .from('Unit')
          .insert({
            id: unitId,
            title: unit.title,
            description: unit.description || null,
            week: unit.week || 1,
            type: unit.type || 'unit',
            color: unit.color || null,
            courseId: course.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        subject: course.subject,
        level: course.level,
        startDate: course.startDate,
        endDate: course.endDate,
        lectureSchedule: course.lectureSchedule,
        numberOfUnits: course.numberOfUnits,
        createdAt: course.createdAt
      }
    })

  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a course and all its related data
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

    // Get related data counts for logging
    const { data: units } = await supabaseAdmin
      .from('Unit')
      .select('id')
      .eq('courseId', courseId)

    const { data: content } = await supabaseAdmin
      .from('GeneratedContent')
      .select('id')
      .eq('courseId', courseId)

    console.log(`Attempting to delete course: ${courseId} with ${units?.length || 0} units and ${content?.length || 0} content items`)

    // Delete generated content first (if any)
    if (content && content.length > 0) {
      const { error: contentError } = await supabaseAdmin
        .from('GeneratedContent')
        .delete()
        .eq('courseId', courseId)
      
      if (contentError) {
        console.error("Error deleting content:", contentError)
      } else {
        console.log(`Deleted ${content.length} content items`)
      }
    }

    // Delete units (if any)
    if (units && units.length > 0) {
      const { error: unitsError } = await supabaseAdmin
        .from('Unit')
        .delete()
        .eq('courseId', courseId)
      
      if (unitsError) {
        console.error("Error deleting units:", unitsError)
      } else {
        console.log(`Deleted ${units.length} units`)
      }
    }

    // Finally delete the course
    const { error: deleteError } = await supabaseAdmin
      .from('Course')
      .delete()
      .eq('id', courseId)
    
    if (deleteError) {
      console.error("Error deleting course:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete course" },
        { status: 500 }
      )
    }
    
    console.log(`Successfully deleted course: ${courseId}`)

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting course:", error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: "Cannot delete course: it has associated content that cannot be removed" },
          { status: 400 }
        )
      }
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json(
      { error: "Failed to delete course. Please try again." },
      { status: 500 }
    )
  }
} 