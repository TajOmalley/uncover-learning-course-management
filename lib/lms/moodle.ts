import { LMSCourse, LMSModule, LMSResponse, CourseExportData, LMSCredentials } from './types'

/**
 * Moodle API Service Layer
 * Uses the OAuth tokens stored from the authentication flow
 * 
 * @see MOODLE_API_DOCS.md for available functions
 */

/**
 * Represents the current state of a Moodle course section
 */
interface SectionState {
  id: number
  section: number
  name: string
  visible: boolean
}

/**
 * Represents changes needed to synchronize sections
 */
interface SectionSync {
  sectionsToCreate: number[]
  sectionsToRename: Array<{ id: number, currentName: string, newName: string }>
  sectionsToShow: number[]
  noChangesNeeded: number[]
}

export class MoodleService {
  private credentials: LMSCredentials

  constructor(credentials: LMSCredentials) {
    this.credentials = credentials
  }

  /**
   * Make authenticated API call to Moodle Web Services (REST)
   * Always uses wstoken (can be provided via MOODLE_WS_TOKEN env or stored token)
   */
  private async callMoodleAPI(
    functionName: string, 
    params: Record<string, any> = {}
  ): Promise<any> {
    console.log(`[DEBUG] Moodle REST call start: ${functionName}`)
    try {
      const safeParams = Object.fromEntries(Object.entries(params || {}))
      // Avoid logging very large payloads; shallow log only
      console.log(`[DEBUG] Params for ${functionName}:`, safeParams)
    } catch (_e) {
      console.log(`[DEBUG] Unable to stringify params for ${functionName}`)
    }
    const url = `${this.credentials.baseUrl}/webservice/rest/server.php`

    const body = new URLSearchParams({
      wstoken: this.credentials.accessToken,
      wsfunction: functionName,
      moodlewsrestformat: 'json',
      ...params
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })

    if (!response.ok) {
      const responseText = await response.text()
      throw new Error(`[${functionName}] HTTP ${response.status} ${response.statusText} - ${responseText}`)
    }

    const data = await response.json()
    if (data?.errorcode) {
      throw new Error(`[${functionName}] ${data.errorcode} - ${data.message}`)
    }

    console.log(`[DEBUG] Moodle REST call success: ${functionName}`)
    return data
  }

  /**
   * Create a new course in Moodle
   * Uses core_course_create_courses function
   */
  async createCourse(courseData: CourseExportData): Promise<LMSResponse<LMSCourse>> {
    try {
      console.log('[DEBUG] createCourse: preparing payload')
      const moodleCourse = {
        shortname: courseData.name.toLowerCase().replace(/\s+/g, '_'),
        fullname: courseData.name,
        summary: courseData.description,
        summaryformat: 1, // HTML format
        categoryid: 1, // Default category - could be configurable
        startdate: courseData.startDate ? Math.floor(courseData.startDate.getTime() / 1000) : undefined,
        enddate: courseData.endDate ? Math.floor(courseData.endDate.getTime() / 1000) : undefined,
        visible: 1, // Course visible to students
      }

      console.log('[DEBUG] createCourse: calling core_course_create_courses')
      const result = await this.callMoodleAPI('core_course_create_courses', {
        'courses[0][shortname]': moodleCourse.shortname,
        'courses[0][fullname]': moodleCourse.fullname,
        'courses[0][summary]': moodleCourse.summary,
        'courses[0][summaryformat]': moodleCourse.summaryformat,
        'courses[0][categoryid]': moodleCourse.categoryid,
        'courses[0][visible]': moodleCourse.visible,
        ...(moodleCourse.startdate && { 'courses[0][startdate]': moodleCourse.startdate }),
        ...(moodleCourse.enddate && { 'courses[0][enddate]': moodleCourse.enddate }),
      })

      const createdCourse = result[0] // Moodle returns array
      
      return {
        success: true,
        data: {
          id: createdCourse.id.toString(),
          name: createdCourse.fullname,
          description: createdCourse.summary,
          startDate: courseData.startDate,
          endDate: courseData.endDate,
          visible: true
        }
      }
    } catch (error) {
      console.error('Moodle course creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? `createCourse: ${error.message}` : 'createCourse: Unknown error'
      }
    }
  }



