import { LMSCourse, LMSModule, LMSResponse, CourseExportData, LMSCredentials } from './types'

/**
 * Canvas API Service Layer
 * Uses the OAuth tokens stored from the authentication flow
 */

export class CanvasService {
  private credentials: LMSCredentials

  constructor(credentials: LMSCredentials) {
    this.credentials = credentials
  }

  /**
   * Make authenticated API call to Canvas
   * Standard pattern for all Canvas API calls
   */
  private async callCanvasAPI(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.credentials.baseUrl}/api/v1${endpoint}`
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.credentials.accessToken}`,
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body)
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Canvas API call failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Create a new course in Canvas
   * Uses Canvas Courses API
   */
  async createCourse(courseData: CourseExportData): Promise<LMSResponse<LMSCourse>> {
    try {
      const canvasCourse = {
        course: {
          name: courseData.name,
          course_code: courseData.name.toLowerCase().replace(/\s+/g, '_'),
          start_at: courseData.startDate?.toISOString(),
          end_at: courseData.endDate?.toISOString(),
          is_public: false,
          is_public_to_auth_users: false,
          public_syllabus: false,
          public_syllabus_to_auth: false,
          public_description: courseData.description,
          allow_student_wiki_edits: false,
          allow_wiki_comments: false,
          allow_student_forum_attachments: false,
          open_enrollment: false,
          self_enrollment: false,
          restrict_enrollments_to_course_dates: false,
          term_id: null, // Could be configurable
          sis_course_id: null,
          integration_id: null,
          hide_final_grades: false,
          apply_assignment_group_weights: true,
          time_zone: 'America/New_York', // Could be configurable
          offer: true // Publish the course
        }
      }

      const result = await this.callCanvasAPI('/courses', 'POST', canvasCourse)
      
      return {
        success: true,
        data: {
          id: result.id.toString(),
          name: result.name,
          description: result.public_description,
          startDate: result.start_at ? new Date(result.start_at) : undefined,
          endDate: result.end_at ? new Date(result.end_at) : undefined,
          visible: result.workflow_state === 'available'
        }
      }
    } catch (error) {
      console.error('Canvas course creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create course modules for units
   * Canvas uses "Modules" to organize content
   */
  async createModulesForCourse(courseId: string, units: CourseExportData['units']): Promise<LMSResponse<LMSModule[]>> {
    try {
      const modules: LMSModule[] = []

      for (const unit of units) {
        const moduleData = {
          module: {
            name: unit.name,
            unlock_at: null,
            position: unit.position,
            require_sequential_progress: false,
            publish_final_grade: false,
            prerequisite_module_ids: [],
            published: true
          }
        }

        const result = await this.callCanvasAPI(`/courses/${courseId}/modules`, 'POST', moduleData)
        
        modules.push({
          id: result.id.toString(),
          name: result.name,
          description: unit.description,
          position: result.position
        })
      }

      return {
        success: true,
        data: modules
      }
    } catch (error) {
      console.error('Canvas module creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test the connection by getting user profile
   */
  async testConnection(): Promise<LMSResponse<any>> {
    try {
      const profile = await this.callCanvasAPI('/users/self/profile')
      return {
        success: true,
        data: profile
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  /**
   * Get user's courses to verify permissions
   */
  async getUserCourses(): Promise<LMSResponse<LMSCourse[]>> {
    try {
      const courses = await this.callCanvasAPI('/courses?enrollment_type=teacher&state[]=available')
      
      const lmsCourses: LMSCourse[] = courses.map((course: any) => ({
        id: course.id.toString(),
        name: course.name,
        description: course.public_description,
        startDate: course.start_at ? new Date(course.start_at) : undefined,
        endDate: course.end_at ? new Date(course.end_at) : undefined,
        visible: course.workflow_state === 'available'
      }))

      return {
        success: true,
        data: lmsCourses
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get courses'
      }
    }
  }
} 