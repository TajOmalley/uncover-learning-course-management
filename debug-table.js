const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testGeneratedContent() {
  try {
    console.log('Testing GeneratedContent table access...')
    
    const result = await prisma.generatedContent.findFirst()
    console.log('✅ GeneratedContent table accessible:', !!result)
    
    const count = await prisma.generatedContent.count()
    console.log('✅ GeneratedContent count:', count)
    
  } catch (error) {
    console.log('❌ GeneratedContent error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testGeneratedContent() 