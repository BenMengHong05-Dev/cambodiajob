import * as XLSX from 'xlsx'

export interface ExcelColumnOption {
  wch?: number
}

/**
 * Universal Excel export utility using SheetJS (.xlsx).
 * Generates genuine Microsoft Excel workbooks with auto-sized columns.
 */
export const downloadExcelFile = (
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new()

  // Prepare full data matrix (header row + data rows)
  const fullData = [headers, ...rows]

  // Create worksheet from array of arrays
  const ws = XLSX.utils.aoa_to_sheet(fullData)

  // Calculate auto column widths so text is never truncated
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length
    for (let i = 0; i < rows.length; i++) {
      const cellVal = rows[i]?.[colIdx]
      const strVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : ''
      if (strVal.length > maxLen) {
        maxLen = strVal.length
      }
    }
    // Min width 12, max width 50
    return { wch: Math.min(Math.max(maxLen + 3, 12), 50) }
  })

  ws['!cols'] = colWidths

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31) || 'Sheet1')

  // Trigger browser download with .xlsx extension
  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, cleanFilename, { bookType: 'xlsx', type: 'binary' })
}

/**
 * Export Candidate Applications to formatted Microsoft Excel (.xlsx)
 */
export const exportApplicantsToExcel = (
  applications: any[],
  jobTitle?: string,
  isKhmer = false
) => {
  if (!applications || applications.length === 0) return

  const headers = isKhmer
    ? [
        'លេខកូដពាក្យសុំ',
        'ឈ្មោះបេក្ខជន',
        'អ៊ីមែល',
        'លេខទូរស័ព្ទ',
        'រាជធានី / ខេត្ត',
        'ប្រាក់ខែរំពឹងទុក',
        'ស្ថានភាពពាក្យសុំ',
        'កាលបរិច្ឆេទដាក់ពាក្យ',
        'ចំណងជើង CV',
        'ទម្រង់សម្ភាសន៍',
        'កាលបរិច្ឆេទសម្ភាសន៍',
        'តំណភ្ជាប់ / ទីតាំង',
        'កំណត់សម្គាល់ពីនិយោជក',
      ]
    : [
        'Application ID',
        'Candidate Name',
        'Email',
        'Phone Number',
        'Province / Location',
        'Expected Salary',
        'Application Status',
        'Applied Date',
        'CV Title',
        'Interview Format',
        'Interview Scheduled At',
        'Meeting Link / Location',
        'Recruiter Notes',
      ]

  const rows = applications.map((app) => {
    const interview = app.interview
    const interviewTypeLabel = interview
      ? interview.interview_type === 'online'
        ? isKhmer ? 'វីដេអូអនឡាញ' : 'Online Video'
        : interview.interview_type === 'in_person'
        ? isKhmer ? 'នៅការិយាល័យ' : 'In-Person Office'
        : isKhmer ? 'ទូរស័ព្ទ' : 'Phone'
      : isKhmer ? 'មិនមាន' : 'None'

    const interviewTime = interview?.scheduled_at
      ? new Date(interview.scheduled_at).toLocaleString()
      : isKhmer ? 'មិនទាន់កំណត់' : 'Not Scheduled'

    return [
      app.id,
      app.applicant_name || 'N/A',
      app.applicant_email || 'N/A',
      app.applicant_phone || 'N/A',
      app.applicant_province || 'N/A',
      app.expected_salary ? `$${Number(app.expected_salary).toLocaleString()}` : 'Negotiable',
      app.status?.toUpperCase() || 'SUBMITTED',
      app.created_at ? new Date(app.created_at).toISOString().split('T')[0] : 'N/A',
      app.resume_title || 'Direct Profile Application',
      interviewTypeLabel,
      interviewTime,
      interview?.location_or_link || '',
      interview?.notes || app.cover_letter || '',
    ]
  })

  const dateStr = new Date().toISOString().split('T')[0]
  const titleClean = (jobTitle || 'recruitment_pipeline').toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const filename = `candidates_${titleClean}_${dateStr}.xlsx`

  downloadExcelFile(filename, isKhmer ? 'បញ្ជីបេក្ខជន' : 'Candidates', headers, rows)
}

/**
 * Export Job Vacancies to formatted Microsoft Excel (.xlsx)
 */
