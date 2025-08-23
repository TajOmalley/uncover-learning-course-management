"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react"

interface UploadViewProps {
  courseData: any
  onBack: () => void
}

const UPLOAD_TYPES = [
  { value: "syllabus", label: "Syllabus" },
  { value: "lecture slides", label: "Lecture Slides" },
  { value: "lecture notes", label: "Lecture Notes" },
  { value: "homework assignments", label: "Homework Assignments" },
  { value: "news articles", label: "News Articles" },
  { value: "research papers", label: "Research Papers" }
]

export function UploadView({ courseData, onBack }: UploadViewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedType, setSelectedType] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus("idle")
      setUploadMessage("")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) {
      setUploadStatus("error")
      setUploadMessage("Please select both a file and document type")
      return
    }

    setIsUploading(true)
    setUploadStatus("idle")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("type", selectedType)
      formData.append("courseId", courseData.courseId)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setUploadStatus("success")
        setUploadMessage("File uploaded successfully!")
        setSelectedFile(null)
        setSelectedType("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadStatus("error")
      setUploadMessage(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadStatus("idle")
    setUploadMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-[#47624f]">Upload Materials</h2>
          <p className="text-gray-600">Add previous materials to enhance course content generation</p>
        </div>
      </div>

      {/* Upload Card */}
      <Card className="bg-black/5 backdrop-blur-xl border-2 border-[#47624f] shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#47624f]">
            <Upload className="w-5 h-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Select a file and document type to upload to your course materials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#47624f] mb-2">
                Select File
              </label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileButtonClick}
                  className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white"
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#47624f]" />
                    <span className="text-sm text-gray-700">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-[#47624f] mb-2">
                Document Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType} disabled={isUploading}>
                <SelectTrigger className="border-[#47624f] text-[#47624f]">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {UPLOAD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus !== "idle" && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              uploadStatus === "success" 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              {uploadStatus === "success" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                uploadStatus === "success" ? "text-green-700" : "text-red-700"
              }`}>
                {uploadMessage}
              </span>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedType || isUploading}
            className="w-full bg-[#47624f] hover:bg-[#707D7F] text-white"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-white/20 backdrop-blur-sm border border-[#47624f]/30">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-[#47624f] mb-3">Supported File Types</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
            <div>• PDF Documents (.pdf)</div>
            <div>• Word Documents (.doc, .docx)</div>
            <div>• PowerPoint (.ppt, .pptx)</div>
            <div>• Text Files (.txt, .rtf)</div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Uploaded materials will be used to enhance AI-generated course content and provide context for your course structure.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
