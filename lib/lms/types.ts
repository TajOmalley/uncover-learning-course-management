// Types for LMS integration
export interface LMSCourse {
  id: string
  name: string
  description?: string
  startDate?: Date
  endDate?: Date
  visible?: boolean
}

export interface LMSModule {
  id: string
  name: string
  description?: string
  position?: number
}

export interface LMSResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface CourseExportData {
  name: string
  description: string
  startDate?: Date
  endDate?: Date
  units: Array<{
    id: string
    name: string
    description: string
    position: number
  }>
}

export type LMSType = 'canvas' | 'moodle'

export interface LMSCredentials {
  accessToken: string
  baseUrl: string
  type: LMSType
} 