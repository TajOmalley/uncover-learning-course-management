import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the current Moodle access token
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('User')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.moodleAccessToken) {
      return NextResponse.json(
        { error: 'No Moodle access token found' },
        { status: 400 }
      )
    }

    // Moodle doesn't use refresh tokens in the same way as other OAuth providers
    // Instead, we'll need to re-authenticate the user
    // For now, we'll return an error suggesting re-authentication
    return NextResponse.json({
      success: false,
      error: 'Moodle token expired. Please re-authenticate with Moodle.',
      requiresReauth: true
    })

  } catch (error) {
    console.error('Moodle refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the current Moodle token status
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('User')
      .select('moodleAccessToken, moodleTokenExpiresAt')
      .eq('id', session.user.id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const hasToken = !!user.moodleAccessToken
    const isExpired = user.moodleTokenExpiresAt ? new Date(user.moodleTokenExpiresAt) < new Date() : false

    return NextResponse.json({
      success: true,
      hasToken,
      isExpired,
      requiresReauth: !hasToken || isExpired
    })

  } catch (error) {
    console.error('Moodle token status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 