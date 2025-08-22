import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Canvas OAuth configuration
    const canvasClientId = process.env.CANVAS_CLIENT_ID
    const canvasUrl = process.env.CANVAS_URL || 'https://canvas.instructure.com'
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/canvas/callback`

    if (!canvasClientId) {
      return NextResponse.json({ error: 'Canvas client ID not configured' }, { status: 500 })
    }

    // Required scopes for Canvas API
    const scopes = [
      'url:GET|/api/v1/courses',
      'url:POST|/api/v1/courses',
      'url:PUT|/api/v1/courses/:id',
      'url:POST|/api/v1/courses/:course_id/assignments',
      'url:PUT|/api/v1/courses/:course_id/assignments/:id',
      'url:POST|/api/v1/courses/:course_id/pages',
      'url:PUT|/api/v1/courses/:course_id/pages/:url',
      'url:POST|/api/v1/courses/:course_id/quizzes',
      'url:PUT|/api/v1/courses/:course_id/quizzes/:id'
    ].join(' ')

    // Store user ID in state parameter for security
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64')

    // Build Canvas authorization URL
    const authUrl = new URL(`${canvasUrl}/login/oauth2/auth`)
    authUrl.searchParams.set('client_id', canvasClientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)

    // Redirect to Canvas for authorization
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Canvas connect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 