import React, { useState, useEffect } from 'react'
import { Save, TestTube, Edit2, Trash2, CheckCircle, AlertCircle, Loader, Database, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { jiraApi } from '../services/api'

interface JiraConfig {
  id: string
  instanceUrl: string
  email: string
  projectKey: string
  projectName?: string
  testStatus: 'untested' | 'connected' | 'failed'
  lastTestedAt?: string
  testError?: string
}

const JiraIntegration: React.FC = () => {
  const [configs, setConfigs] = useState<JiraConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const [formData, setFormData] = useState({
    instanceUrl: '',
    email: '',
    apiToken: '',
    projectKey: ''
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const res = await jiraApi.getConfigs()
      setConfigs(res.data)
    } catch (error) {
      toast.error('Failed to fetch Jira configurations')
    }
  }

  const handleTestConnection = async () => {
    if (!formData.instanceUrl || !formData.email || !formData.apiToken) {
      toast.error('Please fill in all required fields')
      return
    }

    setTesting(true)
    try {
      const response = await jiraApi.testConnection({
        ...formData,
        projectKey: formData.projectKey || 'DUMMY'
      })
      if (response.data?.success || response.data?.status === 'connected') {
        toast.success(response.data?.message || 'Connection Successful')
      } else {
        toast.error(response.data?.message || 'Connection failed')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Connection failed. Please check your credentials.')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!formData.instanceUrl || !formData.email || !formData.apiToken) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await jiraApi.saveConfig(formData)
      toast.success(response.data.message || 'Jira Connection Saved')
      await fetchConfigs()
      resetForm()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: JiraConfig) => {
    setEditingId(config.id)
    setFormData({
      instanceUrl: config.instanceUrl,
      email: config.email || '',
      apiToken: '',
      projectKey: config.projectKey
    })
  }

  const resetForm = () => {
    setFormData({
      instanceUrl: '',
      email: '',
      apiToken: '',
      projectKey: ''
    })
    setEditingId(null)
  }

  const getStatusBadge = (status: string) => {
    if (status === 'connected') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1" /> Connected</span>
    }
    if (status === 'failed') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><AlertCircle size={14} className="mr-1" /> Failed</span>
    }
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">Untested</span>
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-12">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Database size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">JIRA Connection</h1>
              <p className="text-slate-500 mt-1 font-medium text-lg">Configure your Jira Server or Cloud instance for test planning.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Provider */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Provider</label>
              <div className="relative">
                <select
                  name="provider"
                  className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                >
                  <option value="jira">Jira</option>
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Email Address (Optional for Server)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="e.g., lucky1985.mayank@gmail.com"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* URL */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">URL</label>
              <input
                type="text"
                name="instanceUrl"
                value={formData.instanceUrl}
                onChange={(e) => setFormData({...formData, instanceUrl: e.target.value})}
                placeholder="https://lucky1985mayankmishra.atlassian.net/"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Access Token */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Access Token (API Token)</label>
              <input
                type="password"
                name="apiToken"
                value={formData.apiToken}
                onChange={(e) => setFormData({...formData, apiToken: e.target.value})}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-6 pt-6">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-10 h-14 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {testing ? 'Checking...' : 'Test Connection'}
              </button>
              <button
                onClick={handleSaveConfiguration}
                disabled={loading}
                className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center space-x-3"
              >
                <Save size={20} />
                <span>Save Connection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saved Configurations */}
        {configs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6 px-4">Saved Configurations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {configs.map(config => (
                <div key={config.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-[#0f172a]">{config.projectName || config.projectKey}</h3>
                      <p className="text-sm text-slate-500">{config.instanceUrl}</p>
                    </div>
                    <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(config)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(config.testStatus)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JiraIntegration
