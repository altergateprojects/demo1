import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import useUIStore from '../../store/uiStore'

const Layout = ({ children }) => {
  const { sidebarCollapsed, sidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Topbar */}
        <Topbar />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-screen-2xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout