"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NavigationSidebar } from "@/components/navigation-sidebar"

export default function IntegrationsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const handleCanvasConnect = () => {
    window.location.href = '/api/auth/canvas/connect'
  }

  const handleMoodleConnect = () => {
    window.location.href = '/api/auth/moodle/connect'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="Integrations"
      />
      <div className="lg:pl-80">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight">LMS Integrations</CardTitle>
                <CardDescription>
                  Connect Uncover Learning to your Learning Management System to seamlessly sync courses, assignments, and schedules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold">Canvas</h3>
                    <p className="text-sm text-gray-500">Connect to your Canvas account.</p>
                  </div>
                  <Button onClick={handleCanvasConnect}>Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold">Moodle</h3>
                    <p className="text-sm text-gray-500">Connect to your Moodle account.</p>
                  </div>
                  <Button onClick={handleMoodleConnect}>Connect</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 