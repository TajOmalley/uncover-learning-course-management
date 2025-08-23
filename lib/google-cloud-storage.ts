import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage
const getStorageConfig = () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  
  // For production (Vercel), use service account credentials
  if (process.env.NODE_ENV === 'production') {
    return {
      projectId,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }
    }
  }
  
  // For local development, use key file
  return {
    projectId,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  }
}

const storage = new Storage(getStorageConfig())

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'course-content-storage'

export interface ContentMetadata {
  courseId: string
  unitId: string
  type: string
  userId: string
  specifications?: any
}

export class GoogleCloudStorageService {
  private bucket = storage.bucket(bucketName)

  /**
   * Upload content to Google Cloud Storage
   */
  async uploadContent(
    content: string,
    metadata: ContentMetadata,
    filename?: string
  ): Promise<string> {
    try {
      // Validate required environment variables
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID is not configured')
      }
      
      if (!process.env.GOOGLE_CLOUD_BUCKET_NAME) {
        throw new Error('GOOGLE_CLOUD_BUCKET_NAME is not configured')
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const defaultFilename = `${metadata.userId}/${metadata.courseId}/${metadata.unitId}/${metadata.type}-${timestamp}.json`
      const finalFilename = filename || defaultFilename

      const file = this.bucket.file(finalFilename)
      
      const fileMetadata = {
        contentType: 'application/json',
        metadata: {
          courseId: metadata.courseId,
          unitId: metadata.unitId,
          type: metadata.type,
          userId: metadata.userId,
          specifications: metadata.specifications ? JSON.stringify(metadata.specifications) : '',
          uploadedAt: new Date().toISOString()
        }
      }

      await file.save(content, fileMetadata)
      
      return finalFilename
    } catch (error) {
      console.error('Error uploading to Google Cloud Storage:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to upload content to cloud storage: ${errorMessage}`)
    }
  }

  /**
   * Download content from Google Cloud Storage
   */
  async downloadContent(filename: string): Promise<string> {
    try {
      const file = this.bucket.file(filename)
      const [content] = await file.download()
      return content.toString('utf-8')
    } catch (error) {
      console.error('Error downloading from Google Cloud Storage:', error)
      throw new Error('Failed to download content from cloud storage')
    }
  }

  /**
   * Delete content from Google Cloud Storage
   */
  async deleteContent(filename: string): Promise<void> {
    try {
      const file = this.bucket.file(filename)
      await file.delete()
    } catch (error) {
      console.error('Error deleting from Google Cloud Storage:', error)
      throw new Error('Failed to delete content from cloud storage')
    }
  }

  /**
   * List all content for a specific course
   */
  async listCourseContent(courseId: string, userId: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${userId}/${courseId}/`
      })
      
      return files.map(file => file.name)
    } catch (error) {
      console.error('Error listing course content:', error)
      throw new Error('Failed to list course content')
    }
  }

  /**
   * Get content metadata
   */
  async getContentMetadata(filename: string): Promise<any> {
    try {
      const file = this.bucket.file(filename)
      const [metadata] = await file.getMetadata()
      return metadata.metadata
    } catch (error) {
      console.error('Error getting content metadata:', error)
      throw new Error('Failed to get content metadata')
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    options: {
      contentType: string
      metadata?: Record<string, string>
    }
  ): Promise<void> {
    try {
      // Validate required environment variables
      if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
        throw new Error('GOOGLE_CLOUD_PROJECT_ID is not configured')
      }
      
      if (!process.env.GOOGLE_CLOUD_BUCKET_NAME) {
        throw new Error('GOOGLE_CLOUD_BUCKET_NAME is not configured')
      }

      const file = this.bucket.file(filename)
      
      const fileMetadata = {
        contentType: options.contentType,
        metadata: options.metadata || {}
      }

      await file.save(buffer, fileMetadata)
    } catch (error) {
      console.error('Error uploading file to Google Cloud Storage:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to upload file to cloud storage: ${errorMessage}`)
    }
  }

  /**
   * Delete file from Google Cloud Storage
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const file = this.bucket.file(filename)
      await file.delete()
    } catch (error) {
      console.error('Error deleting file from Google Cloud Storage:', error)
      throw new Error('Failed to delete file from cloud storage')
    }
  }

  /**
   * List uploaded files for a course
   */
  async listUploadedFiles(courseId: string, userId: string): Promise<string[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `professor uploads/`
      })
      
      return files.map(file => file.name)
    } catch (error) {
      console.error('Error listing uploaded files:', error)
      throw new Error('Failed to list uploaded files')
    }
  }
}

export const googleCloudStorage = new GoogleCloudStorageService() 