"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, FileText, PenTool, BookOpen, GraduationCap, Calendar, User } from "lucide-react"
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

interface ContentModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: string | null
}

export function ContentModal({ isOpen, onClose, contentId }: ContentModalProps) {
  const [content, setContent] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && contentId) {
      fetchContent()
    }
  }, [isOpen, contentId])

  const fetchContent = async () => {
    if (!contentId) return
    
    try {
      setLoading(true)
      setError(null)
      
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${getContentTypeColor(content?.type || '')} text-white`}>
              {getContentTypeIcon(content?.type || '')}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#000000]">
                {content ? getContentTypeLabel(content.type) : 'Loading...'}
              </h2>
              {content && (
                <p className="text-[#707D7F]">
                  {content.course.title} • {content.unit.title}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#707D7F] hover:text-[#47624f]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#47624f] mx-auto mb-4"></div>
              <p className="text-[#707D7F]">Loading content...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={onClose} className="bg-gradient-to-r from-[#47624f] to-[#707D7F]">
                Close
              </Button>
            </div>
          )}

          {content && !loading && (
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
          )}
        </div>
      </div>
    </div>
  )
} 