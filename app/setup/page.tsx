"use client"

import { useRouter } from "next/navigation"
import { CourseSetup } from "@/components/course-setup"

export default function SetupPage() {
  const router = useRouter()

  const handleCourseComplete = (data: any) => {
    // Navigate back to main page with a timestamp to force refresh
    router.push(`/?refresh=${Date.now()}`)
  }

  return <CourseSetup onComplete={handleCourseComplete} />
} 