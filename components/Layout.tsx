'use client';

import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomBar from './BottomBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1 pt-16 pb-14">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-10 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <BottomBar />
    </div>
  );
}
