const { PrismaClient } = require('@prisma/client')
const { decryptToken } = require('./lib/crypto')

const prisma = new PrismaClient()

async function debugMoodleToken() {
  try {
    console.log('🔍 Checking Moodle tokens in database...')
    
    // Get all users with Moodle tokens
    const users = await prisma.user.findMany({
      where: {
        moodleAccessToken: {
          not: null
        }
      },
      select: {
        id: true,
        email: true,
        moodleAccessToken: true,
        moodleTokenExpiresAt: true,
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found with Moodle tokens')
      console.log('💡 You need to connect a Moodle account via /integrations')
      return
    }

    console.log(`✅ Found ${users.length} user(s) with Moodle tokens:`)
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.email} (ID: ${user.id})`)
      console.log(`📅 Token expires: ${user.moodleTokenExpiresAt}`)
      
      if (user.moodleTokenExpiresAt && new Date() > user.moodleTokenExpiresAt) {
        console.log('⚠️  Token has EXPIRED - needs refresh')
      } else {
        console.log('✅ Token is still valid')
      }
      
      try {
        const decryptedToken = decryptToken(user.moodleAccessToken)
        console.log(`🔑 Token length: ${decryptedToken.length} characters`)
        console.log(`🔑 Token preview: ${decryptedToken.substring(0, 10)}...`)
        
        // Test if token format looks correct
        if (decryptedToken.length < 10) {
          console.log('⚠️  Token seems too short')
        } else {
          console.log('✅ Token length seems reasonable')
        }
      } catch (error) {
        console.log('❌ Failed to decrypt token:', error.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugMoodleToken()






