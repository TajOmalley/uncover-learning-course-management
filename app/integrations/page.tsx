"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NavigationSidebar } from "@/components/navigation-sidebar"

export default function IntegrationsPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleCanvasConnect = () => {
    window.location.href = '/api/auth/canvas/connect'
  }

  const handleMoodleConnect = () => {
    window.location.href = '/api/auth/moodle/connect'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7]/40 via-white to-[#47624f]/20">
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage="Integrations"
      />
      <div className="lg:pl-80">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-[#47624f]">Integrations</h1>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white"
              >
                Back to Home
              </Button>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-2 border-[#47624f]/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold tracking-tight text-[#000000]">LMS Integrations</CardTitle>
                <CardDescription>
                  Connect Uncover Learning to your Learning Management System to seamlessly sync courses, assignments, and schedules.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between p-4 bg-[#C9F2C7]/20 rounded-lg border border-[#47624f]/20">
                  <div>
                    <h3 className="text-lg font-semibold text-[#000000]">Canvas</h3>
                    <p className="text-sm text-[#707D7F]">Connect to your Canvas account.</p>
                  </div>
                  <Button onClick={handleCanvasConnect} className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]">
                    Connect
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#C9F2C7]/20 rounded-lg border border-[#47624f]/20">
                  <div>
                    <h3 className="text-lg font-semibold text-[#000000]">Moodle</h3>
                    <p className="text-sm text-[#707D7F]">Connect to your Moodle account.</p>
                  </div>
                  <Button onClick={handleMoodleConnect} className="bg-gradient-to-r from-[#47624f] to-[#707D7F] hover:from-[#000000] hover:to-[#47624f]">
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 