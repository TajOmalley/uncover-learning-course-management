"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { HeroPage } from "@/components/hero-page"
import { UserDashboard } from "@/components/user-dashboard"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47624f]"></div>
      </div>
    )
  }

  if (status === "authenticated") {
    return <UserDashboard />
  }

  return <HeroPage onStartCourse={() => {}} />
}
