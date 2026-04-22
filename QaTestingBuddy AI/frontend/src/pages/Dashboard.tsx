import React, { useState, useEffect } from 'react'
import { FileText, Zap, TrendingUp, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import ActivityFeed from '../components/ActivityFeed'

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
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Test Plans',
      value: 12,
      icon: <FileText size={24} />,
      color: 'bg-blue-500',
      trend: 3
    },
    {
      label: 'Test Cases',
      value: 89,
      icon: <Zap size={24} />,
      color: 'bg-purple-500',
      trend: 15
    },
    {
      label: 'Coverage %',
      value: 76,
      icon: <TrendingUp size={24} />,
      color: 'bg-green-500',
      trend: 5
    },
    {
      label: 'Synced to Jira',
      value: 45,
      icon: <RefreshCw size={24} />,
      color: 'bg-orange-500',
      trend: 8
    }
  ])

  const [activities, setActivities] = useState<Activity[]>([
    {
      type: 'test_plan_generated',
      title: 'Generated: User Authentication Flow Test Plan',
      timestamp: '2 hours ago',
      status: 'success'
    },
    {
      type: 'synced_to_jira',
      title: 'Synced 5 test cases to Jira (Project: AUTH)',
      timestamp: '4 hours ago',
      status: 'success'
    },
    {
      type: 'test_case_generated',
      title: 'Generated: Payment Processing Test Cases',
      timestamp: '6 hours ago',
      status: 'success'
    },
    {
      type: 'synced_to_rally',
      title: 'Synced 3 test cases to Rally',
      timestamp: '1 day ago',
      status: 'pending'
    }
  ])

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    setLoading(true)
    // TODO: Replace with actual API call
    // const fetchDashboard = async () => {
    //   const response = await fetch('/api/dashboard/metrics')
    //   const data = await response.json()
    //   setMetrics(data.metrics)
    //   setActivities(data.activities)
    //   setLoading(false)
    // }
    // fetchDashboard()
    setTimeout(() => setLoading(false), 500)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your testing overview.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coverage Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Test Coverage Breakdown</h2>
          
          <div className="space-y-6">
            {/* Manual vs Automated */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Automated Test Cases</span>
                <span className="text-sm font-bold text-gray-900">65%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Manual Test Cases</span>
                <span className="text-sm font-bold text-gray-900">35%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Generated This Month</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">23</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Synced to Jira</p>
              <p className="text-2xl font-bold text-green-600 mt-1">18</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Synced to Rally</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">12</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <Clock size={20} className="text-gray-400" />
          </div>
          
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-6 py-3 font-medium transition-all">
            📋 Generate Test Plan
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-6 py-3 font-medium transition-all">
            ✓ Generate Test Cases
          </button>
          <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-6 py-3 font-medium transition-all">
            🔗 Configure Connection
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
