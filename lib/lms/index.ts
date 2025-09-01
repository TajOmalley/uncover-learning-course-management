import { supabaseAdmin } from '@/lib/supabase'
import { decryptToken } from '@/lib/crypto'
import { CanvasService } from './canvas'
import { MoodleService } from './moodle'
import { LMSCredentials, LMSType } from './types'

/**
 * Get LMS credentials for a user from the database
 * Retrieves and decrypts OAuth tokens from your existing auth system
 */
export async function getLMSCredentials(userId: string, lmsType: LMSType): Promise<LMSCredentials | null> {
  try {
    console.log(`[DEBUG] getLMSCredentials called for user: ${userId}, lmsType: ${lmsType}`)
    
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('canvasAccessToken, moodleAccessToken, moodleTokenExpiresAt, canvasTokenExpiresAt')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.log(`[DEBUG] User not found: ${userId}`)
      throw new Error('User not found')
    }

    console.log(`[DEBUG] User found. Canvas token exists: ${!!user.canvasAccessToken}, Moodle token exists: ${!!user.moodleAccessToken}`)

    let accessToken: string | null = null
    let baseUrl: string

    if (lmsType === 'canvas') {
      if (!user.canvasAccessToken) {
        console.log(`[DEBUG] No Canvas token found for user: ${userId}`)
        return null // User hasn't connected Canvas
      }
      accessToken = decryptToken(user.canvasAccessToken)
      baseUrl = process.env.CANVAS_URL || 'https://canvas.instructure.com'
      console.log(`[DEBUG] Canvas token decrypted. Length: ${accessToken?.length || 0}`)
    } else if (lmsType === 'moodle') {
      // Prefer an env-provided WS token for rapid testing
      const envWsToken = process.env.MOODLE_WS_TOKEN
      baseUrl = process.env.MOODLE_URL || 'http://localhost:8888/moodle'

      if (envWsToken) {
        accessToken = envWsToken
        console.log(`[DEBUG] Using MOODLE_WS_TOKEN from environment. Length: ${accessToken.length}`)
      } else {
        if (!user.moodleAccessToken) {
          console.log(`[DEBUG] No Moodle OAuth token found for user: ${userId}`)
          return null // User hasn't connected Moodle
        }
        console.log(`[DEBUG] Moodle token expires at: ${user.moodleTokenExpiresAt}`)
        accessToken = decryptToken(user.moodleAccessToken)
        console.log(`[DEBUG] Using stored Moodle token. Length: ${accessToken?.length || 0}`)
      }

      console.log(`[DEBUG] Moodle base URL: ${baseUrl}`)
    } else {
      throw new Error(`Unsupported LMS type: ${lmsType}`)
    }

    return {
      accessToken,
      baseUrl,
      type: lmsType
    }
  } catch (error) {
    console.error(`[DEBUG] Failed to get ${lmsType} credentials:`, error)
    return null
  }
}

/**
 * Create appropriate LMS service instance based on credentials
 */
export function createLMSService(credentials: LMSCredentials) {
  switch (credentials.type) {
    case 'canvas':
      return new CanvasService(credentials)
    case 'moodle':
      return new MoodleService(credentials)
    default:
      throw new Error(`Unsupported LMS type: ${credentials.type}`)
  }
}

/**
 * Check if user has connected to specific LMS
 */
export async function hasLMSConnection(userId: string, lmsType: LMSType): Promise<boolean> {
  const credentials = await getLMSCredentials(userId, lmsType)
  return credentials !== null
}

/**
 * Get all available LMS connections for a user
 */
export async function getUserLMSConnections(userId: string): Promise<LMSType[]> {
  const connections: LMSType[] = []
  
  if (await hasLMSConnection(userId, 'canvas')) {
    connections.push('canvas')
  }
  
  if (await hasLMSConnection(userId, 'moodle')) {
    connections.push('moodle')
  }
  
  return connections
} 