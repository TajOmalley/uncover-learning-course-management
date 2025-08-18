import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const courses = await prisma.course.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        units: true,
        generatedContent: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      courses
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

    // Create the course
    const course = await prisma.course.create({
      data: {
        title,
        subject,
        level,
        startDate,
        endDate,
        lectureSchedule: JSON.stringify(lectureSchedule),
        numberOfUnits,
        userId: session.user.id
      }
    })

    // Create units if provided
    if (units && Array.isArray(units)) {
      for (const unit of units) {
        await prisma.unit.create({
          data: {
            title: unit.title,
            week: unit.week,
            type: unit.type,
            color: unit.color,
            description: unit.description || null,
            courseId: course.id
          }
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
        lectureSchedule: JSON.parse(course.lectureSchedule),
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
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: session.user.id
      },
      include: {
        units: true,
        generatedContent: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      )
    }

    console.log(`Attempting to delete course: ${courseId} with ${course.units.length} units and ${course.generatedContent.length} content items`)

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete generated content first (if any)
      if (course.generatedContent.length > 0) {
        await tx.generatedContent.deleteMany({
          where: {
            courseId: courseId
          }
        })
        console.log(`Deleted ${course.generatedContent.length} content items`)
      }

      // Delete units (if any)
      if (course.units.length > 0) {
        await tx.unit.deleteMany({
          where: {
            courseId: courseId
          }
        })
        console.log(`Deleted ${course.units.length} units`)
      }

      // Finally delete the course
      await tx.course.delete({
        where: {
          id: courseId
        }
      })
      console.log(`Successfully deleted course: ${courseId}`)
    })

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