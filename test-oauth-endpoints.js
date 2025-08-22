// Test script to find OAuth-compatible Moodle API endpoints
const { PrismaClient } = require('@prisma/client')
const { decryptToken } = require('./decrypt-token')

// Use global fetch (available in Node 18+) or import from undici
const fetch = globalThis.fetch || require('undici').fetch

const prisma = new PrismaClient()

async function testOAuthEndpoints() {
  const baseUrl = 'http://localhost:8888/moodle500'
  
  // Get token from database
  let token = null
  try {
    console.log('🔍 Fetching Moodle token from database...')
    
    const user = await prisma.user.findFirst({
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

    if (!user || !user.moodleAccessToken) {
      console.log('❌ No user found with Moodle token')
      console.log('💡 Make sure you have connected a Moodle account via /integrations')
      return
    }

    token = decryptToken(user.moodleAccessToken)
    
    console.log(`✅ Found token for user: ${user.email}`)
    console.log(`🔑 Token length: ${token.length} characters`)
    console.log(`📅 Expires: ${user.moodleTokenExpiresAt}`)
    console.log(`🔑 Token preview: ${token.substring(0, 10)}...${token.substring(token.length - 10)}`)
    
    if (user.moodleTokenExpiresAt && new Date() > user.moodleTokenExpiresAt) {
      console.log('⚠️  WARNING: Token appears to be expired!')
    }
    
  } catch (error) {
    console.error('❌ Failed to get token from database:', error.message)
    return
  }
  
  console.log('\n🧪 Testing OAuth2 API endpoints...\n')
  
  const endpointsToTest = [
    // Standard OAuth2 endpoints from plugin
    '/local/oauth2/api.php',
    '/local/oauth2/webservice.php', 
    '/local/oauth2/rest.php',
    '/local/oauth2/user_info.php',
    '/local/oauth2/courses.php',
    
    // Web service endpoints with OAuth support
    '/webservice/oauth2/server.php',
    '/webservice/rest/oauth2.php',
    '/webservice/rest/server.php', // Standard endpoint but with access_token
    
    // Mobile app endpoints (often support OAuth)
    '/webservice/rest/server.php',
    '/local/mobile/launch.php',
    
    // Try some basic OAuth info endpoints
    '/local/oauth2/me.php',
    '/local/oauth2/profile.php'
  ]
  
  for (const endpoint of endpointsToTest) {
    console.log(`\n📍 Testing: ${endpoint}`)
    
    // Test different authentication methods
    const authMethods = [
      {
        name: 'Bearer Header + Query Param',
        options: {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          url: `${baseUrl}${endpoint}?access_token=${token}&format=json`
        }
      },
      {
        name: 'Bearer Header Only',
        options: {
          method: 'GET', 
          headers: { 'Authorization': `Bearer ${token}` },
          url: `${baseUrl}${endpoint}?format=json`
        }
      },
      {
        name: 'Query Param Only',
        options: {
          method: 'GET',
          headers: {},
          url: `${baseUrl}${endpoint}?access_token=${token}&format=json`
        }
      }
    ]
    
    for (const authMethod of authMethods) {
      try {
        console.log(`  🔐 ${authMethod.name}`)
        
        const response = await fetch(authMethod.options.url, {
          method: authMethod.options.method,
          headers: authMethod.options.headers
        })
        
        console.log(`    Status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.text()
          console.log(`    ✅ SUCCESS! Response: ${data.substring(0, 150)}...`)
          
          // If this endpoint works, try the site info API call
          if (endpoint.includes('webservice') || endpoint.includes('api')) {
            console.log(`    🧪 Testing site info API call...`)
            try {
              const apiResponse = await fetch(`${baseUrl}${endpoint}?access_token=${token}&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json`, {
                method: 'POST',
                headers: authMethod.options.headers
              })
              
              if (apiResponse.ok) {
                const apiData = await apiResponse.json()
                console.log(`    ✅ API SUCCESS! Site: ${apiData.sitename || 'Unknown'}`)
              } else {
                const apiError = await apiResponse.text()
                console.log(`    ❌ API Error: ${apiError.substring(0, 100)}...`)
              }
            } catch (apiError) {
              console.log(`    ❌ API Error: ${apiError.message}`)
            }
          }
          
        } else {
          const error = await response.text()
          console.log(`    ❌ Error: ${error.substring(0, 100)}...`)
        }
        
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`)
      }
    }
  }
  
  // Clean up database connection
  await prisma.$disconnect()
}

// Run the test
testOAuthEndpoints().catch(console.error)
