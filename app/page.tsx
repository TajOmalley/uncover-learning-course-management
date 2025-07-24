"use client"

import { useState } from "react"
import { HeroPage } from "@/components/hero-page"
import { CourseSetup } from "@/components/course-setup"
import { CourseDashboard } from "@/components/course-dashboard"

export default function Home() {
  const [currentView, setCurrentView] = useState<'hero' | 'setup' | 'dashboard'>('hero')
  const [courseData, setCourseData] = useState(null)

  const handleStartCourse = () => {
    setCurrentView('setup')
  }

  const handleCourseSetup = (data: any) => {
    setCourseData(data)
    setCurrentView('dashboard')
  }

  if (currentView === 'hero') {
    return <HeroPage onStartCourse={handleStartCourse} />
  }

  if (currentView === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7] via-[#B2A29E] to-[#707D7F]">
        <CourseSetup onComplete={handleCourseSetup} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7] via-[#B2A29E] to-[#707D7F]">
      <CourseDashboard courseData={courseData} />
    </div>
  )
}
