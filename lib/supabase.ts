import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://djoqdrvdrsalaxiprifd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3FkcnZkcnNhbGF4aXByaWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzMyOTEsImV4cCI6MjA2OTgwOTI5MX0.U16msm5XAtc2ZdykcEEvXGzoW9EGZl3poithxWmCvh0'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqb3FkcnZkcnNhbGF4aXByaWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIzMzI5MSwiZXhwIjoyMDY5ODA5MjkxfQ.4SrTqzw4LlLvwng2x1fOTvsiSiNSxMfQ7k5Y7G5BWUA'

// Client for client-side operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types (we'll define these based on your existing schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          password: string
          createdAt: string
          updatedAt: string
          canvasAccessToken: string | null
          canvasRefreshToken: string | null
          canvasTokenExpiresAt: string | null
          moodleAccessToken: string | null
          moodleRefreshToken: string | null
          moodleTokenExpiresAt: string | null
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          password: string
          createdAt?: string
          updatedAt?: string
          canvasAccessToken?: string | null
          canvasRefreshToken?: string | null
          canvasTokenExpiresAt?: string | null
          moodleAccessToken?: string | null
          moodleRefreshToken?: string | null
          moodleTokenExpiresAt?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          password?: string
          createdAt?: string
          updatedAt?: string
          canvasAccessToken?: string | null
          canvasRefreshToken?: string | null
          canvasTokenExpiresAt?: string | null
          moodleAccessToken?: string | null
          moodleRefreshToken?: string | null
          moodleTokenExpiresAt?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          name: string
          subject: string
          level: string
          startDate: string
          endDate: string
          userId: string
          createdAt: string
          updatedAt: string
          canvasCourseId: string | null
          moodleCourseId: string | null
        }
        Insert: {
          id?: string
          name: string
          subject: string
          level: string
          startDate: string
          endDate: string
          userId: string
          createdAt?: string
          updatedAt?: string
          canvasCourseId?: string | null
          moodleCourseId?: string | null
        }
        Update: {
          id?: string
          name?: string
          subject?: string
          level?: string
          startDate?: string
          endDate?: string
          userId?: string
          createdAt?: string
          updatedAt?: string
          canvasCourseId?: string | null
          moodleCourseId?: string | null
        }
      }
      units: {
        Row: {
          id: string
          name: string
          title: string
          description: string | null
          week: number
          type: string
          courseId: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          name: string
          title: string
          description?: string | null
          week: number
          type: string
          courseId: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          name?: string
          title?: string
          description?: string | null
          week?: number
          type?: string
          courseId?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      generatedContent: {
        Row: {
          id: string
          type: string
          content: string
          storageFilename: string | null
          createdAt: string
          updatedAt: string
          userId: string
          courseId: string
          unitId: string | null
        }
        Insert: {
          id?: string
          type: string
          content: string
          storageFilename?: string | null
          createdAt?: string
          updatedAt?: string
          userId: string
          courseId: string
          unitId?: string | null
        }
        Update: {
          id?: string
          type?: string
          content?: string
          storageFilename?: string | null
          createdAt?: string
          updatedAt?: string
          userId?: string
          courseId?: string
          unitId?: string | null
        }
      }
      uploadedFiles: {
        Row: {
          id: string
          originalName: string
          storagePath: string
          fileType: string
          mimeType: string
          fileSize: number
          createdAt: string
          updatedAt: string
          userId: string
          courseId: string
        }
        Insert: {
          id?: string
          originalName: string
          storagePath: string
          fileType: string
          mimeType: string
          fileSize: number
          createdAt?: string
          updatedAt?: string
          userId: string
          courseId: string
        }
        Update: {
          id?: string
          originalName?: string
          storagePath?: string
          fileType?: string
          mimeType?: string
          fileSize?: number
          createdAt?: string
          updatedAt?: string
          userId?: string
          courseId?: string
        }
      }
    }
  }
}
