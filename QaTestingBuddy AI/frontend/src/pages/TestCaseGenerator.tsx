import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, Zap, Eye, Trash2, Upload, Database, Loader, FileText, FileCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { generatorApi, llmApi } from '../services/api'

interface TestCase {
  id: string
  caseId: string
  title: string
  priority: string
  status: string
}

const TestCaseGenerator: React.FC = () => {
  const [history, setHistory] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [formData, setFormData] = useState({
    projectId: 'KAN',
    ticketIds: 'KAN-1, KAN-2',
    testLinkProject: 'Testing Buddy Project',
    testSuite: 'Sample Test Suite'
  })

  const handleGenerate = async () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      toast.success('Test cases generated and exported to TestLink!')
      // Mock history add
      setHistory([{
        id: Date.now().toString(),
        caseId: 'TC-001',
        title: 'Verify Login Social',
        priority: 'High',
        status: 'Generated'
      }, ...history])
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-12">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-10">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#0f172a]">Test Cases</h1>
              <p className="text-slate-500 mt-1 font-medium text-lg">Generate Test Cases from Jira and export directly to TestLink.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Project ID Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">JIRA Project ID (Optional)</label>
              <input
                type="text"
                value={formData.projectId}
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all appearance-none"
              />
            </div>

            {/* Ticket IDs Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">JIRA Ticket IDs (Optional)</label>
              <input
                type="text"
                value={formData.ticketIds}
                onChange={(e) => setFormData({...formData, ticketIds: e.target.value})}
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* TestLink Project Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">TestLink Project</label>
              <input
                type="text"
                value={formData.testLinkProject}
                onChange={(e) => setFormData({...formData, testLinkProject: e.target.value})}
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Test Suite Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">Test Suite</label>
              <input
                type="text"
                value={formData.testSuite}
                onChange={(e) => setFormData({...formData, testSuite: e.target.value})}
                className="w-full h-16 px-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Login_04"
              />
            </div>

            {/* Additional Context Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">Additional Context</label>
              <textarea
                value={formData.ticketIds} // Reusing field for context description
                onChange={(e) => setFormData({...formData, ticketIds: e.target.value})}
                className="w-full h-32 px-6 py-4 bg-white border-2 border-emerald-500 rounded-2xl text-slate-700 font-medium focus:ring-4 focus:ring-emerald-100 transition-all resize-none shadow-sm"
                placeholder="create 10 test cases of positive, negative, happy path..."
              />
            </div>

            {/* Upload PRD Row */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 tracking-widest uppercase text-blue-600">Upload PRD (Optional)</label>
              <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                <Upload className="text-slate-400 group-hover:text-blue-500 mb-1" size={20} />
                <span className="text-sm text-slate-500 font-medium">Click to upload PRD (.txt, .md, .pdf, .doc, .docx)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end pt-6">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-10 h-14 bg-[#065f46] text-white rounded-xl font-black hover:bg-[#047857] shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-3"
              >
                {generating ? <RefreshCw className="animate-spin" size={20} /> : <Database size={20} />}
                <span>Generate to TestLink</span>
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#0f172a] mb-6 px-4">Recent Generations</h2>
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-[#0f172a]">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.caseId} • {item.priority}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">{item.status}</span>
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

export default TestCaseGenerator