export const exportJobsToExcel = (jobs: any[], isKhmer = false) => {
  if (!jobs || jobs.length === 0) return

  const headers = isKhmer
    ? [
        'លេខកូដការងារ',
        'ចំណងជើងមុខតំណែង',
        'ក្រុមហ៊ុន',
        'រាជធានី / ខេត្ត',
        'កម្រិតប្រាក់ខែ',
        'ប្រភេទការងារ',
        'ស្ថានភាព',
        'ចំនួនបេក្ខជនដាក់ពាក្យ',
        'កាលបរិច្ឆេទចុះផ្សាយ',
      ]
    : [
        'Job ID',
        'Job Title',
        'Company Name',
        'Province / Location',
        'Salary Range',
        'Employment Type',
        'Status',
        'Total Applicants',
        'Published Date',
      ]

  const rows = jobs.map((j) => [
    j.id,
    j.title || 'N/A',
    j.company_name || 'N/A',
    j.province || 'N/A',
    j.salary_min
      ? `$${Number(j.salary_min).toLocaleString()} - $${Number(j.salary_max || j.salary_min).toLocaleString()}`
      : 'Negotiable',
    j.employment_type || 'Full Time',
    j.status?.toUpperCase() || 'ACTIVE',
    j.applications_count || j.applicants_count || 0,
    j.created_at ? new Date(j.created_at).toISOString().split('T')[0] : 'N/A',
  ])

  const dateStr = new Date().toISOString().split('T')[0]
  downloadExcelFile(`jobs_export_${dateStr}.xlsx`, isKhmer ? 'បញ្ជីការងារ' : 'Jobs', headers, rows)
}

/**
 * Export Users to formatted Microsoft Excel (.xlsx)
 */
export const exportUsersToExcel = (users: any[], isKhmer = false) => {
  if (!users || users.length === 0) return

  const headers = isKhmer
    ? [
        'លេខសម្គាល់',
        'ឈ្មោះពេញ',
        'អ៊ីមែល',
        'លេខទូរស័ព្ទ',
        'តួនាទី (Role)',
        'ស្ថានភាពគណនី',
        'កាលបរិច្ឆេទបង្កើត',
      ]
    : [
        'User ID',
        'Full Name',
        'Email',
        'Phone',
        'Role',
        'Status',
        'Joined Date',
      ]

  const rows = users.map((u) => [
    u.id,
    u.full_name || 'N/A',
    u.email || 'N/A',
    u.phone_number || 'N/A',
    (u.role || 'job_seeker').toUpperCase(),
    u.is_active ? (isKhmer ? 'សកម្ម' : 'Active') : (isKhmer ? 'ផ្អាក' : 'Inactive'),
    u.date_joined || u.created_at ? new Date(u.date_joined || u.created_at).toISOString().split('T')[0] : 'N/A',
  ])

  const dateStr = new Date().toISOString().split('T')[0]
  downloadExcelFile(`users_export_${dateStr}.xlsx`, isKhmer ? 'អ្នកប្រើប្រាស់' : 'Users', headers, rows)
}

/**
 * Export Companies to formatted Microsoft Excel (.xlsx)
 */
export const exportCompaniesToExcel = (companies: any[], isKhmer = false) => {
  if (!companies || companies.length === 0) return

  const headers = isKhmer
    ? [
        'លេខកូដក្រុមហ៊ុន',
        'ឈ្មោះក្រុមហ៊ុន',
        'វិស័យ / ឧស្សាហកម្ម',
        'រាជធានី / ខេត្ត',
        'គេហទំព័រ (Website)',
        'ទូរស័ព្ទទំនាក់ទំនង',
        'ស្ថានភាពផ្ទៀងផ្ទាត់',
        'កាលបរិច្ឆេទចុះឈ្មោះ',
      ]
    : [
        'Company ID',
        'Company Name',
        'Industry',
        'Province / Location',
        'Website',
        'Phone',
        'Verification Status',
        'Registered Date',
      ]

  const rows = companies.map((c) => [
    c.id,
    c.name || 'N/A',
    c.industry || 'General',
    c.province || 'N/A',
    c.website || 'N/A',
    c.phone || 'N/A',
    c.is_verified ? (isKhmer ? 'បានផ្ទៀងផ្ទាត់' : 'Verified') : (isKhmer ? 'រង់ចាំពិនិត្យ' : 'Pending Review'),
    c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : 'N/A',
  ])

  const dateStr = new Date().toISOString().split('T')[0]
  downloadExcelFile(`companies_export_${dateStr}.xlsx`, isKhmer ? 'បញ្ជីក្រុមហ៊ុន' : 'Companies', headers, rows)
}
