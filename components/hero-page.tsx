"use client"

import Image from "next/image"

interface HeroPageProps {
  onStartCourse: () => void
}

export function HeroPage({ onStartCourse }: HeroPageProps) {

  const handleBuildCourse = () => {
    onStartCourse()
  }

  const menuItems = [
    { label: "build a course", action: handleBuildCourse },
    { label: "sign-in", action: () => console.log("Sign in clicked") },
    { label: "sign-up", action: () => console.log("Sign up clicked") },
    { label: "schedule a demo", action: () => console.log("Schedule demo clicked") },
    { label: "contact", action: () => console.log("Contact clicked") },
  ]



  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-screen">
          {/* Left Content Section */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-8xl font-bold text-black leading-tight font-montserrat" style={{ fontFamily: 'var(--font-montserrat)' }}>
                welcome to
              </h1>
              <div className="flex justify-center">
                <Image
                  src="/logo.png"
                  alt="Uncover Learning Logo"
                  width={700}
                  height={200}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right Menu Section */}
          <div className="flex-1 flex justify-end">
            <nav className="flex flex-col space-y-8">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="text-right font-montserrat text-3xl text-[#47624f] hover:text-[#000000] hover:font-bold transition-all duration-200 group"
                  style={{ fontFamily: 'var(--font-montserrat)' }}
                >
                  <span className="relative">
                    {item.label}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#000000] group-hover:w-full transition-all duration-200"></span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
} 