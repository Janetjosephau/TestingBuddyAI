import React, { useState, useEffect } from 'react'
import { 
  Download, RefreshCw, Zap, Eye, Trash2, Upload, 
  Database, Loader, FileText, FileCheck, Search, 
  Settings, ChevronRight, CheckCircle2, AlertCircle,
  FileDown, FileUp, Edit3, Save, X, XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, rallyApi, llmApi } from '../services/api'

interface TestCase {
  id: string
  caseId: string
  title: string
  preconditions: string[]
  steps: { action: string; expectedResult: string }[]
  postconditions: string[]
  priority: string
  status: string
}

interface RallyRequirement {
  key: string
  title: string
  description: string
  issueType: string
  status: string
  priority: string
}

const TestCaseGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fetch' | 'generate' | 'review' | 'upload'>('fetch')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Tab 1: Fetch State
  const [projectKey, setProjectKey] = useState('')
  const [fetchedIssues, setFetchedIssues] = useState<RallyRequirement[]>([])
  const [selectedIssue, setSelectedIssue] = useState<RallyRequirement | null>(null)

  // Tab 2/3: Generation & Review State
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  const [selectedLlmId, setSelectedLlmId] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null)
  const [generationError, setGenerationError] = useState<{ title: string; detail: string } | null>(null)

  useEffect(() => {
    loadLlmConfigs()
  }, [])

  const loadLlmConfigs = async () => {
    try {
      const res = await llmApi.getConfigs()
      setLlmConfigs(res.data)
      if (res.data.length > 0) setSelectedLlmId(res.data[0].id)
    } catch (e) {
      console.error('Failed to load LLM configs')
    }
  }

  const handleFetchRequirements = async () => {
    if (!projectKey.trim()) {
      toast.error('Please enter a Rally Formatted ID (e.g. US31488)')
      return
    }
    setFetching(true)
    try {
      const res = await rallyApi.fetchRequirements(projectKey)
      if (res.data.success) {
        setFetchedIssues(res.data.requirements)
        setSelectedIssue(res.data.requirements[0] || null)
        toast.success(`Fetched requirement from Rally`)
      } else {
        toast.error(res.data.message || 'Requirement not found')
      }
    } catch (e) {
      toast.error('Failed to connect to Rally')
    } finally {
      setFetching(false)
    }
  }

  const handleGenerateCases = async () => {
    if (!selectedIssue) {
      toast.error('Please select a requirement first')
      return
    }
    setGenerating(true)
    setGenerationError(null)
    try {
      const res = await generatorApi.generateTestCases({
        testPlanId: 'manual-gen',
        llmConfigId: selectedLlmId,
        additionalInstructions: additionalContext,
        requirementBody: `${selectedIssue.title}\n\n${selectedIssue.description || ''}`
      })

      if (res.data.success) {
        setGeneratedTestCases(res.data.testCases)
        setActiveTab('review')
        toast.success('Test cases generated!')
      } else {
        setGenerationError({
          title: 'Generation Failed',
          detail: res.data.message || 'The AI could not generate test cases. Please check your LLM connection and try again.'
        })
      }
    } catch (e: any) {
      const detail =
        e?.response?.data?.message ||
        e?.message ||
        'An unexpected error occurred. Please verify your LLM configuration and try again.'
      setGenerationError({
        title: 'Generation Error',
        detail
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(generatedTestCases, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `test-cases-${selectedIssue?.key || 'export'}.json`
    link.click()
    toast.success('Exported to JSON')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        setGeneratedTestCases(imported)
        toast.success('Test cases imported')
      } catch (err) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const handleUploadToRally = async () => {
    if (generatedTestCases.length === 0) return
    
    setUploading(true)
    setSyncResult(null)
    try {
      const res = await rallyApi.upload({
        testCases: generatedTestCases,
        storyKey: selectedIssue?.key
      })
      
      setSyncResult(res.data)
      if (res.data.success) toast.success('Uploaded to Rally')
      else toast.error('Upload failed')
    } catch (e: any) {
      toast.error('Rally connection error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[700px] flex flex-col">
          
          <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Zap size={28} className="fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Test Case Generator</h1>
                <p className="text-slate-500 text-sm font-medium">Draft, review, and sync test cases with AI precision.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
               {['fetch', 'generate', 'review', 'upload'].map((tab, idx) => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
                 >
                   {idx + 1}. {tab}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {activeTab === 'fetch' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rally Formatted ID (e.g. US31488)</label>
                    <input 
                      type="text" 
                      placeholder="Enter ID..."
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-emerald-500 transition-all uppercase"
                    />
                  </div>
                  <button 
                    onClick={handleFetchRequirements}
                    disabled={fetching}
                    className="w-full h-14 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-100"
                  >
                    {fetching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                    <span>Fetch Requirement</span>
                  </button>
                </div>

                {fetchedIssues.length > 0 && (
                  <div className="pt-8">
                    <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center space-x-2">
                      <FileCheck size={18} className="text-emerald-500" />
                      <span>SELECTED REQUIREMENT</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {fetchedIssues.map((issue) => (
                        <div 
                          key={issue.key}
                          onClick={() => setSelectedIssue(issue)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedIssue?.key === issue.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 hover:border-slate-200'}`}
                        >
                          <div className="flex items-center space-x-4">
                            <span className="text-xs font-black text-emerald-600 bg-white px-2 py-1 rounded-md border border-emerald-100">{issue.key}</span>
                            <span className="font-bold text-slate-700">{issue.title}</span>
                          </div>
                          {selectedIssue?.key === issue.key && <CheckCircle2 className="text-emerald-500" size={20} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'generate' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start space-x-4">
                  <AlertCircle className="text-emerald-600 mt-1" size={24} />
                  <div>
                    <h3 className="font-black text-emerald-900">Step 2: AI Configuration</h3>
                    <p className="text-emerald-700 text-sm mt-1">Select your model and provide any custom guidance for the generator.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selected Story</label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700">
                      {selectedIssue ? `${selectedIssue.key}: ${selectedIssue.title}` : 'None selected'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select AI Model</label>
                    <select 
                      value={selectedLlmId}
                      onChange={(e) => setSelectedLlmId(e.target.value)}
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-emerald-500"
                    >
                      {llmConfigs.map(config => (
                        <option key={config.id} value={config.id}>{config.name} ({config.model})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Personalize instructions (Optional)</label>
                    <textarea 
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="e.g. Include negative cases and focus on API boundary testing."
                      className="w-full h-40 p-5 bg-white border-2 border-emerald-500 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-emerald-50 transition-all shadow-sm"
                    />
                  </div>

                  <button 
                    onClick={handleGenerateCases}
                    disabled={generating || !selectedIssue}
                    className="w-full h-16 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-emerald-200 disabled:opacity-50"
                  >
                    {generating ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} className="fill-current" />}
                    <span>{generating ? 'Generating...' : 'Generate Test Cases'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">Review Results ({generatedTestCases.length})</h2>
                  <div className="flex space-x-4">
                    <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all font-bold text-xs text-emerald-700">
                      <FileDown size={16} /> <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {generatedTestCases.map((tc, idx) => (
                    <div key={tc.id} className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden hover:border-emerald-200 transition-all">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                         <div className="flex items-center space-x-3">
                           <span className="text-xs font-black text-slate-400">{tc.caseId}</span>
                           <h4 className="font-black text-slate-800">{tc.title}</h4>
                         </div>
                         <span className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-black rounded uppercase text-slate-500">{tc.priority}</span>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preconditions</h5>
                             <ul className="space-y-1">
                               {tc.preconditions.map((p, i) => <li key={i} className="text-sm font-medium text-slate-600 flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> <span>{p}</span></li>)}
                             </ul>
                           </div>
                           <div>
                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Steps</h5>
                             <div className="space-y-3">
                               {tc.steps.map((s, i) => (
                                 <div key={i} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                                   <p className="font-black text-slate-800">{i+1}. {s.action}</p>
                                   <p className="text-emerald-600 font-bold mt-1">Expected: {s.expectedResult}</p>
                                 </div>
                               ))}
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto py-12 text-center">
                <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600 border-2 border-emerald-100 shadow-inner">
                  <Database size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Synchronize to Rally</h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  Upload {generatedTestCases.length} verified test cases directly to Rally story <span className="font-black text-slate-900">{selectedIssue?.key}</span>.
                </p>

                {syncResult && (
                  <div className={`p-6 rounded-2xl border-2 ${syncResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <div className="flex items-center space-x-3 mb-2">
                      {syncResult.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                      <h4 className="font-black text-lg">{syncResult.success ? 'Success' : 'Failed'}</h4>
                    </div>
                    <p className="font-bold">{syncResult.message}</p>
                  </div>
                )}

                <button 
                  onClick={handleUploadToRally}
                  disabled={uploading || generatedTestCases.length === 0}
                  className="w-full h-20 bg-emerald-600 text-white rounded-3xl font-black text-xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-emerald-200 disabled:opacity-50"
                >
                  {uploading ? <Loader className="animate-spin" size={28} /> : <Upload size={28} />}
                  <span>{uploading ? 'Syncing...' : 'Confirm Upload to Rally'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button 
              onClick={() => {
                if (activeTab === 'upload') setActiveTab('review')
                else if (activeTab === 'review') setActiveTab('generate')
                else if (activeTab === 'generate') setActiveTab('fetch')
              }}
              disabled={activeTab === 'fetch'}
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all"
            >
              Previous
            </button>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map(n => <div key={n} className={`w-2 h-2 rounded-full ${activeTab === ['fetch', 'generate', 'review', 'upload'][n-1] ? 'w-8 bg-emerald-500' : 'bg-slate-300'} transition-all`} />)}
            </div>
            <button 
              onClick={() => {
                if (activeTab === 'fetch') setActiveTab('generate')
                else if (activeTab === 'generate') setActiveTab('review')
                else if (activeTab === 'review') setActiveTab('upload')
              }}
              disabled={activeTab === 'upload' || (activeTab === 'fetch' && !selectedIssue) || (activeTab === 'generate' && generatedTestCases.length === 0)}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 disabled:opacity-30 flex items-center space-x-2 transition-all"
            >
              <span>Next</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Generation Error Modal — waits for user to dismiss */}
    {generationError && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setGenerationError(null)}
        />
        <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          <div className="h-2 w-full bg-gradient-to-r from-red-500 to-rose-500" />
          <div className="p-10">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle size={32} className="text-red-500" />
              </div>
              <div className="pt-1">
                <h2 className="text-xl font-black text-slate-900">{generationError?.title}</h2>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Test Case Generator · Rally</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8">
              <p className="text-sm font-bold text-red-700 leading-relaxed">{generationError?.detail}</p>
            </div>
            <div className="space-y-3 mb-8">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">What to check</p>
              <ul className="space-y-2">
                {[
                  'Verify your LLM connection is active (AI Configuration page)',
                  'Ensure the Ollama service is running and reachable via Ngrok',
                  'Confirm OLLAMA_ORIGINS=* is set on your local machine',
                  'Check that a valid Rally story was fetched before generating'
                ].map((tip, i) => (
                  <li key={i} className="flex items-start space-x-2 text-sm text-slate-600 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setGenerationError(null)}
                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all"
              >
                Close &amp; Retry
              </button>
              <button
                onClick={() => { setGenerationError(null); window.location.href = '/connections/llm' }}
                className="h-12 px-6 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-black hover:bg-slate-50 transition-all text-sm"
              >
                Check LLM Config
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default TestCaseGenerator
