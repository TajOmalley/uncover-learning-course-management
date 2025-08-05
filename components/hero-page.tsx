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
          Build and Manage Intelligent College Courses
        </h1>
        <p className="text-xl text-[#707D7F] mb-12 max-w-2xl mx-auto leading-relaxed">
          Accessible For Students - Personalized, Textbook Free Content
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
      </div>
    </div>
  )
} 