import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import { decryptToken, encryptToken } from '@/lib/crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.moodleRefreshToken) {
      return NextResponse.json({ error: 'No Moodle refresh token' }, { status: 400 })
    }

    const refreshTokenPlain = decryptToken(user.moodleRefreshToken)

    const moodleClientId = process.env.MOODLE_CLIENT_ID
    const moodleClientSecret = process.env.MOODLE_CLIENT_SECRET
    const moodleUrl = process.env.MOODLE_URL || 'http://localhost:8888/moodle'

    if (!moodleClientId || !moodleClientSecret) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const resp = await fetch(`${moodleUrl}/local/oauth2/refresh_token.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: moodleClientId,
        client_secret: moodleClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshTokenPlain,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Moodle token refresh failed:', text)
      return NextResponse.json({ error: 'Refresh failed' }, { status: 400 })
    }

    const data = await resp.json()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        moodleAccessToken: data.access_token ? encryptToken(data.access_token) : user.moodleAccessToken,
        moodleRefreshToken: data.refresh_token ? encryptToken(data.refresh_token) : user.moodleRefreshToken,
        moodleTokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : user.moodleTokenExpiresAt,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Moodle refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 