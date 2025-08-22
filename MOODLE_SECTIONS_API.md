### Moodle Web Service APIs for Sections (reference)

- core_course_update_courses
  - Purpose: Update course settings, including format and courseformatoptions. Use to set format (e.g., topics) and numsections via courseformatoptions.
  - Key params per course object:
    - id: int (required)
    - format: string (optional) e.g., "topics" or "weeks"
    - courseformatoptions: array of { name: string; value: string }
      - Example: { name: "numsections", value: "7" }

- core_course_get_contents
  - Purpose: Retrieve sections (and optionally modules) for a course. Use to fetch section ids/numbers/names after updates.
  - Options list (each object { name, value }):
    - excludemodules: bool ("1" or "0")
    - excludecontents: bool
    - includestealthmodules: bool
    - sectionid: int
    - sectionnumber: int
    - cmid: int
    - modname: string
    - modid: int

- core_update_inplace_editable
  - Purpose: Rename a section inline. For topics format use component="format_topics", itemtype="sectionname".
  - Params:
    - component: string (e.g., "format_topics")
    - itemtype: string (e.g., "sectionname")
    - itemid: string (section id)
    - value: string (new name)

- core_courseformat_update_course
  - Purpose: Perform course-format actions like show/hide sections.
  - Params:
    - action: string (e.g., "section_show" | "section_hide")
    - courseid: int
    - ids[]: int[] (section ids)
    - targetsectionid: int (optional)
    - targetcmid: int (optional)

Notes
- Setting numsections via core_course_update_courses typically creates/makes available section slots; actual visibility can still be controlled per section.
- The component for renaming must match the course format (e.g., format_weeks if using weeks).

