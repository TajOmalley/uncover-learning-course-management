import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

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