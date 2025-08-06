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
  const [popupWindow, setPopupWindow] = useState<Window | null>(null)

  useEffect(() => {
    if (isOpen && contentId) {
      openPopupWindow()
    }
  }, [isOpen, contentId])

  const openPopupWindow = () => {
    if (!contentId) return
    
    // Close existing popup if any
    if (popupWindow && !popupWindow.closed) {
      popupWindow.close()
    }

    // Open new popup window
    const popup = window.open(
      `/content/${contentId}`,
      'contentViewer',
      'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no'
    )

    if (popup) {
      setPopupWindow(popup)
      
      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setPopupWindow(null)
          onClose()
        }
      }, 1000)
    } else {
      // Fallback if popup blocked
      alert('Please allow popups for this site to view content')
      onClose()
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

  // Don't render anything - the popup window handles the content display
  return null
} 