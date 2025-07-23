"use client"

import { useState } from "react"
import { CourseSetup } from "@/components/course-setup"
import { CourseDashboard } from "@/components/course-dashboard"

export default function Home() {
  const [courseData, setCourseData] = useState(null)

  const handleCourseSetup = (data: any) => {
    setCourseData(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {!courseData ? <CourseSetup onComplete={handleCourseSetup} /> : <CourseDashboard courseData={courseData} />}
    </div>
  )
}
