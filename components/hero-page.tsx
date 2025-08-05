"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface HeroPageProps {
  onStartCourse: () => void
}

export function HeroPage({ onStartCourse }: HeroPageProps) {
  const router = useRouter()

  const handleSignIn = () => {
    router.push("/auth/signin")
  }

  const handleSignUp = () => {
    router.push("/auth/signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7]/20 via-white to-[#B2A29E]/10 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Logo Section */}
        <div className="mb-12">
          <Image
            src="/logo.png"
            alt="Uncover Learning Logo"
            width={600}
            height={150}
            className="mx-auto"
            priority
          />
        </div>

        {/* Tagline */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#47624f] mb-6 leading-tight">
          AI-Powered Course Management
        </h1>
        <p className="text-xl text-[#707D7F] mb-12 max-w-2xl mx-auto leading-relaxed">
          Create dynamic, textbook-free learning experiences with intelligent content generation
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={handleSignIn}
            size="lg"
            className="bg-[#47624f] hover:bg-[#000000] text-white px-8 py-3 text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Sign In
          </Button>
          <Button
            onClick={handleSignUp}
            variant="outline"
            size="lg"
            className="border-2 border-[#47624f] text-[#47624f] hover:bg-[#47624f] hover:text-white px-8 py-3 text-lg font-semibold transition-all duration-200"
          >
            Sign Up
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#C9F2C7]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-[#47624f] rounded-full"></div>
            </div>
            <h3 className="text-lg font-semibold text-[#47624f] mb-2">AI Content Generation</h3>
            <p className="text-[#707D7F] text-sm">Generate lesson plans, readings, and assessments instantly</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#C9F2C7]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-[#47624f] rounded-full"></div>
            </div>
            <h3 className="text-lg font-semibold text-[#47624f] mb-2">Interactive Calendar</h3>
            <p className="text-[#707D7F] text-sm">Visual timeline management for course planning</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[#C9F2C7]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-[#47624f] rounded-full"></div>
            </div>
            <h3 className="text-lg font-semibold text-[#47624f] mb-2">Modern Interface</h3>
            <p className="text-[#707D7F] text-sm">Clean, intuitive design for seamless course management</p>
          </div>
        </div>
      </div>
    </div>
  )
} 