import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { decryptToken, encryptToken } from '@/lib/crypto'



export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get the current Canvas access token
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

    if (!user.canvasAccessToken) {
      return NextResponse.json(
        { error: 'No Canvas access token found' },
        { status: 400 }
      )
    }

    // Canvas doesn't use refresh tokens in the same way as other OAuth providers
    // Instead, we'll need to re-authenticate the user
    // For now, we'll return an error suggesting re-authentication
    return NextResponse.json({
      success: false,
      error: 'Canvas token expired. Please re-authenticate with Canvas.',
      requiresReauth: true
    })

  } catch (error) {
    console.error('Canvas refresh error:', error)
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

    // Get the current Canvas token status
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('User')
      .select('canvasAccessToken, canvasTokenExpiresAt')
      .eq('id', session.user.id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const hasToken = !!user.canvasAccessToken
    const isExpired = user.canvasTokenExpiresAt ? new Date(user.canvasTokenExpiresAt) < new Date() : false

    return NextResponse.json({
      success: true,
      hasToken,
      isExpired,
      requiresReauth: !hasToken || isExpired
    })

  } catch (error) {
    console.error('Canvas token status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 