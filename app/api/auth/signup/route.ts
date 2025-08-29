import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!['professor', 'student'].includes(role)) {
      return NextResponse.json(
        { error: "Role must be either 'professor' or 'student'" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .insert({
        email,
        password: hashedPassword,
        name: name || null,
        role: role
      })
      .select()
      .single()

    if (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 