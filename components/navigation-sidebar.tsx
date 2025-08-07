"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, GraduationCap, Home, LogOut, X, Plus } from "lucide-react"
import Image from "next/image"

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

interface NavigationSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
  courses?: Course[]
  onCourseSelect?: (course: Course) => void
  onAddCourse?: () => void
}

export function NavigationSidebar({ isOpen, onClose, currentPage, courses = [], onCourseSelect, onAddCourse }: NavigationSidebarProps) {
  const navigationItems = [
    {
      label: "My Courses",
      href: "/",
      icon: Home,
      description: "View all your courses"
    }
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Sidebar - Toggleable on All Screen Sizes */}
      <div className={`
        fixed top-0 left-0 h-screen w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center flex-1">
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={1000}
                    height={1000}
                    className="object-contain"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 p-6">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.label
                
                return (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className={`w-full justify-start text-left h-auto p-4 ${
                      isActive 
                        ? 'bg-[#47624f] text-white hover:bg-[#47624f]' 
                        : 'text-[#707D7F] hover:bg-[#C9F2C7]/20 hover:text-[#47624f]'
                    }`}
                    onClick={() => {
                      if (item.href !== "#") {
                        window.location.href = item.href
                      }
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs opacity-75">{item.description}</span>
                    </div>
                  </Button>
                )
              })}
              
              {/* Add Course Button */}
              {onAddCourse && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-4 text-[#707D7F] hover:bg-[#C9F2C7]/20 hover:text-[#47624f]"
                  onClick={onAddCourse}
                >
                  <Plus className="w-5 h-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Add Course</span>
                    <span className="text-xs opacity-75">Create a new course</span>
                  </div>
                </Button>
              )}
              
              {/* Course List */}
              {courses.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-[#707D7F] mb-3 px-4">Your Courses</h3>
                  <div className="space-y-1">
                    {courses.map((course) => (
                      <Button
                        key={course.id}
                        variant="ghost"
                        className={`w-full justify-start text-left h-auto p-3 text-sm ${
                          currentPage === course.title
                            ? 'bg-[#47624f] text-white hover:bg-[#47624f]' 
                            : 'text-[#707D7F] hover:bg-[#C9F2C7]/20 hover:text-[#47624f]'
                        }`}
                        onClick={() => onCourseSelect?.(course)}
                      >
                        <GraduationCap className="w-4 h-4 mr-3" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium truncate">{course.title}</span>
                          <span className="text-xs opacity-75">{course.subject}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Sign Out */}
          <div className="p-6 border-t border-gray-200">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full text-[#47624f] border-[#47624f] hover:bg-[#47624f] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
} 