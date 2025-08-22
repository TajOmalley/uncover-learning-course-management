"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  CheckCircle, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  Settings
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CourseExportProps {
  courseId: string
  courseName: string
}

interface ExportStatus {
  canvas: {
    exported: boolean
    lmsCourseId?: string
  }
  moodle: {
    exported: boolean
    lmsCourseId?: string
  }
}

interface ConnectionStatus {
  canvas: boolean
  moodle: boolean
}

export function CourseExport({ courseId, courseName }: CourseExportProps) {
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null)
  const [connections, setConnections] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchExportStatus()
  }, [courseId])

  const fetchExportStatus = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/export`)
      if (response.ok) {
        const data = await response.json()
        setExportStatus(data.course.exported)
        setConnections(data.connections)
      } else {
        console.error('Failed to fetch export status')
      }
    } catch (error) {
      console.error('Error fetching export status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (lmsType: 'canvas' | 'moodle') => {
    setExporting(lmsType)
    
    try {
      const response = await fetch(`/api/courses/${courseId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lmsType })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const isUpdate = data.lmsCourse?.isUpdate
        toast({
          title: `${isUpdate ? 'Update' : 'Export'} Successful`,
          description: `Course "${courseName}" has been ${isUpdate ? 'updated in' : 'exported to'} ${lmsType}`,
        })
        
        // Refresh export status
        await fetchExportStatus()
      } else {
        toast({
          title: "Export Failed",
          description: data.error || `Failed to export to ${lmsType}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "An unexpected error occurred during export",
        variant: "destructive",
      })
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export to LMS
          </CardTitle>
          <CardDescription>
            Export your course structure to Learning Management Systems
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export to LMS
        </CardTitle>
        <CardDescription>
          Export your course structure to Learning Management Systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Export */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">C</span>
            </div>
            <div>
              <h3 className="font-medium">Canvas</h3>
              <p className="text-sm text-muted-foreground">
                {connections?.canvas 
                  ? "Connected" 
                  : "Not connected - please set up Canvas integration first"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {exportStatus?.canvas.exported ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Exported
                </Badge>
                <Button
                  onClick={() => handleExport('canvas')}
                  disabled={!connections?.canvas || exporting === 'canvas'}
                  variant="outline"
                  size="sm"
                >
                  {exporting === 'canvas' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Update
                </Button>
                {exportStatus.canvas.lmsCourseId && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => handleExport('canvas')}
                disabled={!connections?.canvas || exporting === 'canvas'}
                size="sm"
              >
                {exporting === 'canvas' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Moodle Export */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">M</span>
            </div>
            <div>
              <h3 className="font-medium">Moodle</h3>
              <p className="text-sm text-muted-foreground">
                {connections?.moodle 
                  ? "Connected" 
                  : "Not connected - please set up Moodle integration first"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {exportStatus?.moodle.exported ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Exported
                </Badge>
                <Button
                  onClick={() => handleExport('moodle')}
                  disabled={!connections?.moodle || exporting === 'moodle'}
                  variant="outline"
                  size="sm"
                >
                  {exporting === 'moodle' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Update
                </Button>
                {exportStatus.moodle.lmsCourseId && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={() => handleExport('moodle')}
                disabled={!connections?.moodle || exporting === 'moodle'}
                size="sm"
              >
                {exporting === 'moodle' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Connection Help */}
        {(!connections?.canvas || !connections?.moodle) && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Need to connect an LMS?</p>
              <p className="text-yellow-700">
                Visit the{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-yellow-700 underline"
                  onClick={() => window.location.href = '/integrations'}
                >
                  integrations page
                </Button>
                {" "}to set up your Canvas or Moodle connections.
              </p>
            </div>
          </div>
        )}

        {/* Export Information */}
        <div className="text-xs text-muted-foreground mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">What gets exported:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Course basic information (title, description, dates)</li>
            <li>Course structure with units as modules/sections</li>
            <li>Unit names and descriptions</li>
          </ul>
          <p className="mt-2 text-xs">
            <strong>Note:</strong> This creates the course skeleton. Generated content (assignments, readings, etc.) 
            will be exported in future updates.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 