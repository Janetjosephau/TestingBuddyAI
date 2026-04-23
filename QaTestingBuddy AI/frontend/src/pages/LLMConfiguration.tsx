import React, { useState, useEffect } from 'react'
import { Save, TestTube, Edit2, Trash2, CheckCircle, AlertCircle, Loader, Settings, ChevronDown, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { llmApi } from '../services/api'

interface LLMConfig {
  id: string
  provider: string
  name: string
  model: string
  temperature: number
  maxTokens: number
  testStatus: 'untested' | 'connected' | 'failed'
  lastTestedAt?: string
  testError?: string
}

const LLMConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  const [formData, setFormData] = useState({
    provider: 'ollama',
    name: '',
    apiKey: '',
    apiUrl: 'http://localhost:11434',
    model: 'llama2',
    temperature: 0.7,
    maxTokens: 2048
  })

  const providers = [
    {
      name: 'ollama',
      label: 'Ollama (Self-Hosted)',
      models: ['llama3', 'llama2', 'mistral', 'neural-chat'],
      requiresUrl: true
    },
    {
      name: 'gemini',
      label: 'Google Gemini',
      models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
      requiresUrl: false
    },
    {
      name: 'openai',
      label: 'OpenAI',
      models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      requiresUrl: false
    }
  ]

  const selectedProvider = providers.find(p => p.name === formData.provider)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await llmApi.getConfigs()
      setConfigs(response.data)
    } catch (error) {
      toast.error('Failed to load configurations')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'temperature' || name === 'maxTokens' ? parseFloat(value) : value
    }))
  }

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value
    setFormData(prev => ({
      ...prev,
      provider,
      model: providers.find(p => p.name === provider)?.models[0] || ''
    }))
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      // Create a copy of formData without the 'name' property for testing
      const { name, ...testData } = formData
      const response = await llmApi.testConnection(testData)
      
      if (response.data?.status === 'connected' || response.data?.success) {
        toast.success(response.data.message || 'Connection Successful')
      } else {
        toast.error(response.data.message || 'Connection failed')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Connection failed. Please check your credentials.')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConfiguration = async () => {
    if (!formData.name) {
      toast.error('Please fill in configuration name')
      return
    }

    setLoading(true)
    try {
      const response = await llmApi.saveConfig(formData)
      toast.success(response.data.message || (editingId ? 'Configuration Updated' : 'Configuration Saved'))
      
      await fetchConfigs()
      resetForm()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (config: LLMConfig) => {
    setEditingId(config.id)
    setFormData({
      provider: 'ollama',
      name: config.name,
      apiKey: '',
      apiUrl: 'http://localhost:11434',
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        await llmApi.deleteConfig(id)
        toast.success('Configuration Deleted')
        await fetchConfigs()
      } catch (error) {
        toast.error('Failed to delete configuration')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      provider: 'ollama',
      name: '',
      apiKey: '',
      apiUrl: 'http://localhost:11434',
      model: 'llama2',
      temperature: 0.7,
      maxTokens: 2048
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
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-10 pb-0 flex items-start space-x-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">LLM Configuration</h1>
              <p className="text-slate-500 mt-1 font-medium">Configure your AI Provider for generating test plans and cases.</p>
            </div>
          </div>

          <div className="p-12 space-y-10">
            {/* Configuration Name */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Configuration Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. My Primary GPT-4 / Local Ollama"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Top Row: Provider & Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Provider</label>
                <div className="relative">
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                  >
                    <option value="groq">Groq</option>
                    <option value="ollama">Ollama</option>
                    <option value="gemini">Gemini</option>
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Model ID</label>
                  {formData.provider === 'ollama' && (
                    <button 
                      onClick={handleTestConnection}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-tight flex items-center gap-1"
                    >
                      <RefreshCw size={12} className={testing ? 'animate-spin' : ''} /> Fetch Models
                    </button>
                  )}
                  <button className="text-[11px] font-bold text-purple-600 hover:text-purple-700 uppercase tracking-tight flex items-center gap-1">
                    <Edit2 size={12} /> Custom Model
                  </button>
                </div>
                <div className="relative">
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
                  >
                    {selectedProvider?.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* API URL Row (Shown for Ollama) */}
            {selectedProvider?.requiresUrl && (
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">API Instance URL (Ollama Endpoint)</label>
                <input
                  type="text"
                  name="apiUrl"
                  value={formData.apiUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. http://localhost:11434"
                  className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            )}

            {/* API Key Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase">API Key / Token (Leave blank for Ollama)</label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleInputChange}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-medium focus:border-blue-500 focus:bg-white transition-all"
              />
              <p className="text-[10px] text-slate-400 italic font-medium px-2">Your API key is stored securely in the database.</p>
            </div>

            {/* Action Row */}
            <div className="flex items-center space-x-6 pt-6">
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1 h-14 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black hover:bg-slate-50 transition-all disabled:opacity-50"
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
      </div>
    </div>
  )
}

export default LLMConfiguration
