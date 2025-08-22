const { PrismaClient } = require('@prisma/client')
const { decryptToken } = require('./lib/crypto')

const prisma = new PrismaClient()

async function debugTokenType() {
  try {
    const userId = 'f4a15125-eda9-4cd4-885d-41662282aa8f' // From your logs
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        moodleAccessToken: true,
      }
    })

    if (!user?.moodleAccessToken) {
      console.log('❌ No token found')
      return
    }

    const token = decryptToken(user.moodleAccessToken)
    
    console.log('🔍 Token Analysis:')
    console.log(`Length: ${token.length}`)
    console.log(`First 10 chars: ${token.substring(0, 10)}`)
    console.log(`Last 10 chars: ${token.substring(token.length - 10)}`)
    
    // Check token format patterns
    console.log('\n🔍 Token Type Analysis:')
    
    if (token.length === 32 && /^[a-f0-9]{32}$/.test(token)) {
      console.log('✅ Looks like a Moodle web service token (32 hex chars)')
    } else if (token.length === 40 && /^[a-zA-Z0-9+/=]+$/.test(token)) {
      console.log('⚠️  Looks like an OAuth access token (base64-ish, 40 chars)')
      console.log('💡 This explains the "token not found" - OAuth tokens don\'t work with web service API')
    } else if (token.includes('.')) {
      console.log('⚠️  Looks like a JWT token')
    } else {
      console.log('❓ Unknown token format')
    }
    
    console.log('\n🧪 Test URLs to try manually:')
    console.log('Web Service API:')
    console.log(`http://localhost:8888/moodle500/webservice/rest/server.php?wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`)
    
    console.log('\nOAuth API (if available):')
    console.log(`http://localhost:8888/moodle500/webservice/oauth2/server.php?access_token=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugTokenType()






