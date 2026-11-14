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
      <div className={`bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-3 shadow-md border border-indigo-900/50 my-2 font-sans ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-indigo-800/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-white truncate max-w-[220px]">{title}</h4>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {isKhmer ? 'ទិន្នន័យផ្ទាល់' : 'Live DB'}
          </span>
        </div>

        {/* Salary Bars */}
        <div className="space-y-2.5">
          {items.slice(0, 4).map((item, idx) => {
            const label = isKhmer && item.label_km ? item.label_km : item.label
            const minPercent = Math.max(5, (item.min / maxVal) * 100)
            const maxPercent = Math.min(100, Math.max(minPercent + 10, (item.max / maxVal) * 100))

            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-semibold text-slate-200 truncate max-w-[60%]">
                    {label}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-200 font-mono">
                    <span className="text-slate-400">{formatVal(item.min)}</span>
                    <span className="text-slate-500">-</span>
                    <span className="text-emerald-400 font-bold">{formatVal(item.max)}</span>
                  </div>
                </div>

                <div className="h-2.5 bg-slate-800/80 rounded-full relative overflow-hidden flex items-center p-0.5 border border-slate-700/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 opacity-90 transition-all duration-500"
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

        <div className="mt-2.5 pt-2 border-t border-indigo-900/40 flex items-center justify-between text-[9px] text-indigo-300">
          <span>{isKhmer ? 'ប្រាក់ខែជាមធ្យមប្រចាំខែ' : 'Average monthly salary ranges'}</span>
          <span className="text-slate-400 font-mono">USD / Mo</span>
        </div>
      </div>
    )
  }

  // 2. Render Skill Match Chart
  if (chart.type === 'skill_match') {
    const items = (chart.items || []) as AISkillMatchItem[]
    const score = chart.match_score || 85
    const matchedCount = items.filter((i) => i.user_has).length

    return (
      <div className={`bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-3 shadow-md border border-blue-900/50 my-2 font-sans ${className}`}>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-800/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
              <Award className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-white truncate max-w-[200px]">{title}</h4>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
            <span>{score}%</span>
            <span>{isKhmer ? 'ត្រូវគ្នា' : 'Fit'}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          {items.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] ${
                item.user_has
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                  : 'bg-amber-950/20 border-amber-800/30 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {item.user_has ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="truncate">{item.skill}</span>
              </div>
              <span className="text-[9px] font-bold shrink-0">
                {item.user_has ? '100%' : 'Required'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
