import React, { useState, useEffect } from 'react'
import { 
  Download, RefreshCw, Zap, Eye, Trash2, Upload, 
  Database, Loader, FileText, FileCheck, Search, 
  Settings, ChevronRight, CheckCircle2, AlertCircle,
  FileDown, FileUp, Edit3, Save, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { jiraApi, generatorApi, rallyApi, llmApi } from '../services/api'

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

interface JiraIssue {
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
  const [projectKey, setProjectKey] = useState('KAN')
  const [issueType, setIssueType] = useState('Story')
  const [statusFilter, setStatusFilter] = useState('')
  const [jqlQuery, setJqlQuery] = useState('')
  const [fetchedIssues, setFetchedIssues] = useState<JiraIssue[]>([])
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null)

  // Tab 2/3: Generation & Review State
  const [llmConfigs, setLlmConfigs] = useState<any[]>([])
  const [selectedLlmId, setSelectedLlmId] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null)
  const [reqSource, setReqSource] = useState<'jira' | 'rally'>('jira')

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
    setFetching(true)
    try {
      let res;
      if (reqSource === 'jira') {
        const jiraConfigs = await jiraApi.getConfigs()
        const activeConfig = jiraConfigs.data[0]
        if (!activeConfig) {
          toast.error('No Jira connection configured')
          return
        }

        res = await jiraApi.fetchRequirements({
          instanceUrl: activeConfig.instanceUrl,
          email: activeConfig.email,
          apiToken: activeConfig.apiToken,
          projectKey: projectKey || activeConfig.projectKey,
          issueType,
          status: statusFilter,
          jql: jqlQuery
        })
      } else {
        // Rally source
        const configs = await rallyApi.getConfigs();
        if (configs.data.length === 0) {
          toast.error('No Rally connection configured');
          return;
        }
        res = await rallyApi.fetchRequirements(jqlQuery || projectKey);
      }

      if (res.data.success) {
        setFetchedIssues(res.data.requirements)
        toast.success(`Fetched ${res.data.requirements.length} requirements`)
      } else {
        toast.error(res.data.message || 'Failed to fetch requirements')
      }
    } catch (e) {
      toast.error('Connection error')
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
    try {
      // In a real app, this would use generatorApi.generateTestCases
      // For now, simulating the generation based on selected issue
      const res = await generatorApi.generateTestCases({
        testPlanId: 'manual-gen',
        llmConfigId: selectedLlmId,
        additionalInstructions: `Requirement: ${selectedIssue.title}. Context: ${additionalContext}`
      })

      if (res.data.success) {
        setGeneratedTestCases(res.data.testCases)
        setActiveTab('review')
        toast.success('Test cases generated!')
      }
    } catch (e) {
      toast.error('Generation failed')
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
        toast.success('Test cases imported successfully')
      } catch (err) {
        toast.error('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const handleUploadToRally = async () => {
    if (generatedTestCases.length === 0) {
      toast.error('No test cases to upload');
      return;
    }
    
    setUploading(true);
    setSyncResult(null);
    try {
      const rallyConfigs = await rallyApi.getConfigs();
      if (!rallyConfigs.data || rallyConfigs.data.length === 0) {
        toast.error('Please configure Rally connection first');
        return;
      }
      
      const res = await rallyApi.upload({
        rallyConfigId: rallyConfigs.data[0].id,
        testCases: generatedTestCases,
        storyKey: selectedIssue?.key
      });
      
      setSyncResult(res.data);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Connection error with Rally');
      setSyncResult({ success: false, message: 'Connection Error with Rally Server' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden min-h-[700px] flex flex-col">
          
          {/* Header */}
          <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Zap size={28} className="text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Intelligent Test case generating Agent</h1>
                <p className="text-slate-400 text-sm font-medium">Draft, review, and sync test cases with AI precision.</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
               {['fetch', 'generate', 'review', 'upload'].map((tab, idx) => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {idx + 1}. {tab}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {/* Tab 1: Fetch Requirements */}
            {activeTab === 'fetch' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Source Selector */}
                <div className="flex justify-center mb-8">
                  <div className="bg-slate-100 p-1 rounded-2xl flex space-x-1 border border-slate-200">
                    <button 
                      onClick={() => setReqSource('jira')}
                      className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${reqSource === 'jira' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Source: JIRA
                    </button>
                    <button 
                      onClick={() => setReqSource('rally')}
                      className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${reqSource === 'rally' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Source: RALLY
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reqSource === 'jira' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Project Key</label>
                        <input 
                          type="text" 
                          value={projectKey} 
                          onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                          className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:bg-white transition-all font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Issue Type</label>
                        <select 
                          value={issueType}
                          onChange={(e) => setIssueType(e.target.value)}
                          className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none cursor-pointer"
                        >
                          <option>Story</option>
                          <option>Bug</option>
                          <option>Task</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Status Filter</label>
                        <input 
                          type="text" 
                          placeholder="e.g. In Progress"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rally Formatted ID (e.g. US31488)</label>
                      <input 
                        type="text" 
                        placeholder={`Search by ID or custom query (FormattedID = "US31488")`}
                        value={jqlQuery || projectKey}
                        onChange={(e) => setJqlQuery(e.target.value)}
                        className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                  
                  {reqSource === 'jira' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Custom JQL (Advanced)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. assignee = currentUser()"
                        value={jqlQuery}
                        onChange={(e) => setJqlQuery(e.target.value)}
                        className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-4">
                  <button 
                    onClick={handleFetchRequirements}
                    disabled={fetching}
                    className="px-12 h-14 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all flex items-center space-x-3 shadow-xl"
                  >
                    {fetching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                    <span>Fetch Requirements</span>
                  </button>
                </div>

                {fetchedIssues.length > 0 && (
                  <div className="pt-8">
                    <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center space-x-2">
                      <FileCheck size={18} className="text-emerald-500" />
                      <span>SELECT A REQUIREMENT TO CONTINUE</span>
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
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{issue.issueType}</span>
                            {selectedIssue?.key === issue.key && <CheckCircle2 className="text-emerald-500" size={20} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Generate Test Cases */}
            {activeTab === 'generate' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                  <div className="flex items-start space-x-4">
                    <div className="mt-1"><AlertCircle className="text-emerald-600" size={24} /></div>
                    <div>
                      <h3 className="font-black text-emerald-900">Step 2: Analysis & Configuration</h3>
                      <p className="text-emerald-700 text-sm mt-1">Configure the AI settings and add any specific instructions for test case generation.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selected Requirement</label>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700">
                      {selectedIssue ? `${selectedIssue.key}: ${selectedIssue.title}` : 'No requirement selected — go back to Fetch'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select AI Model</label>
                    <select 
                      value={selectedLlmId}
                      onChange={(e) => setSelectedLlmId(e.target.value)}
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none"
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
                      placeholder="e.g. Include 5 positive cases, 3 negative cases, and focus on boundary value analysis for date fields."
                      className="w-full h-40 p-5 bg-white border-2 border-emerald-500 rounded-2xl font-medium outline-none focus:ring-4 focus:ring-emerald-50"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button 
                      onClick={handleGenerateCases}
                      disabled={generating || !selectedIssue}
                      className="px-16 h-16 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all flex items-center space-x-3 shadow-xl shadow-emerald-200 disabled:opacity-50"
                    >
                      {generating ? <RefreshCw className="animate-spin" size={24} /> : <Zap size={24} className="fill-current" />}
                      <span>{generating ? 'Engine is Working...' : 'Generate Test Cases'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Review & Select */}
            {activeTab === 'review' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-900">Review Generated Cases ({generatedTestCases.length})</h2>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-all font-bold text-xs">
                      <FileUp size={16} />
                      <span>Import JSON</span>
                      <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </label>
                    <button 
                      onClick={handleExport}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all font-bold text-xs text-emerald-700"
                    >
                      <FileDown size={16} />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {generatedTestCases.length === 0 ? (
                    <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                      <p className="text-slate-400 font-bold">No test cases generated yet. Use the Generate tab!</p>
                    </div>
                  ) : (
                    generatedTestCases.map((tc, idx) => (
                      <div key={tc.id} className="bg-white border-2 border-slate-50 rounded-2xl overflow-hidden group hover:border-emerald-200 transition-all">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <span className="text-xs font-black text-slate-400">{tc.caseId}</span>
                             <h4 className="font-black text-slate-800">{tc.title}</h4>
                           </div>
                           <div className="flex items-center space-x-2">
                             <span className="px-2 py-1 bg-white border border-slate-200 text-[10px] font-black rounded uppercase text-slate-500">{tc.priority}</span>
                             <button 
                              onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                             >
                               {editingIndex === idx ? <X size={18} /> : <Edit3 size={18} />}
                             </button>
                           </div>
                        </div>
                        <div className="p-6 space-y-4">
                          {editingIndex === idx ? (
                             <div className="space-y-4">
                               <input 
                                value={tc.title}
                                onChange={(e) => {
                                  const newList = [...generatedTestCases];
                                  newList[idx].title = e.target.value;
                                  setGeneratedTestCases(newList);
                                }}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                               />
                               <textarea 
                                value={JSON.stringify(tc.steps, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const newList = [...generatedTestCases];
                                    newList[idx].steps = JSON.parse(e.target.value);
                                    setGeneratedTestCases(newList);
                                  } catch {}
                                }}
                                className="w-full h-40 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl"
                               />
                               <div className="flex justify-end">
                                 <button onClick={() => setEditingIndex(null)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-black flex items-center space-x-2">
                                   <Save size={16} /> <span>Save Changes</span>
                                 </button>
                               </div>
                             </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div>
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Preconditions</h5>
                                 <ul className="space-y-1">
                                   {tc.preconditions.map((p, i) => <li key={i} className="text-sm font-medium text-slate-600 flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> <span>{p}</span></li>)}
                                 </ul>
                               </div>
                               <div>
                                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Steps & Expected Results</h5>
                                 <div className="space-y-3">
                                   {tc.steps.map((s, i) => (
                                     <div key={i} className="text-xs p-3 bg-slate-50 rounded-lg border border-slate-100">
                                       <p className="font-black text-slate-800">Step {i+1}: {s.action}</p>
                                       <p className="text-emerald-600 font-bold mt-1">Expected: {s.expectedResult}</p>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Upload to Rally */}
            {activeTab === 'upload' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto py-12 text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600 border-2 border-blue-100 shadow-inner">
                  <Database size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900">Synchronize to Rally</h2>
                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                  Ready to move your test cases into production? <br />
                  We'll sync {generatedTestCases.length} verified test cases directly to your Rally workspace.
                </p>

                <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-400 text-xs">TARGET WORKSPACE</span>
                    <span className="font-bold text-slate-700 italic">Testing Buddy AI Dev</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-400 text-xs">ASSOCIATED STORY</span>
                    <span className="font-bold text-slate-700">{selectedIssue?.key || 'None Selected'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-400 text-xs">DATA FORMAT</span>
                    <span className="font-bold text-slate-700">Enterprise XML / JSON Integration</span>
                  </div>
                </div>

                {syncResult && (
                  <div className={`p-6 rounded-2xl border-2 animate-in zoom-in-95 duration-300 ${syncResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <div className="flex items-center space-x-3 mb-2">
                      {syncResult.success ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                      <h4 className="font-black text-lg">{syncResult.success ? 'Upload Successful' : 'Upload Failed'}</h4>
                    </div>
                    <p className="font-bold">{syncResult.message}</p>
                    {syncResult.errors && syncResult.errors.length > 0 && (
                      <div className="mt-4 text-left p-4 bg-white/50 rounded-xl space-y-2">
                        <p className="text-xs font-black uppercase tracking-widest text-red-400">Error Details:</p>
                        {syncResult.errors.map((err, i) => <p key={i} className="text-sm font-medium text-red-600">• {err}</p>)}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6">
                   <button 
                    onClick={handleUploadToRally}
                    disabled={uploading || generatedTestCases.length === 0}
                    className="w-full h-20 bg-[#0ea5e9] text-white rounded-3xl font-black text-xl hover:bg-[#0284c7] transition-all flex items-center justify-center space-x-4 shadow-2xl shadow-blue-200 disabled:opacity-50"
                   >
                     {uploading ? <Loader className="animate-spin" size={28} /> : <Upload size={28} />}
                     <span>{uploading ? 'Syncing with Rally Cloud...' : 'Confirm Upload to Rally'}</span>
                   </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button 
              onClick={() => {
                if (activeTab === 'upload') setActiveTab('review');
                else if (activeTab === 'review') setActiveTab('generate');
                else if (activeTab === 'generate') setActiveTab('fetch');
              }}
              disabled={activeTab === 'fetch'}
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous Step
            </button>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className={`w-2 h-2 rounded-full ${activeTab === ['fetch', 'generate', 'review', 'upload'][n-1] ? 'w-8 bg-emerald-500' : 'bg-slate-300'} transition-all`} />
              ))}
            </div>
            <button 
              onClick={() => {
                if (activeTab === 'fetch') setActiveTab('generate');
                else if (activeTab === 'generate') setActiveTab('review');
                else if (activeTab === 'review') setActiveTab('upload');
              }}
              disabled={activeTab === 'upload' || (activeTab === 'fetch' && !selectedIssue) || (activeTab === 'generate' && generatedTestCases.length === 0)}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 disabled:opacity-30 flex items-center space-x-2"
            >
              <span>Next Step</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestCaseGenerator
