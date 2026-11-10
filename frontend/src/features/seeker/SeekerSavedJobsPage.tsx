import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { seekerService } from '../../services/seeker.service'
import { jobsService } from '../../services/jobs.service'
import { formatSalaryRange } from '../../utils/currency'
import { Bookmark, MapPin, Trash2, ArrowRight, Search } from 'lucide-react'
import { TablePagination } from '../../components/common/TablePagination'

export const SeekerSavedJobsPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const fetchSaved = async () => {
    setIsLoading(true)
    try {
      const data = await seekerService.getSavedJobs()
      setSavedJobs(data)
    } catch (err) {
      console.error('Failed to load saved jobs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  const handleUnsave = async (jobId: number) => {
    try {
      await jobsService.toggleSaveJob(jobId, true)
      setSavedJobs((prev) => prev.filter((j) => j.id !== jobId))
    } catch (err) {
      console.error('Failed to unsave job:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-xs font-medium text-slate-500">
          {isKhmer ? 'កំពុងដំណើរការ...' : 'Loading saved jobs...'}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans pb-16">
      {/* SaaS Header Bar - Full Width & Compact Title */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isKhmer ? 'ការងាររក្សាទុក' : 'Saved Job Vacancies'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isKhmer
              ? 'ពិនិត្យមើល និងដាក់ពាក្យសុំការងារដែលអ្នកបានកត់ចំណាំទុក'
              : 'Review and apply to jobs you bookmarked for later'}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-gray-200 text-xs font-semibold text-blue-700 self-start sm:self-auto shadow-2xs">
          {savedJobs.length} {isKhmer ? 'ការងាររក្សាទុក' : savedJobs.length === 1 ? 'Vacancy' : 'Vacancies'}
        </div>
      </div>

      {savedJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-gray-200">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            {isKhmer ? 'មិនទាន់មានការងាររក្សាទុកទេ' : 'No Saved Jobs'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isKhmer
              ? 'អ្នកមិនទាន់បានកត់ចំណាំការងារណាមួយនៅឡើយទេ។ នៅពេលអ្នកឃើញការងារដែលអ្នកពេញចិត្ត សូមចុចរូប Bookmark ដើម្បីរក្សាទុកនៅទីនេះ។'
              : "You haven't bookmarked any jobs yet. When you find vacancies you like, click the bookmark icon to save them here."}
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center space-x-1.5 mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isKhmer ? 'ស្វែងរកការងារ' : 'Explore Jobs'}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedJobs
            .slice((currentPage - 1) * pageSize, currentPage * pageSize)
            .map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:border-blue-400 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-900 group"
            >
              <div className="flex items-start space-x-3.5">
                <img
                  src={
                    job.company_logo ||
                    'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=80&h=80&fit=crop'
                  }
                  alt={job.company_name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain border border-gray-200 bg-slate-50 p-1 shrink-0"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                    <Link to={`/jobs/${job.slug}`}>{job.title}</Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{job.company_name}</span>
                    <span>•</span>
                    <span className="flex items-center text-slate-500">
                      <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
                      {job.province}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-gray-200 text-[11px] sm:text-xs">
                      {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.is_salary_negotiable)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => handleUnsave(job.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition rounded-xl border border-gray-200 cursor-pointer shadow-2xs"
                  title={isKhmer ? 'ដកចេញពីការរក្សាទុក' : 'Remove from saved'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link
                  to={`/jobs/${job.slug}`}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-2xs flex items-center cursor-pointer active:scale-98"
                >
                  <span>{isKhmer ? 'ដាក់ពាក្យភ្លាមៗ' : 'Apply Now'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={savedJobs.length}
            pageSize={pageSize}
            pageSizeOptions={[25, 50, 100]}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setCurrentPage(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
