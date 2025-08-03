"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#47624f] to-[#B2A29E]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#47624f] to-[#B2A29E]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#47624f]">Dashboard</h1>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-[#47624f] text-white px-4 py-2 rounded-md hover:bg-[#3a4f3f]"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-[#47624f] mb-4">Welcome!</h2>
              <p className="text-gray-700">
                <strong>Email:</strong> {session.user?.email}
              </p>
              {session.user?.name && (
                <p className="text-gray-700">
                  <strong>Name:</strong> {session.user.name}
                </p>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-[#47624f] mb-4">Your Courses</h2>
              <p className="text-gray-600">No courses yet. Start by creating your first course!</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 bg-[#47624f] text-white px-4 py-2 rounded-md hover:bg-[#3a4f3f]"
              >
                Create Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 