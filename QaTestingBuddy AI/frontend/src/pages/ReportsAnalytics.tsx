import React, { useState } from 'react'
import { BarChart3, TrendingUp, Activity } from 'lucide-react'

interface CoverageData {
  automated: number
  manual: number
  notTested: number
}

interface TrendData {
  month: string
  generated: number
  executed: number
}

const ReportsAnalytics: React.FC = () => {
  const [coverageData] = useState<CoverageData>({
    automated: 65,
    manual: 25,
    notTested: 10
  })

  const [trendData] = useState<TrendData[]>([
    { month: 'Jan', generated: 12, executed: 10 },
    { month: 'Feb', generated: 18, executed: 15 },
    { month: 'Mar', generated: 25, executed: 22 },
    { month: 'Apr', generated: 31, executed: 28 },
    { month: 'May', generated: 38, executed: 35 },
    { month: 'Jun', generated: 45, executed: 42 }
  ])

  const maxValue = Math.max(...trendData.map(d => Math.max(d.generated, d.executed)))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Track your testing metrics and performance trends</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Test Cases</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">342</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <BarChart3 size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Automated</p>
                <p className="text-3xl font-bold text-green-600 mt-2">223</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <Activity size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Execution Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">92%</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pass Rate</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">87%</p>
              </div>
              <div className="bg-orange-100 rounded-lg p-3">
                <BarChart3 size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Coverage Breakdown</h2>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Coverage Bars */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Automated Test Cases</span>
                      <span className="text-sm font-bold text-gray-900">{coverageData.automated}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-green-500 h-4 rounded-full" 
                        style={{ width: `${coverageData.automated}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Manual Test Cases</span>
                      <span className="text-sm font-bold text-gray-900">{coverageData.manual}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-blue-500 h-4 rounded-full" 
                        style={{ width: `${coverageData.manual}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Not Tested</span>
                      <span className="text-sm font-bold text-gray-900">{coverageData.notTested}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-gray-400 h-4 rounded-full" 
                        style={{ width: `${coverageData.notTested}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Automated</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">Manual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-sm text-gray-600">Not Tested</span>
                </div>
              </div>
            </div>
          </div>

          {/* Execution Stats */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Execution Statistics</h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Passed</span>
                  <span className="text-lg font-bold text-green-600">298</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-green-500 h-4 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Failed</span>
                  <span className="text-lg font-bold text-red-600">28</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-red-500 h-4 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Skipped</span>
                  <span className="text-lg font-bold text-yellow-600">16</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-yellow-500 h-4 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">Average Execution Time</p>
                <p className="text-2xl font-bold text-green-600 mt-1">2h 45m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Generation Trend</h2>
          
          <div className="flex items-end justify-between h-64 gap-4 px-4">
            {trendData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="relative w-full flex items-end justify-center gap-1 h-48">
                  {/* Generated Bar */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-6 bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${(data.generated / maxValue) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Executed Bar */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-6 bg-green-500 rounded-t-lg transition-all"
                      style={{ height: `${(data.executed / maxValue) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 mt-4">{data.month}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-8 border-t border-gray-200 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Executed</span>
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Most Tested Feature</h3>
            <p className="text-2xl font-bold text-blue-600">Authentication</p>
            <p className="text-sm text-blue-700 mt-2">78 test cases</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-2">Defect Detection</h3>
            <p className="text-2xl font-bold text-purple-600">34 Defects</p>
            <p className="text-sm text-purple-700 mt-2">Severity: 8 Critical, 12 Major</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-2">Quality Score</h3>
            <p className="text-2xl font-bold text-green-600">8.7/10</p>
            <p className="text-sm text-green-700 mt-2">↑ 0.5 from last month</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsAnalytics
