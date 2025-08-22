import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { encryptToken } from '@/lib/crypto'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle authorization errors
    if (error) {
      console.error('Moodle authorization error:', error)
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

    // Moodle OAuth configuration
    const moodleClientId = process.env.MOODLE_CLIENT_ID
    const moodleClientSecret = process.env.MOODLE_CLIENT_SECRET
    const moodleUrl = process.env.MOODLE_URL || 'http://localhost:8888/moodle'
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/moodle/callback`

    if (!moodleClientId || !moodleClientSecret) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=configuration_error`)
    }

    // Exchange authorization code for access token (plugin endpoint)
    const tokenResponse = await fetch(`${moodleUrl}/local/oauth2/token.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: moodleClientId,
        client_secret: moodleClientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Moodle token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    console.log('[DEBUG] OAuth token received:', { 
      hasAccessToken: !!tokenData.access_token,
      tokenLength: tokenData.access_token?.length,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope
    })

    // Store the OAuth access token directly (the API service will handle OAuth endpoints)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        moodleAccessToken: tokenData.access_token ? encryptToken(tokenData.access_token) : null,
        moodleRefreshToken: tokenData.refresh_token ? encryptToken(tokenData.refresh_token) : null,
        moodleTokenExpiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
      },
    })

    // Redirect back to integrations page with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?success=moodle_connected`)
  } catch (error) {
    console.error('Moodle callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=internal_error`)
  }
} 