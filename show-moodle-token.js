const { PrismaClient } = require('@prisma/client')
const { decryptToken } = require('./lib/crypto')

const prisma = new PrismaClient()

async function showMoodleToken() {
  try {
    // Get your user (replace with your actual user ID from the logs)
    const userId = 'f4a15125-eda9-4cd4-885d-41662282aa8f'
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        moodleAccessToken: true,
        moodleTokenExpiresAt: true,
      }
    })

    if (!user || !user.moodleAccessToken) {
      console.log('❌ No Moodle token found')
      return
    }

    const token = decryptToken(user.moodleAccessToken)
    
    console.log('👤 User:', user.email)
    console.log('🔑 Moodle Token:', token)
    console.log('📅 Expires:', user.moodleTokenExpiresAt)
    
    console.log('\n🧪 Test URL:')
    console.log(`http://localhost:8888/moodle500/webservice/rest/server.php?wstoken=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

showMoodleToken()






