import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { encryptToken } from '@/lib/crypto'



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Decode the state parameter
    let stateData: { userId: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (error) {
      console.error('Error decoding state:', error)
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    // Verify the state belongs to the authenticated user
    if (stateData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(`${process.env.MOODLE_URL}/token.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.MOODLE_CLIENT_ID!,
        client_secret: process.env.MOODLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/moodle/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Moodle token exchange failed:', await tokenResponse.text())
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for token' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()

    // Store the access token in the database
    const { error: updateError } = await supabaseAdmin
      .from('User')
      .update({
        moodleAccessToken: tokenData.access_token,
        moodleTokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
      })
      .eq('id', session.user.id)

    if (updateError) {
      console.error('Error updating user with Moodle token:', updateError)
      return NextResponse.json(
        { error: 'Failed to save Moodle token' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?success=moodle`)

  } catch (error) {
    console.error('Moodle callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 