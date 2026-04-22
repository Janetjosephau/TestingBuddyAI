import React, { useState, useEffect } from 'react'
import { Save, TestTube, Edit2, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react'
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
      models: ['llama2', 'mistral', 'neural-chat', 'llama3'],
      requiresUrl: true
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
      const response = await llmApi.testConnection(formData)
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
      if (editingId) {
        await llmApi.saveConfig(formData) 
        toast.success('Configuration Updated')
      } else {
        await llmApi.saveConfig(formData)
        toast.success('Configuration Saved')
      }
      
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">LLM Configuration</h1>
          <p className="text-gray-600 mt-2">Configure and manage your Ollama connection</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Configuration' : 'New Configuration'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configuration Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Local Llama 3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LLM Provider
                  </label>
                  <select
                    name="provider"
                    value={formData.provider}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
                  >
                    {providers.map(p => (
                      <option key={p.name} value={p.name}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key (Optional for Ollama)
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    placeholder="Leave empty or any string if none"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedProvider?.requiresUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API URL *
                    </label>
                    <input
                      type="text"
                      name="apiUrl"
                      value={formData.apiUrl}
                      onChange={handleInputChange}
                      placeholder="http://localhost:11434"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {selectedProvider?.models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {formData.temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    name="temperature"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower = more deterministic, Higher = more creative</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    name="maxTokens"
                    value={formData.maxTokens}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-yellow-300 font-medium transition-colors"
                  >
                    {testing ? <Loader size={18} className="animate-spin" /> : <TestTube size={18} />}
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    onClick={handleSaveConfiguration}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
                  >
                    {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                    {loading ? 'Saving...' : 'Save Configuration'}
                  </button>
                  {editingId && (
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Saved Configurations</h2>
              
              {configs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No configurations yet</p>
              ) : (
                <div className="space-y-3">
                  {configs.map(config => (
                    <div key={config.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{config.name}</h3>
                          <p className="text-sm text-gray-600">{config.provider} • {config.model}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(config)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        {getStatusBadge(config.testStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LLMConfiguration
