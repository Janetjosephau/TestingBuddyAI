import React, { useState, useEffect } from 'react'
import { FileText, Zap, TrendingUp, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import MetricCard from '../components/MetricCard'
import ActivityFeed from '../components/ActivityFeed'
import { dashboardApi } from '../services/api'

interface Metric {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: number
}

interface Activity {
  type: string
  title: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
}

const Dashboard: React.FC = () => {
  const [metrics] = useState({
    plansGenerated: 9,
    featuresMapped: 21
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] p-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-[#0f172a] tracking-tight">Dashboard Insights</h1>
        <p className="text-slate-500 mt-2 text-lg">Overview of your TestingBuddy AI generation activities.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 flex items-center space-x-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <FileText size={32} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Plans Generated</p>
            <p className="text-5xl font-black text-[#0f172a]">{metrics.plansGenerated}</p>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 flex items-center space-x-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <RefreshCw size={32} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-400 tracking-[0.2em] uppercase mb-1">Total Features Mapped</p>
            <p className="text-5xl font-black text-[#0f172a]">{metrics.featuresMapped}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-[#0f172a] mb-8">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-bold text-[#0f172a]">1 requirement(s) analyzed</h3>
                </div>
                <p className="text-slate-500 text-sm line-clamp-1">
                  AI successfully generated a test plan based on Rally story US31488.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Apr 23, 2026, 12:50 PM
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
