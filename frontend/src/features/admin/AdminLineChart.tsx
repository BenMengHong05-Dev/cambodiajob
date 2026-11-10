import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, Calendar, ArrowUpRight } from 'lucide-react'

type TimeRange = '7d' | '30d' | '12m'

export interface ChartDataPoint {
  label: string
  labelKm: string
  applications: number
  jobs: number
}

interface AdminLineChartProps {
  analytics?: {
    '7d'?: ChartDataPoint[]
    '30d'?: ChartDataPoint[]
    '12m'?: ChartDataPoint[]
  }
}

const DATA_PRESETS: Record<TimeRange, ChartDataPoint[]> = {
  '7d': [
    { label: 'Mon', labelKm: 'ច័ន្ទ', applications: 45, jobs: 14 },
    { label: 'Tue', labelKm: 'អង្គារ', applications: 68, jobs: 22 },
    { label: 'Wed', labelKm: 'ពុធ', applications: 92, jobs: 31 },
    { label: 'Thu', labelKm: 'ព្រហ', applications: 115, jobs: 38 },
    { label: 'Fri', labelKm: 'សុក្រ', applications: 140, jobs: 46 },
    { label: 'Sat', labelKm: 'សៅរ៍', applications: 85, jobs: 25 },
    { label: 'Sun', labelKm: 'អាទិត្យ', applications: 62, jobs: 18 },
  ],
  '30d': [
    { label: 'Week 1', labelKm: 'សប្តាហ៍ ១', applications: 240, jobs: 75 },
    { label: 'Week 2', labelKm: 'សប្តាហ៍ ២', applications: 385, jobs: 118 },
    { label: 'Week 3', labelKm: 'សប្តាហ៍ ៣', applications: 520, jobs: 165 },
    { label: 'Week 4', labelKm: 'សប្តាហ៍ ៤', applications: 690, jobs: 215 },
  ],
  '12m': [
    { label: 'Jan', labelKm: 'មករា', applications: 120, jobs: 35 },
    { label: 'Feb', labelKm: 'កុម្ភៈ', applications: 180, jobs: 52 },
    { label: 'Mar', labelKm: 'មីនា', applications: 290, jobs: 84 },
    { label: 'Apr', labelKm: 'មេសា', applications: 410, jobs: 125 },
    { label: 'May', labelKm: 'ឧសភា', applications: 580, jobs: 170 },
    { label: 'Jun', labelKm: 'មិថុនា', applications: 740, jobs: 220 },
    { label: 'Jul', labelKm: 'កក្កដា', applications: 920, jobs: 285 },
    { label: 'Aug', labelKm: 'សីហា', applications: 1150, jobs: 350 },
    { label: 'Sep', labelKm: 'កញ្ញា', applications: 1390, jobs: 410 },
    { label: 'Oct', labelKm: 'តុលា', applications: 1680, jobs: 495 },
    { label: 'Nov', labelKm: 'វិច្ឆិកា', applications: 1950, jobs: 560 },
    { label: 'Dec', labelKm: 'ធ្នូ', applications: 2240, jobs: 640 },
  ],
}

// Generate smooth SVG cubic Bézier path from points
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return path
}

