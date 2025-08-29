import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { encryptToken } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle authorization errors
    if (error) {
      console.error('Canvas authorization error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=authorization_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=missing_parameters`)
    }

    // Verify state parameter
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=invalid_state`)
    }

    // Verify user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.id !== stateData.userId) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=unauthorized`)
    }

    // Canvas OAuth configuration
    const canvasClientId = process.env.CANVAS_CLIENT_ID
    const canvasClientSecret = process.env.CANVAS_CLIENT_SECRET
    const canvasUrl = process.env.CANVAS_URL || 'https://canvas.instructure.com'
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/canvas/callback`

    if (!canvasClientId || !canvasClientSecret) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=configuration_error`)
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`${canvasUrl}/login/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: canvasClientId,
        client_secret: canvasClientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Canvas token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()

    // Store the access token in the database (encrypted)
    await supabaseAdmin
      .from('users')
      .update({
        canvasAccessToken: tokenData.access_token ? encryptToken(tokenData.access_token) : null,
        canvasRefreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
        canvasTokenExpiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      })
      .eq('id', session.user.id)

    // Redirect back to integrations page with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?success=canvas_connected`)
  } catch (error) {
    console.error('Canvas callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=internal_error`)
  }
} 