"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, FileText, PenTool, GraduationCap, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"

interface ContentData {
  id: string
  courseId: string
  unitId: string
  type: string
  content: string
  specifications: any
  createdAt: string
  course: {
    title: string
    subject: string
    level: string
  }
  unit: {
    title: string
    week: number
  }
}

export default function ContentViewPage() {
  const params = useParams()
  const router = useRouter()
  const [content, setContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const contentId = params.contentId as string

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/content/${contentId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch content')
        }

        const result = await response.json()
        
        if (result.success) {
          setContent(result.content)
        } else {
          setError(result.error || 'Failed to load content')
        }
      } catch (error) {
        console.error('Error fetching content:', error)
        setError('Failed to load content')
      } finally {
        setLoading(false)
      }
    }

    if (contentId) {
      fetchContent()
    }
  }, [contentId])

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return <FileText className="w-5 h-5" />
      case 'homework':
        return <PenTool className="w-5 h-5" />
      case 'lesson-plan':
        return <BookOpen className="w-5 h-5" />
      case 'exam':
        return <GraduationCap className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'reading':
        return 'Reading Content'
      case 'homework':
        return 'Homework Problems'
      case 'lesson-plan':
        return 'Lesson Plan'
      case 'exam':
        return 'Exam'
      default:
        return 'Content'
    }
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'reading':
        return 'bg-gradient-to-r from-[#C9F2C7] to-[#47624f]'
      case 'homework':
        return 'bg-gradient-to-r from-[#B2A29E] to-[#707D7F]'
      case 'lesson-plan':
        return 'bg-gradient-to-r from-[#47624f] to-[#707D7F]'
      case 'exam':
        return 'bg-gradient-to-r from-[#000000] to-[#707D7F]'
      default:
        return 'bg-gradient-to-r from-[#47624f] to-[#707D7F]'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47624f] mx-auto mb-4"></div>
          <p className="text-[#707D7F]">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-[#707D7F] mb-4">{error || 'Content not found'}</p>
            <Button 
              onClick={() => router.back()}
              className="bg-gradient-to-r from-[#47624f] to-[#707D7F]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="border-[#B2A29E] text-[#707D7F] hover:border-[#47624f]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#000000]">
                  {getContentTypeLabel(content.type)}
                </h1>
                <p className="text-[#707D7F]">
                  {content.course.title} • {content.unit.title}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-lg ${getContentTypeColor(content.type)} text-white`}>
              {getContentTypeIcon(content.type)}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getContentTypeIcon(content.type)}
                  {getContentTypeLabel(content.type)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <ReactMarkdown>{content.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#707D7F]" />
                  <span className="text-sm font-medium">{content.course.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#707D7F]" />
                  <span className="text-sm text-[#707D7F]">{content.course.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#707D7F]" />
                  <span className="text-sm text-[#707D7F]">Week {content.unit.week}</span>
                </div>
                <Badge variant="secondary" className="w-full justify-center">
                  {content.course.level}
                </Badge>
              </CardContent>
            </Card>

            {/* Content Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-[#000000]">Created</p>
                  <p className="text-sm text-[#707D7F]">
                    {format(new Date(content.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#000000]">Unit</p>
                  <p className="text-sm text-[#707D7F]">{content.unit.title}</p>
                </div>
                {content.specifications && (
                  <div>
                    <p className="text-sm font-medium text-[#000000]">Specifications</p>
                    <div className="text-sm text-[#707D7F]">
                      {Object.entries(content.specifications).map(([key, value]) => (
                        <div key={key} className="mt-1">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 