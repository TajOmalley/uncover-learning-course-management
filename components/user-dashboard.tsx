"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Calendar, GraduationCap, Menu, MoreVertical, Trash2 } from "lucide-react"
import { CourseDashboard } from "@/components/course-dashboard"
import { NavigationSidebar } from "@/components/navigation-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    fetchCourses()
  }, [status, router])

  // Add effect to refetch courses when URL changes (e.g., after course creation)
  useEffect(() => {
    if (status === "authenticated") {
      fetchCourses()
    }
  }, [status])

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...')
      // Force fresh deployment to regenerate Prisma client
      const response = await fetch('/api/courses')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }

      const result = await response.json()
      console.log('Courses API response:', result)
      
      if (result.success) {
        setCourses(result.courses)
        console.log('Courses set:', result.courses)
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

  const handleDeleteCourse = async (course: Course) => {
    setCourseToDelete(course)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!courseToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/courses?courseId=${courseToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Remove the course from the local state
        setCourses(courses.filter(course => course.id !== courseToDelete.id))
        setDeleteDialogOpen(false)
        setCourseToDelete(null)
        
        // Show success message
        try {
          const { toast } = await import("@/hooks/use-toast")
          toast({
            title: "Course deleted",
            description: `"${courseToDelete.title}" has been successfully deleted.`,
          })
        } catch (_) {}
      } else {
        // Handle specific error messages from the API
        const errorMessage = result.error || 'Failed to delete course'
        console.error('Error deleting course:', errorMessage)
        
        try {
          const { toast } = await import("@/hooks/use-toast")
          toast({
            title: "Delete failed",
            description: errorMessage,
            variant: "destructive",
          })
        } catch (_) {
          // Fallback to alert if toast is not available
          alert(`Failed to delete course: ${errorMessage}`)
        }
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      
      try {
        const { toast } = await import("@/hooks/use-toast")
        toast({
          title: "Delete failed",
          description: "Network error. Please check your connection and try again.",
          variant: "destructive",
        })
      } catch (_) {
        // Fallback to alert if toast is not available
        alert('Network error. Please check your connection and try again.')
      }
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setCourseToDelete(null)
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
      lectureSchedule: typeof selectedCourse.lectureSchedule === 'string'
        ? (() => { try { return JSON.parse(selectedCourse.lectureSchedule) } catch { return {} } })()
        : selectedCourse.lectureSchedule,
      calendar: selectedCourse.units,
      courseId: selectedCourse.id,
    }
    return <CourseDashboard courseData={courseData} onBack={handleBackToCourses} />
  }

  return (
    <div className="min-h-screen flex">
      <NavigationSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage="My Courses"
        courses={courses}
        onCourseSelect={handleSelectCourse}
        onAddCourse={handleCreateCourse}
      />
      
      <div className={`flex-1 bg-gradient-to-br from-[#C9F2C7] via-white to-[#C9F2C7] relative transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : ''}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#47624f] via-[#707D7F] to-[#47624f] text-white relative">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-1/2 left-8 z-10 text-white hover:text-[#C9F2C7] transition-colors transform -translate-y-1/2"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="ml-20">
              <h1 className="text-3xl font-bold">My Courses</h1>
              <p className="text-[#C9F2C7] mt-2">
                Welcome back, {session?.user?.name || session?.user?.email}
              </p>
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
                  className="hover:shadow-lg transition-all duration-200 border-2 hover:border-[#47624f]/20 relative"
                >
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCourse(course)
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#47624f]" />
                      {course.title}
                    </CardTitle>
                    <CardDescription>
                      {course.subject} • {course.level}
                    </CardDescription>
                  </CardHeader>
                  <CardContent 
                    className="cursor-pointer"
                    onClick={() => handleSelectCourse(course)}
                  >
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
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Course</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone and will permanently remove the course and all its content.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleting ? 'Deleting...' : 'Delete Course'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
)
} 