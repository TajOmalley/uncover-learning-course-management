"use client"

import { useEffect, useState } from "react"
import { CourseExport } from "@/components/course-export"

interface PageProps {
  params: { courseId: string }
}

export default function CourseExportPage({ params }: PageProps) {
  const { courseId } = params
  const [courseName, setCourseName] = useState<string>("")

  useEffect(() => {
    const fetchCourseName = async () => {
      try {
        const res = await fetch("/api/courses")
        if (!res.ok) return
        const data = await res.json()
        if (data?.success && Array.isArray(data.courses)) {
          const match = data.courses.find((c: any) => c.id === courseId)
          if (match) setCourseName(match.title || "")
        }
      } catch (_) {}
    }
    fetchCourseName()
  }, [courseId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7]/40 via-white to-[#47624f]/20 p-6">
      <div className="max-w-5xl mx-auto">
        <CourseExport courseId={courseId} courseName={courseName || ""} />
      </div>
    </div>
  )
}


