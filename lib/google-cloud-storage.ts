import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  // For production, you might want to use service account credentials
  // credentials: {
  //   client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  //   private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  // }
})

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
      throw new Error('Failed to upload content to cloud storage')
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
}

export const googleCloudStorage = new GoogleCloudStorageService() 