export const AdminLineChart: React.FC<AdminLineChartProps> = ({ analytics }) => {
  const { i18n } = useTranslation()
  const isKhmer = i18n.language === 'km'

  const [range, setRange] = useState<TimeRange>('12m')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const data =
    analytics && analytics[range] && analytics[range]!.length > 0
      ? analytics[range]!
      : DATA_PRESETS[range]

  // ViewBox bounds - Compact & Modern
  const width = 800
  const height = 230
  const padLeft = 40
  const padRight = 20
  const padTop = 20
  const padBottom = 32

  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom

  // Find max value to scale coordinates
  const maxVal = Math.max(...data.map((d) => Math.max(d.applications, d.jobs))) * 1.15 || 100

  // Points mapping
  const appPoints = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * plotWidth
    const y = padTop + plotHeight - (d.applications / maxVal) * plotHeight
    return { x, y, ...d }
  })

  const jobPoints = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * plotWidth
    const y = padTop + plotHeight - (d.jobs / maxVal) * plotHeight
    return { x, y, ...d }
  })

  const appPath = generateSmoothPath(appPoints)
  const jobPath = generateSmoothPath(jobPoints)

  // Area under path
  const appAreaPath = `${appPath} L ${appPoints[appPoints.length - 1].x} ${padTop + plotHeight} L ${appPoints[0].x} ${padTop + plotHeight} Z`
  const jobAreaPath = `${jobPath} L ${jobPoints[jobPoints.length - 1].x} ${padTop + plotHeight} L ${jobPoints[0].x} ${padTop + plotHeight} Z`

  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: Math.round(maxVal * pct),
    y: padTop + plotHeight - pct * plotHeight,
  }))

  const totalApps = data.reduce((sum, d) => sum + d.applications, 0)
  const totalJobs = data.reduce((sum, d) => sum + d.jobs, 0)

  return (
    <div className="glass-card rounded-2xl border border-white/90 p-4 sm:p-5 shadow-sm space-y-3.5 relative overflow-hidden">
      {/* Decorative gradient blur inside chart header */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header with Title, Stats & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
              {isKhmer ? 'ស្ថិតិកំណើនវេទិកា & និន្នាការដាក់ពាក្យ' : 'Platform Activity & Application Growth'}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 border border-blue-400/25 backdrop-blur-md">
              <TrendingUp className="w-3 h-3 text-blue-600" />
              <span>+34.8% YoY</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isKhmer
              ? 'ទិន្នន័យប្រៀបធៀបរវាងពាក្យសុំការងារពីបេក្ខជន និងការផ្សាយការងារថ្មី'
              : 'Interactive volume curve comparing candidate applications vs newly posted vacancies.'}
          </p>
        </div>

        {/* Range Selector Pills & Legend */}
        <div className="flex items-center space-x-3 shrink-0 self-start sm:self-auto">
          {/* Legend (Unified Blue & Sky) */}
          <div className="hidden md:flex items-center space-x-3 text-[11px] font-medium mr-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-2xs" />
              <span className="text-slate-600 font-medium">{isKhmer ? 'ពាក្យសុំការងារ' : 'Applications'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-2xs" />
              <span className="text-slate-600 font-medium">{isKhmer ? 'ការងារផ្សាយ' : 'Vacancies'}</span>
            </div>
          </div>

          {/* Timeframe Buttons */}
          <div className="inline-flex items-center bg-white/70 backdrop-blur-md p-1 rounded-xl border border-white/90 text-[11px] font-semibold shadow-2xs">
            {(['7d', '30d', '12m'] as TimeRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRange(r)
                  setHoveredIdx(null)
                }}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] cursor-pointer ${
                  range === r
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-white/80'
                }`}
              >
                {r === '7d' ? (isKhmer ? '៧ ថ្ងៃ' : '7 Days') : r === '30d' ? (isKhmer ? '៣០ ថ្ងៃ' : '30 Days') : (isKhmer ? '១២ ខែ' : '12 Months')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Quick Stats Cards with Frosted Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 relative z-10">
        <div className="bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
              {isKhmer ? 'ពាក្យសុំសរុប (ក្នុងជួរ)' : 'Total Applications'}
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 block">
              {totalApps.toLocaleString()}
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
        </div>

        <div className="bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider block">
              {isKhmer ? 'ការងារបានបង្កើត' : 'New Vacancies'}
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 block">
              {totalJobs.toLocaleString()}
            </span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs" />
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white/60 backdrop-blur-md rounded-xl p-3 border border-white/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
              {isKhmer ? 'អត្រាឆ្លើយតប' : 'Response Rate'}
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 block">
              88.4%
            </span>
          </div>
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full select-none pt-2 z-10">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
        >
          <defs>
            {/* Blue Gradient for Applications */}
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>

            {/* Sky Gradient for Jobs */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                y1={tick.y}
                x2={width - padRight}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-sans"
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* Area Fills */}
          <path d={appAreaPath} fill="url(#blueGrad)" />
          <path d={jobAreaPath} fill="url(#skyGrad)" />

          {/* Lines */}
          <path
            d={jobPath}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={appPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Data Points & Hover Targets */}
          {appPoints.map((pt, i) => {
            const isHovered = hoveredIdx === i
            const jobPt = jobPoints[i]

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Vertical Guide Line on Hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={padTop + plotHeight}
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Invisible large touch target */}
                <rect
                  x={pt.x - 18}
                  y={padTop}
                  width="36"
                  height={plotHeight}
                  fill="transparent"
                />

                {/* Job Point */}
                <circle
                  cx={jobPt.x}
                  cy={jobPt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke="#0284c7"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* Application Point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  className="transition-all duration-150"
                />

                {/* X-Axis Label */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-sans transition-colors ${
                    isHovered
                      ? 'fill-blue-600 font-bold'
                      : 'fill-slate-500 font-medium'
                  }`}
                >
                  {isKhmer ? pt.labelKm : pt.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip Float with Glassmorphism */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 pointer-events-none transform -translate-x-1/2 bg-slate-900/90 text-white backdrop-blur-xl px-3.5 py-2.5 rounded-xl shadow-xl border border-white/20 text-xs transition-all z-20"
            style={{
              left: `${(appPoints[hoveredIdx].x / width) * 100}%`,
            }}
          >
            <div className="font-bold border-b border-slate-700/80 pb-1 mb-1 text-[11px] text-slate-300">
              {isKhmer ? appPoints[hoveredIdx].labelKm : appPoints[hoveredIdx].label}
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{isKhmer ? 'ពាក្យសុំ' : 'Apps'}:</span>
              <strong className="text-white font-bold">
                {appPoints[hoveredIdx].applications}
              </strong>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>{isKhmer ? 'ការងារ' : 'Jobs'}:</span>
              <strong className="text-white font-bold">
                {jobPoints[hoveredIdx].jobs}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
