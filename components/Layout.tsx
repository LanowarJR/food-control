'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomBar from './BottomBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopBar toggleMobileMenu={toggleSidebar} />
      
      <div className="flex flex-1 pt-16 pb-14 relative overflow-hidden">
        {/* Backdrop for Mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 z-20 md:hidden animate-in fade-in duration-200"
            onClick={closeSidebar}
          />
        )}
        
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
        
        <main className="flex-1 md:ml-64 p-4 md:p-10 overflow-auto w-full">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      <BottomBar />
    </div>
  );
}