  /**
   * Analyze current section state and calculate required changes
   */
  private calculateSectionChanges(currentSections: SectionState[], desiredUnits: CourseExportData['units']): SectionSync {
    const sync: SectionSync = {
      sectionsToCreate: [],
      sectionsToRename: [],
      sectionsToShow: [],
      noChangesNeeded: []
    }

    // Check which sections need to be created
    for (let i = 0; i < desiredUnits.length; i++) {
      const sectionNumber = i + 1
      const existingSection = currentSections.find(s => s.section === sectionNumber)
      
      if (!existingSection) {
        sync.sectionsToCreate.push(sectionNumber)
      } else {
        const unit = desiredUnits[i]
        
        // Check if rename is needed
        if (existingSection.name !== unit.name) {
          sync.sectionsToRename.push({
            id: existingSection.id,
            currentName: existingSection.name,
            newName: unit.name
          })
        }
        
        // Check if visibility change is needed
        if (!existingSection.visible) {
          sync.sectionsToShow.push(existingSection.id)
        }
        
        // Track sections that need no changes
        if (existingSection.name === unit.name && existingSection.visible) {
          sync.noChangesNeeded.push(existingSection.id)
        }
      }
    }

    return sync
  }

  /**
   * Apply calculated changes efficiently
   */
  private async applySectionChanges(
    courseId: string,
    sync: SectionSync,
    desiredSectionCount: number,
    currentSectionCount: number,
    desiredUnits: CourseExportData['units']
  ): Promise<void> {
    // Log what changes are needed
    console.log(`[DEBUG] Section sync plan:`)
    console.log(`  - Create: ${sync.sectionsToCreate.length} sections`)
    console.log(`  - Rename: ${sync.sectionsToRename.length} sections`)
    console.log(`  - Show: ${sync.sectionsToShow.length} sections`)
    console.log(`  - No changes: ${sync.noChangesNeeded.length} sections`)

    // 1. Ensure required number of sections exists using modern API
    console.log(`[DEBUG] Section count check: current=${currentSectionCount}, desired=${desiredSectionCount}`)
    if (desiredSectionCount > currentSectionCount) {
      const missingCount = desiredSectionCount - currentSectionCount
      console.log(`[DEBUG] Adding ${missingCount} sections using core_courseformat_update_course (section_add) to match UI behavior`)
      for (let i = 0; i < missingCount; i++) {
        try {
          await this.callMoodleAPI('core_courseformat_update_course', {
            action: 'section_add',
            courseid: Number(courseId)
            // UI sends empty ids array; REST encoding just omits it
          })
        } catch (e) {
          console.warn(`[WARN] section_add failed (attempt ${i + 1}/${missingCount}). Falling back to core_course_update_courses`, e)
          try {
            await this.callMoodleAPI('core_course_update_courses', {
              'courses[0][id]': Number(courseId),
              'courses[0][format]': 'topics',
              'courses[0][courseformatoptions][0][name]': 'numsections',
              'courses[0][courseformatoptions][0][value]': String(currentSectionCount + (i + 1))
            })
          } catch (e2) {
            console.warn('[WARN] Fallback core_course_update_courses also failed:', e2)
          }
        }
      }
      console.log('[DEBUG] Section add loop completed')
    }

    // 2. Ensure names match desired units (handle both existing and newly added sections)
    try {
      console.log('[DEBUG] Fetching sections for rename/visibility reconciliation')
      const afterAddContents = await this.callMoodleAPI('core_course_get_contents', { courseid: Number(courseId) })
      const afterSections: SectionState[] = Array.isArray(afterAddContents)
        ? afterAddContents.map((section: any) => ({
            id: section.id,
            section: section.section,
            name: section.name || `Topic ${section.section}`,
            visible: section.visible !== 0
          }))
        : []

      for (let i = 0; i < desiredUnits.length; i++) {
        const desiredName = desiredUnits[i].name
        const sectionNumber = i + 1
        const section = afterSections.find(s => s.section === sectionNumber)
        if (!section) {
          console.warn('[WARN] Missing section after add when attempting rename', { sectionNumber })
          continue
        }
        if (section.name !== desiredName) {
          try {
            console.log(`[DEBUG] Renaming section ${section.id}: "${section.name}" → "${desiredName}"`)
            await this.callMoodleAPI('core_update_inplace_editable', {
              component: 'format_topics',
              itemtype: 'sectionname',
              itemid: section.id,
              value: desiredName
            })
          } catch (e) {
            console.warn(`[WARN] Failed to rename section ${section.id}:`, e)
          }
        }
      }
    } catch (e) {
      console.warn('[WARN] Failed during rename reconciliation step:', e)
    }

    // 3. Ensure all sections are visible if desired
    try {
      const contentsForVisibility = await this.callMoodleAPI('core_course_get_contents', { courseid: Number(courseId) })
      const sectionsForVisibility: SectionState[] = Array.isArray(contentsForVisibility)
        ? contentsForVisibility.map((section: any) => ({
            id: section.id,
            section: section.section,
            name: section.name || `Topic ${section.section}`,
            visible: section.visible !== 0
          }))
        : []

      const toShow = sectionsForVisibility.filter(s => !s.visible).map(s => s.id)
      if (toShow.length > 0) {
        console.log('[DEBUG] Making sections visible:', toShow)
        for (let i = 0; i < toShow.length; i++) {
          try {
            await this.callMoodleAPI('core_courseformat_update_course', {
              action: 'section_show',
              courseid: Number(courseId),
              'ids[0]': toShow[i]
            })
          } catch (e) {
            console.warn(`[WARN] Failed to show section ${toShow[i]}:`, e)
          }
        }
      }
    } catch (e) {
      console.warn('[WARN] Failed during visibility reconciliation step:', e)
    }

    // 4. Log sections that needed no changes (for transparency)
    if (sync.noChangesNeeded.length > 0) {
      console.log(`[DEBUG] ${sync.noChangesNeeded.length} sections already up-to-date`)
    }
  }

