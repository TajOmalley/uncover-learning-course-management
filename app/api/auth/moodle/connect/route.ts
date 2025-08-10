import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Moodle OAuth configuration
    const moodleClientId = process.env.MOODLE_CLIENT_ID
    const moodleUrl = process.env.MOODLE_URL || 'http://localhost:8888/moodle'
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/moodle/callback`

    if (!moodleClientId) {
      return NextResponse.json({ error: 'Moodle client ID not configured' }, { status: 500 })
    }

    // Required scopes for Moodle API
    const scopes = [
      'core_course_create_courses',
      'core_course_get_courses',
      'core_course_update_courses',
      'core_course_get_course_module',
      'core_course_create_course_module',
      'core_course_update_course_module',
      'mod_assign_save_assignment',
      'mod_assign_get_assignments',
      'mod_page_create_page',
      'mod_page_update_page',
      'mod_quiz_create_quiz',
      'mod_quiz_update_quiz'
    ].join(' ')

    // Store user ID in state parameter for security
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64')

    // Build Moodle authorization URL
    const authUrl = new URL(`${moodleUrl}/admin/oauth2/login.php`)
    authUrl.searchParams.set('client_id', moodleClientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)

    // Redirect to Moodle for authorization
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Moodle connect error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 