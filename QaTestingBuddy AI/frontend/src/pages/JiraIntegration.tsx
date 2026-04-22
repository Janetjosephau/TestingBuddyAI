import React, { useState, useEffect } from 'react'
import { Save, TestTube, Edit2, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react'
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTestConnection = async () => {
    if (!formData.instanceUrl || !formData.email || !formData.apiToken || !formData.projectKey) {
      toast.error('Please fill in all required fields')
      return
    }

    setTesting(true)
    try {
      const response = await jiraApi.testConnection(formData)
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
    if (!formData.instanceUrl || !formData.email || !formData.apiToken || !formData.projectKey) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        toast.error('Updates currently not fully tracked via API. Doing save instead.')
      }

      await jiraApi.saveConfig(formData)
      toast.success('Jira Connection Saved')
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
      apiToken: '', // Prevent revealing token
      projectKey: config.projectKey
    })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      // NOTE: backend API needs delete Jira Endpoint to truly link this
      toast.error('Jira deleting not implemented yet!')
    }
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Jira Integration</h1>
          <p className="text-gray-600 mt-2">Connect to Jira Cloud and fetch requirements for test generation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Edit Configuration' : 'New Configuration'}
              </h2>

              <div className="space-y-6">
                {/* Instance URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Instance URL *
                  </label>
                  <input
                    type="text"
                    name="instanceUrl"
                    value={formData.instanceUrl}
                    onChange={handleInputChange}
                    placeholder="https://your-domain.atlassian.net"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your-email@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* API Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Token *
                  </label>
                  <input
                    type="password"
                    name="apiToken"
                    value={formData.apiToken}
                    onChange={handleInputChange}
                    placeholder="ATATT..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generate at: https://id.atlassian.com/manage-profile/security/api-tokens
                  </p>
                </div>

                {/* Project Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Key *
                  </label>
                  <input
                    type="text"
                    name="projectKey"
                    value={formData.projectKey}
                    onChange={handleInputChange}
                    placeholder="e.g., TEST, AUTH, PROJ"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Action Buttons */}
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

          {/* Saved Configurations */}
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
                          <h3 className="font-semibold text-gray-900">{config.projectName || config.projectKey}</h3>
                          <p className="text-sm text-gray-600">{config.projectKey}</p>
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

export default JiraIntegration