  /**
   * Create course modules (topics/sections) for units using efficient differential updates
   */
  async createModulesForCourse(courseId: string, units: CourseExportData['units']): Promise<LMSResponse<LMSModule[]>> {
    try {
      // 1. Fetch current state once
      console.log('[DEBUG] Fetching current course sections')
      const contents = await this.callMoodleAPI('core_course_get_contents', { courseid: courseId })

      if (!Array.isArray(contents)) {
        throw new Error('Invalid response from core_course_get_contents: expected array')
      }

      // 2. Parse current section state
      const currentSections: SectionState[] = contents.map((section: any) => ({
        id: section.id,
        section: section.section,
        name: section.name || `Topic ${section.section}`,
        visible: section.visible !== 0
      }))

      console.log(`[DEBUG] Current state: ${currentSections.length} sections, target: ${units.length} units`)
      console.log('[DEBUG] Sections snapshot:', currentSections.map(s => ({ id: s.id, section: s.section, name: s.name, visible: s.visible })))

      // 3. Calculate what changes are needed
      const sync = this.calculateSectionChanges(currentSections, units)
      console.log('[DEBUG] Calculated section sync:', {
        toCreate: sync.sectionsToCreate,
        toRename: sync.sectionsToRename,
        toShow: sync.sectionsToShow,
        noChange: sync.noChangesNeeded
      })

      const desiredSectionCount = units.length
      const currentSectionCount = currentSections.length

      // 4. Apply only necessary changes (ensure count, then rename/show)
      await this.applySectionChanges(courseId, sync, desiredSectionCount, currentSectionCount, units)
      console.log('[DEBUG] applySectionChanges completed')

      // 5. Fetch updated state if we made any changes
      let finalContents = contents
      const countChanged = desiredSectionCount > currentSectionCount
      const hasChanges = countChanged || sync.sectionsToRename.length > 0 || sync.sectionsToShow.length > 0
      
      if (hasChanges) {
        console.log('[DEBUG] Refreshing section data after changes')
        finalContents = await this.callMoodleAPI('core_course_get_contents', { courseid: courseId })
        console.log('[DEBUG] Refetched sections length:', Array.isArray(finalContents) ? finalContents.length : 'n/a')
      }

      // 6. Build response with final state
      const modules: LMSModule[] = []
      for (let i = 0; i < units.length; i++) {
        const unit = units[i]
        const sectionNumber = i + 1
        const section = finalContents.find((s: any) => s?.section === sectionNumber) ?? finalContents[i]

        if (section?.id) {
          console.log(`[DEBUG] Mapping unit → section`, { unitIndex: i, unitName: unit.name, sectionId: section.id, sectionNumber })
          modules.push({
            id: String(section.id),
            name: unit.name,
            description: unit.description,
            position: unit.position
          })
        } else {
          console.log(`[DEBUG] No section found for unit`, { unitIndex: i, unitName: unit.name, sectionNumber })
        }
      }

      console.log(`[DEBUG] Successfully synchronized ${modules.length} sections`)
      return {
        success: true,
        data: modules
      }
    } catch (error) {
      console.error('Moodle section synchronization failed:', error)
      return {
        success: false,
        error: error instanceof Error ? `createModulesForCourse: ${error.message}` : 'createModulesForCourse: Unknown error'
      }
    }
  }

  /**
   * Test the connection by getting site info
   */
  async testConnection(): Promise<LMSResponse<any>> {
    try {
      console.log('[DEBUG] testConnection: calling core_webservice_get_site_info')
      const siteInfo = await this.callMoodleAPI('core_webservice_get_site_info')
      return {
        success: true,
        data: siteInfo
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? `testConnection: ${error.message}` : 'Connection test failed'
      }
    }
  }

  /**
   * Get user's courses to verify permissions
   */
  async getUserCourses(): Promise<LMSResponse<LMSCourse[]>> {
    try {
      const courses = await this.callMoodleAPI('core_course_get_courses')
      
      const lmsCourses: LMSCourse[] = courses.map((course: any) => ({
        id: course.id.toString(),
        name: course.fullname,
        description: course.summary,
        visible: course.visible === 1
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