import React, { useState, useEffect } from 'react'
import { Download, Plus, Loader, Eye, Trash2, Upload, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, llmApi } from '../services/api'

interface TestCase {
  id: string
  caseId: string
  title: string
  priority: string
  steps: any
  preconditions: any
  postconditions: any
  selected: boolean
}

interface TestPlan {
  id: string
  name: string
  status: string
}

interface TestCaseHistory {
  id: string
  name: string
  generatedAt: string
  totalCases: number
  syncedCases: number
  status: 'draft' | 'partial' | 'synced'
}

const TestCaseGenerator: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [history, setHistory] = useState<TestCaseHistory[]>([])
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  
  const [selectedTestPlanId, setSelectedTestPlanId] = useState('')
  const [selectedLlmConfigId, setSelectedLlmConfigId] = useState('')

  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showGeneratedModal, setShowGeneratedModal] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  useEffect(() => {
    loadPrerequisites()
    loadHistory()
  }, [])

  const loadPrerequisites = async () => {
    try {
      const [plansRes, llmRes] = await Promise.all([
        generatorApi.getTestPlans(),
        llmApi.getConfigs()
      ])
      setTestPlans(plansRes.data)
      setLlmConfigs(llmRes.data)
      if (llmRes.data.length > 0) setSelectedLlmConfigId(llmRes.data[0].id)
    } catch (e) {
      toast.error('Failed to load prerequisites')
    }
  }

  const loadHistory = async () => {
    // Here backend could supply suites/history. For now just mock it or load partial test cases grouping.
  }

  const handleGenerateTestCases = async () => {
    if (!selectedTestPlanId) {
      toast.error('Please select a parent test plan')
      return
    }

    if (!selectedLlmConfigId) {
      toast.error('Please configure an LLM first')
      return
    }

    setGenerating(true)
    try {
      const res = await generatorApi.generateTestCases({
        testPlanId: selectedTestPlanId,
        llmConfigId: selectedLlmConfigId
      })
      
      const generatedCases = res.data.testCases || []
      
      setTestCases(generatedCases.map((tc: any) => ({ ...tc, selected: false })))
      
      setGeneratedContent(JSON.stringify(generatedCases, null, 2))
      setShowGeneratedModal(true)
      toast.success(res.data.message || 'Test Cases Generated')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to generate test cases')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectTestCase = (id: string) => {
    setTestCases(testCases.map(tc => 
      tc.id === id ? { ...tc, selected: !tc.selected } : tc
    ))
  }

  const handleSelectAll = () => {
    const allSelected = testCases.every(tc => tc.selected)
    setTestCases(testCases.map(tc => ({ ...tc, selected: !allSelected })))
  }

  const handleUploadToRally = async () => {
    const selectedCases = testCases.filter(tc => tc.selected)
    if (selectedCases.length === 0) {
      toast.error('Please select at least one test case')
      return
    }

    setUploading(true)
    try {
      // Backend Rally integration placeholder simulation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newHistory: TestCaseHistory = {
        id: Date.now().toString(),
        name: testPlans.find(p => p.id === selectedTestPlanId)?.name || 'Unknown Suite',
        generatedAt: new Date().toLocaleDateString(),
        totalCases: testCases.length,
        syncedCases: selectedCases.length,
        status: 'partial'
      }
      
      setHistory([newHistory, ...history])
      setTestCases([])
      toast.success(`${selectedCases.length} test case(s) uploaded to Rally`)
    } catch (error) {
      toast.error('Failed to upload to Rally')
    } finally {
      setUploading(false)
    }
  }

  const handleExport = (format: 'json' | 'pdf') => {
    const selectedCases = testCases.filter(tc => tc.selected)
    if (selectedCases.length === 0) {
      toast.error('Please select at least one test case')
      return
    }

    const payloadContent = JSON.stringify(selectedCases, null, 2)
    const element = document.createElement('a')
    const file = new Blob([payloadContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `test-cases-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast.success(`${selectedCases.length} test case(s) exported as ${format.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Test Case Generator</h1>
          <p className="text-gray-600 mt-2">Generate and manage test cases derived from existing Test Plans</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Test Cases</h2>

              {/* Step 1: Select Plan */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Origin Test Plan</h3>
                <div className="space-y-4">
                  <div>
                    <select
                      value={selectedTestPlanId}
                      onChange={(e) => setSelectedTestPlanId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a Test Plan</option>
                      {testPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Generate Cases */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Generation Engine</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LLM Configuration (Ollama)</label>
                    <select
                      value={selectedLlmConfigId}
                      onChange={(e) => setSelectedLlmConfigId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select LLM Config</option>
                      {llmConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={handleGenerateTestCases}
                    disabled={generating || !selectedTestPlanId}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition-colors"
                  >
                    {generating ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
                    {generating ? 'Generating...' : 'Generate Test Cases'}
                  </button>
                </div>
              </div>

              {/* Step 3: Select & Upload */}
              {testCases.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Organize & Upload to Rally</h3>
                  
                  <div className="mb-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={testCases.every(tc => tc.selected)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label className="text-sm font-medium text-gray-700">Select All</label>
                  </div>

                  <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    {testCases.map(tc => (
                      <label key={tc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={tc.selected}
                          onChange={() => handleSelectTestCase(tc.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{tc.caseId}</span>
                            <span className="text-sm text-gray-600">{tc.title}</span>
                          </div>
                          <span className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                            tc.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tc.priority}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">{tc.steps?.length || 0} steps</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUploadToRally}
                      disabled={uploading || testCases.filter(tc => tc.selected).length === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 font-medium transition-colors"
                    >
                      {uploading ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                      {uploading ? 'Uploading...' : 'Upload Selected to Rally'}
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                      <Download size={18} /> Export JSON File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History Panel */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">History</h2>
              
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No test suites uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {history.map(item => (
                    <div key={item.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{item.generatedAt}</p>
                      <div className="mt-2 text-xs space-y-1">
                        <p className="text-gray-700">Total Generated: {item.totalCases}</p>
                        <p className="text-green-600 flex items-center gap-1">
                          <CheckCircle size={12} /> Synced: {item.syncedCases}
                        </p>
                      </div>
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                        item.status === 'synced' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Modal */}
      {showGeneratedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Generated Test Cases Log</h2>
              <button
                onClick={() => setShowGeneratedModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{generatedContent}</pre>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => setShowGeneratedModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestCaseGenerator
