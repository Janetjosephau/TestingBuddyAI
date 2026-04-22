import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  Settings,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X
} from 'lucide-react'

interface SidebarItem {
  label: string
  icon?: React.ReactNode
  path?: string
  children?: SidebarItem[]
}

const Sidebar: React.FC = () => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>('Connections')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const isActive = (path?: string) => {
    return path && location.pathname === path
  }

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label)
  }

  const sidebarItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      icon: <BarChart3 size={20} />,
      path: '/'
    },
    {
      label: 'Connections',
      icon: <Settings size={20} />,
      children: [
        { label: 'LLM Configuration', path: '/connections/llm' },
        { label: 'Jira Integration', path: '/connections/jira' }
      ]
    },
    {
      label: 'Generator',
      icon: <FileText size={20} />,
      children: [
        { label: 'Test Plan', path: '/generator/test-plan' },
        { label: 'Test Case', path: '/generator/test-case' }
      ]
    },
    {
      label: 'Reports & Analytics',
      icon: <BarChart3 size={20} />,
      path: '/reports'
    }
  ]

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 w-64 bg-gray-900 text-white h-screen shadow-lg flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-blue-400">TestBuddy AI</h1>
          <p className="text-xs text-gray-400 mt-1">Test Generation Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-4">
            {sidebarItems.map((item) => (
              <li key={item.label}>
                {item.path ? (
                  // Single item
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {item.icon && <span>{item.icon}</span>}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ) : (
                  // Expandable menu
                  <>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon && <span>{item.icon}</span>}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          expandedMenu === item.label ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Submenu */}
                    {expandedMenu === item.label && item.children && (
                      <ul className="mt-2 space-y-1 pl-8 border-l border-gray-700">
                        {item.children.map((child) => (
                          <li key={child.label}>
                            <Link
                              to={child.path!}
                              onClick={() => setSidebarOpen(false)}
                              className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                                isActive(child.path)
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
