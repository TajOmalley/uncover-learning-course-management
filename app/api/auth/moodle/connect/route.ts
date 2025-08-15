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

    // Required scopes for Moodle API - bidirectional sync capabilities
    const scopes = [
      // Core course management
      'core_course_create_courses',
      'core_course_update_courses',
      'core_course_get_courses',
      'core_course_get_contents',
      'core_course_get_course_module',
      'core_course_get_course_module_by_instance',
      
      // Assignment management (read + write)
      'mod_assign_get_assignments',
      'mod_assign_save_submission',
      'mod_assign_save_grade',
      'mod_assign_get_submissions',
      'mod_assign_view_assign',
      
      // Quiz management (read + write)
      'mod_quiz_get_quizzes_by_courses',
      'mod_quiz_get_quiz_access_information',
      'mod_quiz_save_attempt',
      'mod_quiz_update_grade_items',
      'mod_quiz_view_quiz',
      
      // Page/content management
      'mod_page_get_pages_by_courses',
      'mod_page_view_page',
      
      // Calendar management
      'core_calendar_get_calendar_events',
      'core_calendar_get_action_events_by_course',
      'core_calendar_create_calendar_events',
      'core_calendar_submit_create_update_form',
      
      // Course module management
      'core_courseformat_new_module',
      'core_courseformat_update_course',
      
      // User/enrollment context
      'core_enrol_get_enrolled_users',
      'core_user_get_course_user_profiles'
    ].join(',')

    // Store user ID in state parameter for security
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64')

    // Build Moodle authorization URL (plugin endpoint)
    const authUrl = new URL(`${moodleUrl}/local/oauth2/login.php`)
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