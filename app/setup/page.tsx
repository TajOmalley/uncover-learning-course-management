"use client"

import { useState } from "react"
import { CourseSetup } from "@/components/course-setup"
import { UserDashboard } from "@/components/user-dashboard"

export default function SetupPage() {
  const [currentView, setCurrentView] = useState<'setup' | 'dashboard'>('setup')
  const [courseData, setCourseData] = useState<any>(null)

  const handleCourseComplete = (data: any) => {
    setCourseData(data)
    setCurrentView('dashboard')
  }

  if (currentView === 'dashboard' && courseData) {
    return <UserDashboard />
  }

  return <CourseSetup onComplete={handleCourseComplete} />
} 