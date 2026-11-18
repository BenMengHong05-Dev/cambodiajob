import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AIChartData, AISalaryBenchmarkItem, AISkillMatchItem } from '../../types'
import { usePreferences } from '../../app/providers'
import { formatCurrencyAmount, KHR_PER_USD } from '../../utils/currency'
import { Award, CheckCircle2, AlertCircle, BarChart3, TrendingUp } from 'lucide-react'

interface AICareerChartProps {
  chart: AIChartData
  className?: string
}

export const AICareerChart: React.FC<AICareerChartProps> = ({ chart, className = '' }) => {
  const { i18n } = useTranslation()
  const { currency } = usePreferences()
  const isKhmer = i18n.language === 'km'

  const title = isKhmer && chart.title_km ? chart.title_km : chart.title

  // 1. Render Salary Benchmark Chart
  if (chart.type === 'salary_benchmark') {
    const items = (chart.items || []) as AISalaryBenchmarkItem[]
    const maxVal = Math.max(...items.map((i) => i.max || 1000), 3000)

    const formatVal = (usdVal: number) => {
      const amt = currency === 'KHR' ? usdVal * KHR_PER_USD : usdVal
      return formatCurrencyAmount(amt, currency)
    }

    return (
      <div className={`bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs my-1 font-sans ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 truncate max-w-[220px]">{title}</h4>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isKhmer ? 'ទីផ្សារកម្ពុជា' : 'Cambodia Market'}</span>
          </span>
        </div>

        {/* Salary Bars */}
        {items.length === 0 ? (
          <div className="py-6 text-center text-slate-400">
            <p className="text-xs">
              {isKhmer ? 'មិនទាន់មានទិន្នន័យប្រាក់ខែលើប្រព័ន្ធទេ' : 'No salary data on platform yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((item, idx) => {
              const label = isKhmer && item.label_km ? item.label_km : item.label
              const minPercent = Math.max(5, (item.min / maxVal) * 100)
              const maxPercent = Math.min(100, Math.max(minPercent + 10, (item.max / maxVal) * 100))

              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="truncate max-w-[62%]">
                      <span className="font-semibold text-slate-800 block truncate text-[11.5px] group-hover:text-blue-600 transition-colors">
                        {label}
                      </span>
                      {item.count !== undefined && item.count > 0 ? (
                        <span className="text-[10px] text-emerald-600 font-medium block truncate">
                          {item.count} {isKhmer ? 'ការងារកំពុងជ្រើសរើស' : item.count === 1 ? 'open role' : 'open roles'}
                        </span>
                      ) : item.company ? (
                        <span className="text-[10px] text-slate-500 font-medium block truncate">
                          {item.company}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block truncate">
                          {isKhmer ? 'បទដ្ឋានទីផ្សារកម្ពុជា' : 'Cambodia Market Standard'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono shrink-0">
                      <span className="text-slate-600 font-medium">{formatVal(item.min)}</span>
                      <span className="text-slate-400">-</span>
                      <span className="text-emerald-600 font-bold">{formatVal(item.max)}</span>
                    </div>
                  </div>

                  <div className="h-2 bg-slate-200/80 rounded-full relative overflow-hidden flex items-center p-0.5 border border-slate-200/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500"
                      style={{
                        marginLeft: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>{isKhmer ? 'ប្រាក់ខែជាមធ្យមប្រចាំខែ' : 'Average monthly salary ranges'}</span>
          <span className="text-slate-500 font-mono font-medium">{currency === 'KHR' ? 'KHR / Mo' : 'USD / Mo'}</span>
        </div>
      </div>
    )
  }

  // 2. Render Skill Match Chart
  if (chart.type === 'skill_match') {
    const items = (chart.items || []) as AISkillMatchItem[]
    const score = chart.match_score || 85

    return (
      <div className={`bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 shadow-2xs my-1 font-sans ${className}`}>
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{title}</h4>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[10px] font-bold">
            <span>{score}%</span>
            <span>{isKhmer ? 'ត្រូវគ្នា' : 'Fit'}</span>
          </div>
        </div>

        <div className="space-y-2">
          {items.slice(0, 5).map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${
                item.user_has
                  ? 'bg-emerald-50/50 border-emerald-200/70 text-emerald-900'
                  : 'bg-white border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {item.user_has ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate text-[11.5px] font-medium">{item.skill}</span>
              </div>
              <span
                className={`text-[9.5px] font-bold shrink-0 px-1.5 py-0.5 rounded ${
                  item.user_has
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}
              >
                {item.user_has ? (isKhmer ? 'មានរួច' : 'Acquired') : (isKhmer ? 'ត្រូវការ' : 'Needed')}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
