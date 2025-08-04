"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Calendar, GraduationCap, LogOut } from "lucide-react"
import { CourseDashboard } from "@/components/course-dashboard"

interface Course {
  id: string
  title: string
  subject: string
  level: string
  startDate: string
  endDate: string
  lectureSchedule: Record<string, string>
  numberOfUnits: number
  units: any[]
  createdAt: string
}

export function UserDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    fetchCourses()
  }, [status, router])

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setCourses(result.courses)
      } else {
        console.error('Failed to fetch courses:', result.error)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = () => {
    router.push('/setup')
  }

  const handleSelectCourse = (course: Course) => {
    // Transform course data to match the expected format for CourseDashboard
    const courseData = {
      courseName: course.title,
      subject: course.subject,
      level: course.level,
      startDate: course.startDate,
      endDate: course.endDate,
      lectureSchedule: course.lectureSchedule,
      calendar: course.units,
      courseId: course.id,
    }
    setSelectedCourse(course)
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47624f] mx-auto"></div>
              <h3 className="text-lg font-semibold text-[#000000]">Loading your courses...</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedCourse) {
    const courseData = {
      courseName: selectedCourse.title,
      subject: selectedCourse.subject,
      level: selectedCourse.level,
      startDate: selectedCourse.startDate,
      endDate: selectedCourse.endDate,
      lectureSchedule: selectedCourse.lectureSchedule,
      calendar: selectedCourse.units,
      courseId: selectedCourse.id,
    }
    return <CourseDashboard courseData={courseData} onBack={handleBackToCourses} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7] via-white to-[#C9F2C7]">
      <button
        onClick={() => router.push('/')}
        className="absolute top-20 left-2 z-10 text-[#47624f] hover:text-[#000000] transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#47624f] via-[#707D7F] to-[#47624f] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Courses</h1>
              <p className="text-[#C9F2C7] mt-2">
                Welcome back, {session?.user?.name || session?.user?.email}
              </p>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-center text-xl text-white" style={{ fontFamily: 'var(--font-fraunces)' }}>
                <div>uncover</div>
                <div>learning</div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  variant="outline"
                  size="sm"
                  className="text-[#47624f] border-white bg-white hover:bg-white hover:text-[#47624f] transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#47624f] to-[#707D7F] rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#000000] mb-4">No courses yet</h3>
              <p className="text-[#707D7F] mb-6">
                Create your first course to get started with course management
              </p>
              <Button
                onClick={handleCreateCourse}
                className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#000000]">Your Courses</h2>
              <Button
                onClick={handleCreateCourse}
                className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-[#47624f]/20"
                  onClick={() => handleSelectCourse(course)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#47624f]" />
                      {course.title}
                    </CardTitle>
                    <CardDescription>
                      {course.subject} • {course.level}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#707D7F]" />
                        <span className="text-sm text-[#707D7F]">
                          {course.startDate} - {course.endDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#707D7F]" />
                        <span className="text-sm text-[#707D7F]">
                          {course.numberOfUnits} Units
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="secondary" className="bg-[#C9F2C7]/20 text-[#47624f]">
                          Created {new Date(course.createdAt).toLocaleDateString()}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white">
                          Open Course
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 