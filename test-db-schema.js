#!/usr/bin/env node

/**
 * Database Schema Validation Script
 * Tests that the actual database schema matches our code expectations
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Expected schema based on code analysis
const EXPECTED_SCHEMA = {
  User: {
    required: ['id', 'email', 'password', 'createdAt', 'updatedAt'],
    optional: ['name', 'role'],
    oauth: ['canvasAccessToken', 'canvasRefreshToken', 'canvasTokenExpiresAt', 'moodleAccessToken', 'moodleRefreshToken', 'moodleTokenExpiresAt'],
    types: {
      id: 'string',
      email: 'string',
      password: 'string',
      name: 'string|null',
      role: 'string|null',
      createdAt: 'Date',
      updatedAt: 'Date',
      canvasAccessToken: 'string|null',
      canvasRefreshToken: 'string|null', 
      canvasTokenExpiresAt: 'Date|null',
      moodleAccessToken: 'string|null',
      moodleRefreshToken: 'string|null',
      moodleTokenExpiresAt: 'Date|null'
    }
  },
  Course: {
    required: ['id', 'title', 'subject', 'level', 'startDate', 'endDate', 'lectureSchedule', 'numberOfUnits', 'userId', 'createdAt', 'updatedAt'],
    lms: ['canvasCourseId', 'moodleCourseId'],
    types: {
      id: 'string',
      title: 'string',
      subject: 'string', 
      level: 'string',
      startDate: 'string',
      endDate: 'string',
      lectureSchedule: 'string',
      numberOfUnits: 'number',
      userId: 'string',
      createdAt: 'Date',
      updatedAt: 'Date',
      canvasCourseId: 'string|null',
      moodleCourseId: 'string|null'
    }
  },
  Unit: {
    required: ['id', 'title', 'week', 'type', 'color', 'courseId', 'createdAt', 'updatedAt'],
    optional: ['description'],
    types: {
      id: 'string',
      title: 'string',
      week: 'number',
      type: 'string',
      color: 'string',
      description: 'string|null',
      courseId: 'string',
      createdAt: 'Date',
      updatedAt: 'Date'
    }
  },
  GeneratedContent: {
    required: ['id', 'type', 'content', 'userId', 'courseId', 'createdAt', 'updatedAt'],
    optional: ['storageFilename', 'unitId'],
    types: {
      id: 'string',
      type: 'string',
      content: 'string',
      storageFilename: 'string|null',
      userId: 'string',
      courseId: 'string',
      unitId: 'string|null',
      createdAt: 'Date',
      updatedAt: 'Date'
    }
  }
}

async function testDatabaseSchema() {
  console.log('🔍 Starting Database Schema Validation...\n')
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  }

  try {
    // Test 1: Check table existence and basic structure
    console.log('📋 Test 1: Table Structure Validation')
    for (const [tableName, schema] of Object.entries(EXPECTED_SCHEMA)) {
      try {
        // Map table names to lowercase for the check
        const tableNameLower = tableName === 'GeneratedContent' ? 'generatedcontent' : tableName.toLowerCase()
        const tableExists = await testTableExists(tableNameLower)
        if (tableExists) {
          console.log(`✅ ${tableName} table exists`)
          results.passed++
        } else {
          console.log(`❌ ${tableName} table missing`)
          results.failed++
          results.errors.push(`${tableName} table does not exist`)
        }
      } catch (error) {
        console.log(`❌ ${tableName} error: ${error.message}`)
        results.failed++
        results.errors.push(`${tableName}: ${error.message}`)
      }
    }

    // Test 2: OAuth Token Fields (Critical for LMS integration)
    console.log('\n🔐 Test 2: OAuth Token Fields')
    try {
      const userWithTokens = await prisma.user.findFirst({
        select: {
          canvasAccessToken: true,
          canvasRefreshToken: true,
          canvasTokenExpiresAt: true,
          moodleAccessToken: true,
          moodleRefreshToken: true,
          moodleTokenExpiresAt: true
        }
      })
      console.log('✅ OAuth token fields accessible')
      results.passed++
    } catch (error) {
      console.log(`❌ OAuth fields error: ${error.message}`)
      results.failed++
      results.errors.push(`OAuth fields: ${error.message}`)
    }

    // Test 3: LMS Course ID Fields (Critical for export feature)
    console.log('\n🎓 Test 3: LMS Course ID Fields')
    try {
      const courseWithLMS = await prisma.course.findFirst({
        select: {
          canvasCourseId: true,
          moodleCourseId: true
        }
      })
      console.log('✅ LMS course ID fields accessible')
      results.passed++
    } catch (error) {
      console.log(`❌ LMS course fields error: ${error.message}`)
      results.failed++
      results.errors.push(`LMS course fields: ${error.message}`)
    }

    // Test 4: Relationships
    console.log('\n🔗 Test 4: Table Relationships')
    try {
      const courseWithRelations = await prisma.course.findFirst({
        include: {
          user: true,
          units: true,
          generatedContent: true
        }
      })
      console.log('✅ Course relationships work')
      results.passed++
    } catch (error) {
      console.log(`❌ Relationships error: ${error.message}`)
      results.failed++
      results.errors.push(`Relationships: ${error.message}`)
    }

    // Test 5: Data Integrity (Sample data validation)
    console.log('\n📊 Test 5: Data Integrity Check')
    try {
      const counts = await Promise.all([
        prisma.user.count(),
        prisma.course.count(), 
        prisma.unit.count(),
        prisma.generatedContent.count()
      ])
      
      console.log(`✅ Data counts: Users(${counts[0]}), Courses(${counts[1]}), Units(${counts[2]}), Content(${counts[3]})`)
      results.passed++

      // Check for orphaned records (courses without users)
      const orphanCheck = await prisma.course.findMany({
        where: {
          userId: {
            not: {
              in: (await prisma.user.findMany({ select: { id: true } })).map(u => u.id)
            }
          }
        }
      })
      
      if (orphanCheck.length === 0) {
        console.log('✅ No orphaned courses found')
        results.passed++
      } else {
        console.log(`⚠️  Found ${orphanCheck.length} orphaned courses`)
        results.errors.push(`${orphanCheck.length} orphaned courses`)
      }
      
    } catch (error) {
      console.log(`❌ Data integrity error: ${error.message}`)
      results.failed++
      results.errors.push(`Data integrity: ${error.message}`)
    }

    // Test 6: Critical Field Types
    console.log('\n🎯 Test 6: Critical Field Type Validation')
    try {
      // Test field types by querying and checking JavaScript types
      const sampleUser = await prisma.user.findFirst()
      const sampleCourse = await prisma.course.findFirst()
      
      if (sampleUser) {
        const typeChecks = [
          ['User.id', typeof sampleUser.id === 'string'],
          ['User.email', typeof sampleUser.email === 'string'],
          ['User.createdAt', sampleUser.createdAt instanceof Date]
        ]
        
        typeChecks.forEach(([field, isCorrect]) => {
          if (isCorrect) {
            console.log(`✅ ${field} type correct`)
            results.passed++
          } else {
            console.log(`❌ ${field} type incorrect`)
            results.failed++
            results.errors.push(`${field} has wrong type`)
          }
        })
      }
      
      if (sampleCourse) {
        const courseChecks = [
          ['Course.numberOfUnits', typeof sampleCourse.numberOfUnits === 'number'],
          ['Course.title', typeof sampleCourse.title === 'string']
        ]
        
        courseChecks.forEach(([field, isCorrect]) => {
          if (isCorrect) {
            console.log(`✅ ${field} type correct`)
            results.passed++
          } else {
            console.log(`❌ ${field} type incorrect`)
            results.failed++
            results.errors.push(`${field} has wrong type`)
          }
        })
      }
      
    } catch (error) {
      console.log(`❌ Type validation error: ${error.message}`)
      results.failed++
      results.errors.push(`Type validation: ${error.message}`)
    }

  } catch (error) {
    console.log(`💥 Critical error: ${error.message}`)
    results.failed++
    results.errors.push(`Critical: ${error.message}`)
  } finally {
    await prisma.$disconnect()
  }

  // Final Results
  console.log('\n' + '='.repeat(50))
  console.log('📊 SCHEMA VALIDATION RESULTS')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`)
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS TO FIX:')
    results.errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error}`)
    })
  }
  
  if (results.failed === 0) {
    console.log('\n🎉 DATABASE SCHEMA IS READY FOR LMS INTEGRATION!')
  } else {
    console.log('\n⚠️  Please fix the above errors before proceeding with LMS integration.')
    process.exit(1)
  }
}

async function testTableExists(tableName) {
  // Since we can see all tables in Prisma Studio, just test if we can query them
  try {
    if (tableName === 'user') {
      await prisma.user.findFirst()
      return true
    } else if (tableName === 'course') {
      await prisma.course.findFirst()
      return true
    } else if (tableName === 'unit') {
      await prisma.unit.findFirst()
      return true
    } else if (tableName === 'generatedcontent') {
      await prisma.generatedContent.findFirst()
      return true
    }
    return false
  } catch (error) {
    throw new Error(`Cannot access table ${tableName}: ${error.message}`)
  }
}

// Run the test
testDatabaseSchema().catch(console.error) 