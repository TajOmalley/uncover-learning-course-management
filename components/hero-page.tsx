"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface HeroPageProps {
  onStartCourse: () => void
}

export function HeroPage({ onStartCourse }: HeroPageProps) {
  const router = useRouter()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignIn = () => {
    router.push("/auth/signin")
  }

  const handleSignUp = () => {
    router.push("/auth/signup")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C9F2C7]/20 via-white to-[#B2A29E]/10">
      {/* Decorative parallax blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#C9F2C7] to-[#47624f] opacity-30 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#707D7F] to-[#000000] opacity-20 blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.1}px)` }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
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
        <h1 className="text-4xl md:text-6xl font-bold text-[#47624f] mb-6 leading-tight heading-display">
          Build and Manage Intelligent College Courses
        </h1>
        <p className="text-xl text-[#707D7F] mb-12 max-w-3xl mx-auto leading-relaxed">
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

      {/* Footer */}
      <footer className="mt-8 border-t border-white/30 bg-white/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            <div>
              <h3 className="text-[#000000] font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-[#707D7F]">
                <li><a href="#" className="hover:text-[#47624f] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#000000] font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-[#707D7F]">
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#000000] font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-[#707D7F]">
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#000000] font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-[#707D7F]">
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#47624f] transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-sm text-[#707D7F]">© {new Date().getFullYear()} Uncover Learning. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
} 