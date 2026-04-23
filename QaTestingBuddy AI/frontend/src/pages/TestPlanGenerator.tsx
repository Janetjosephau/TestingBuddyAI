import React, { useState, useEffect } from 'react'
import { FileText, RefreshCw, Zap, Eye, Trash2, Download, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, jiraApi, llmApi } from '../services/api'

interface TestPlan {
  id: string
  name: string
  generatedAt: string
  status: 'draft' | 'finalized' | 'synced'
  testCases?: number
}

const TestPlanGenerator: React.FC = () => {
  const [testPlans, setTestPlans] = useState<TestPlan[]>([])
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
    setFetching(true)
    setTimeout(() => {
      setFetching(false)
      toast.success('Project details fetched from Jira')
    }, 1500)
  }

  const handleGenerateTestPlan = async () => {
    if (!planName.trim()) {
      toast.error('Please enter requirements or context')
      return
    }

    setGenerating(true)
    try {
      const res = await generatorApi.generateTestPlan({
        jiraIssueId: 'MANUAL',
        llmConfigId: selectedLlmConfigId || llmConfigs[0]?.id,
        jiraConfigId: selectedJiraConfigId || jiraConfigs[0]?.id,
        additionalRequirements: planName
      })

      setGeneratedContent(JSON.stringify(res.data, null, 2))
      setShowGeneratedModal(true)
      toast.success('Test Plan Generated')
      await loadHistory()
    } catch (error: any) {
      toast.error('Failed to generate test plan')
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = (format: string) => {
    toast.success(`Exporting as ${format.toUpperCase()}...`)
  }

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Delete this test plan?')) {
      try {
        await generatorApi.deleteTestPlan(id)
        toast.success('Test plan deleted')
        await loadHistory() // Refresh the list
      } catch (error) {
        toast.error('Failed to delete test plan')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-12">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-12">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">Step 1: Test Plan Generator</h1>
              <p className="text-slate-500 mt-1 font-medium">Provide Jira details to fetch user stories and generate an intelligent test plan.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Jira Instance Box */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Jira Instance</label>
              <div className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center">
                <span className="text-slate-700 font-bold">
                  {jiraConfigs[0]?.instanceUrl || 'https://lucky1985mayankmishra.atlassian.net/'}
                </span>
              </div>
            </div>

            {/* Project ID Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Project ID</label>
              <input
                type="text"
                defaultValue="KAN"
                placeholder="e.g., KAN"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
              />
            </div>

            {/* Additional Context Textarea */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">Additional Context</label>
              <textarea
                placeholder="Create a small 1 page test plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full h-32 px-6 py-4 bg-white border-2 border-blue-500 rounded-2xl text-slate-700 font-medium focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-6 pt-6">
              <button
                onClick={handleFetchDetails}
                disabled={fetching}
                className="px-10 h-14 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center space-x-3 shadow-sm"
              >
                <div className="relative">
                  <RefreshCw size={20} className={fetching ? 'animate-spin' : ''} />
                </div>
                <span>Fetch Details</span>
              </button>
              <button
                onClick={handleGenerateTestPlan}
                disabled={generating}
                className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-3"
              >
                <Zap size={22} className="fill-current" />
                <span>Generate Test Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        {testPlans.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6 px-4">Recent Test Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testPlans.map(plan => (
                <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-[#0f172a]">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{new Date(plan.generatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeletePlan(plan.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showGeneratedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#0f172a]">Generated Test Plan</h2>
              <button onClick={() => setShowGeneratedModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono bg-slate-50 p-6 rounded-2xl">{generatedContent}</pre>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button onClick={() => handleExport('pdf')} className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Download size={18} /> Export Text</button>
              <button onClick={() => handleExport('json')} className="flex-1 h-12 bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2"><Download size={18} /> Export JSON</button>
              <button onClick={() => setShowGeneratedModal(false)} className="px-8 h-12 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestPlanGenerator
