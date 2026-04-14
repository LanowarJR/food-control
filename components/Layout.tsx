'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session;
        setSession(initialSession);
        
        if (!initialSession && pathname !== '/login') {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session error:', err);
        if (pathname !== '/login') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
      </div>
    );
  }

  // Se não estiver logado e não estiver na página de login, não renderiza nada (o useEffect vai redirecionar)
  if (!session && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
      </div>
    );
  }

  // Se for a página de login, renderiza apenas o conteúdo sem casca do Layout
  if (pathname === '/login') {
    return <>{children}</>;
  }

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
