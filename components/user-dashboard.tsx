"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Calendar, GraduationCap, Menu, MoreVertical, Trash2, LogOut } from "lucide-react"
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
import DynamicActionBar from "@/components/ui/dynamic-action"

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

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/signout'
    }
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
    return <CourseDashboard courseData={courseData} onBack={handleBackToCourses} onCourseSelect={handleSelectCourse} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7]/40 via-white to-[#47624f]/20">
      <div 
        className={`flex h-screen transition-all duration-300 ${sidebarOpen ? 'ml-80' : ''}`}
      >
        {/* Canvas Area */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'w-[calc(100vw-320px)]' : 'w-full'}`}>
          {/* Welcome Section */}
          <div className="px-6 py-4 transition-all duration-300">
            <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-5xl font-bold text-[#47624f] mb-2">My Courses</h1>
                  <div className="flex items-center gap-6 text-gray-600">
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">Welcome back,</span>
                      <span>{session?.user?.name || session?.user?.email}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold">Total Courses:</span>
                      <span>{courses.length}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Button
                    onClick={handleCreateCourse}
                    className="bg-[#47624f] hover:bg-[#47624f]/90 text-white mr-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Course
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="px-6 h-[calc(100vh-200px)]">
            {courses.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-lg p-12 shadow-lg text-center max-w-md">
                  <div className="mx-auto w-16 h-16 bg-[#47624f] rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-[#47624f] mb-4">No courses yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first course to get started with course management
                  </p>
                  <Button
                    onClick={handleCreateCourse}
                    className="bg-[#47624f] hover:bg-[#47624f]/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Course
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full overflow-y-auto">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group relative bg-black/5 backdrop-blur-xl border-2 border-[#47624f] rounded-xl shadow-lg p-6 cursor-pointer hover:bg-[#47624f] hover:border-[#47624f] transition-all duration-300 overflow-hidden"
                    onClick={() => handleSelectCourse(course)}
                  >
                    {/* Diagonal shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    </div>

                    {/* Dropdown Menu */}
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-white/20 text-[#47624f] group-hover:text-white"
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

                    {/* Course Content */}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="w-10 h-10 text-[#47624f] group-hover:text-white transition-colors duration-300" />
                        <h3 className="text-2xl font-bold text-[#47624f] group-hover:text-white transition-colors duration-300">
                          {course.title}
                        </h3>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600 group-hover:text-white/80 transition-colors duration-300" />
                          <span className="text-sm text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                            {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-600 group-hover:text-white/80 transition-colors duration-300" />
                          <span className="text-sm text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                            {course.numberOfUnits} Units
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-600 group-hover:text-white/80 transition-colors duration-300" />
                          <span className="text-sm text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                            {course.subject} • {course.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-600 group-hover:text-white/80 transition-colors duration-300" />
                          <span className="text-sm text-gray-600 group-hover:text-white/80 transition-colors duration-300">
                            Created {new Date(course.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sidebar */}
      <NavigationSidebar 
        isOpen={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
        }}
        courses={courses}
        currentPage="My Courses"
        onCourseSelect={handleSelectCourse}
        onAddCourse={handleCreateCourse}
      />
    
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