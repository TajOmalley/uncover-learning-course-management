"use client"

import { useRouter } from "next/navigation"
import { CourseSetup } from "@/components/course-setup"

export default function SetupPage() {
  const router = useRouter()

  const handleCourseComplete = (data: any) => {
    // Navigate back to main page which will show the updated course list
    router.push('/')
  }

  return <CourseSetup onComplete={handleCourseComplete} />
} 