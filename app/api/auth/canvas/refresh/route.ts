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
    if (!user?.canvasRefreshToken) {
      return NextResponse.json({ error: 'No Canvas refresh token' }, { status: 400 })
    }

    const refreshTokenPlain = decryptToken(user.canvasRefreshToken)

    const canvasClientId = process.env.CANVAS_CLIENT_ID
    const canvasClientSecret = process.env.CANVAS_CLIENT_SECRET
    const canvasUrl = process.env.CANVAS_URL || 'https://canvas.instructure.com'

    if (!canvasClientId || !canvasClientSecret) {
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }

    const resp = await fetch(`${canvasUrl}/login/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: canvasClientId,
        client_secret: canvasClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshTokenPlain,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Canvas token refresh failed:', text)
      return NextResponse.json({ error: 'Refresh failed' }, { status: 400 })
    }

    const data = await resp.json()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        canvasAccessToken: data.access_token ? encryptToken(data.access_token) : user.canvasAccessToken,
        canvasRefreshToken: data.refresh_token ? encryptToken(data.refresh_token) : user.canvasRefreshToken,
        canvasTokenExpiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : user.canvasTokenExpiresAt,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Canvas refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 