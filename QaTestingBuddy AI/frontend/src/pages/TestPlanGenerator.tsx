import React, { useState, useEffect } from 'react'
import { Download, Plus, Loader, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, jiraApi, llmApi } from '../services/api'

interface TestPlan {
  id: string
  name: string
  generatedAt: string
  status: 'draft' | 'finalized' | 'synced'
  testCases?: number
}

interface JiraRequirement {
  issueId: string
  key?: string
  title: string
  description: string
  priority: string
}

const TestPlanGenerator: React.FC = () => {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
  const [requirements, setRequirements] = useState<JiraRequirement[]>([])
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([])
  const [jiraConfigs, setJiraConfigs] = useState<any[]>([])
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  const [selectedJiraConfigId, setSelectedJiraConfigId] = useState('')
  const [selectedLlmConfigId, setSelectedLlmConfigId] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [fetching, setFetching] = useState(false)
  
  const [planName, setPlanName] = useState('')
  const [showGeneratedModal, setShowGeneratedModal] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')

  useEffect(() => {
    loadPrerequisites()
    loadHistory()
  }, [])

  const loadPrerequisites = async () => {
    try {
      const [jiraRes, llmRes] = await Promise.all([
        jiraApi.getConfigs(),
        llmApi.getConfigs()
      ])
      setJiraConfigs(jiraRes.data)
      setLlmConfigs(llmRes.data)
      if (jiraRes.data.length > 0) setSelectedJiraConfigId(jiraRes.data[0].id)
      if (llmRes.data.length > 0) setSelectedLlmConfigId(llmRes.data[0].id)
    } catch (e) {
      toast.error('Failed to load connection configurations')
    }
  }

  const loadHistory = async () => {
    try {
      const res = await generatorApi.getTestPlans()
      setTestPlans(res.data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleFetchDetails = async () => {
    if (!selectedJiraConfigId) {
      toast.error('No Jira config selected.')
      return
    }
    setFetching(true)
    try {
      const res = await jiraApi.fetchRequirements({ configId: selectedJiraConfigId })
      setRequirements(res.data.requirements || [])
      toast.success('Requirements fetched successfully')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to fetch requirements. Ensure Jira is configured.')
    } finally {
      setFetching(false)
    }
  }

  const handleGenerateTestPlan = async () => {
    if (selectedRequirements.length === 0) {
      toast.error('Please select at least one requirement')
      return
    }

    if (!planName.trim()) {
      toast.error('Please enter a test plan name')
      return
    }

    if (!selectedLlmConfigId) {
      toast.error('Please configure an LLM first')
      return
    }
    
    // Pick the first selected requirement. In full implementation, backend could handle bulk.
    const primaryReq = requirements.find(r => r.issueId === selectedRequirements[0])

    setGenerating(true)
    try {
      const res = await generatorApi.generateTestPlan({
        jiraIssueId: primaryReq?.issueId || selectedRequirements[0],
        llmConfigId: selectedLlmConfigId,
        jiraConfigId: selectedJiraConfigId,
        additionalRequirements: `Generate a robust test plan focusing heavily on quality assurance. Provide raw JSON.`
      })

      const generatedData = res.data

      setGeneratedContent(JSON.stringify(generatedData, null, 2))
      setShowGeneratedModal(true)
      toast.success('Test Plan Generated')
      
      await loadHistory()
      
      setPlanName('')
      setSelectedRequirements([])
      setRequirements([])
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to generate test plan')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = (format: 'json' | 'pdf') => {
    if (!generatedContent) return
    
    const element = document.createElement('a')
    const file = new Blob([generatedContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `test-plan-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    toast.success(`Test plan exported as ${format.toUpperCase()}`)
  }

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this test plan?')) {
      // Assuming a delete endpoint exists or mocking it out.
      toast.error('Delete unimplemented via API block yet.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Test Plan Generator</h1>
          <p className="text-gray-600 mt-2">Generate comprehensive test plans from Jira requirements using Ollama</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Test Plan</h2>

              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 0: Select Connections</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Jira Configuration</label>
                    <select
                      value={selectedJiraConfigId}
                      onChange={(e) => setSelectedJiraConfigId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Jira Config</option>
                      {jiraConfigs.map(c => <option key={c.id} value={c.id}>{c.projectKey} ({c.instanceUrl})</option>)}
                    </select>
                  </div>
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
                </div>
              </div>

              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Fetch Requirements</h3>
                <button
                  onClick={handleFetchDetails}
                  disabled={fetching || !selectedJiraConfigId}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
                >
                  {fetching ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
                  {fetching ? 'Fetching...' : 'Fetch Details'}
                </button>
              </div>

              {requirements.length > 0 && (
                <div className="mb-8 pb-8 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Select Requirements</h3>
                  <div className="space-y-3">
                    {requirements.map(req => (
                      <label key={req.issueId} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={selectedRequirements.includes(req.issueId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequirements([...selectedRequirements, req.issueId])
                            } else {
                              setSelectedRequirements(selectedRequirements.filter(id => id !== req.issueId))
                            }
                          }}
                          className="mt-1 w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{req.title || req.key}</h4>
                          <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
                            {req.priority || 'Medium'} Priority
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequirements.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Test Plan Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                      <input
                        type="text"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="e.g., Authentication Module Test Plan"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleGenerateTestPlan}
                      disabled={generating || !selectedLlmConfigId}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition-colors"
                    >
                      {generating ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
                      {generating ? 'Generating via Ollama...' : 'Generate Test Plan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">History</h2>
              
              {testPlans.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No test plans yet</p>
              ) : (
                <div className="space-y-3">
                  {testPlans.map(plan => (
                    <div key={plan.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-xs text-gray-600 mt-1">{new Date(plan.generatedAt).toLocaleDateString()}</p>
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                            plan.status === 'synced' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {plan.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                          <Eye size={14} /> View
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="flex items-center justify-center gap-1 px-2 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showGeneratedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Generated Test Plan</h2>
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
                onClick={() => handleExport('pdf')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                <Download size={18} /> Export as text
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                <Download size={18} /> Export as JSON
              </button>
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

export default TestPlanGenerator
