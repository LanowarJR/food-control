'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import TerminalSelector from './TerminalSelector';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

// Context for Terminal
interface Terminal {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface TerminalContextType {
  terminalId: string | null;
  activeTerminal: Terminal | null;
  loading: boolean;
  userRole: string | null;
  setTerminalId: (terminal: Terminal | null) => void;
}

const TerminalContext = createContext<TerminalContextType>({
  terminalId: null,
  activeTerminal: null,
  loading: true,
  userRole: null,
  setTerminalId: () => {},
});

export const useTerminal = () => useContext(TerminalContext);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [activeTerminal, setActiveTerminal] = useState<Terminal | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleSelectTerminal = (terminal: Terminal | null) => {
    setActiveTerminal(terminal);
    setTerminalId(terminal?.id || null);
    if (terminal) {
      localStorage.setItem('active_terminal_id', terminal.id);
    } else {
      localStorage.removeItem('active_terminal_id');
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const initialSession = data?.session;
        setSession(initialSession);
        
        if (initialSession) {
          // 1. Fetch profile for role
          const { data: profile } = await supabase
            .from('profiles')
            .select('terminal_id, role')
            .eq('id', initialSession.user.id)
            .single();

          if (profile) {
            setUserRole(profile.role);
            
            // 2. Handle Terminal Selection
            const storedTerminalId = localStorage.getItem('active_terminal_id');
            const targetId = profile.role === 'super_admin' ? (storedTerminalId || null) : profile.terminal_id;
            
            if (targetId) {
              const { data: terminalData } = await supabase
                .from('terminals')
                .select('*')
                .eq('id', targetId)
                .single();
              
              if (terminalData) {
                setActiveTerminal(terminalData);
                setTerminalId(terminalData.id);
              } else if (profile.role !== 'super_admin') {
                 // If not super_admin and terminal not found (unlikely), use profile ID anyway as fallback for filters
                 setTerminalId(profile.terminal_id);
              }
            }
          }
        } else if (pathname !== '/login') {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session/Profile error:', err);
        if (pathname !== '/login') {
          router.push('/login');
        }
      } finally {
        setAuthLoading(false);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('terminal_id, role')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          if (profile.role !== 'super_admin') {
             const { data: tData } = await supabase.from('terminals').select('*').eq('id', profile.terminal_id).single();
             if (tData) {
                setActiveTerminal(tData);
                setTerminalId(tData.id);
             }
          }
        }
      } else if (pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-20" />
      </div>
    );
  }

  // Se não estiver logado e não estiver na página de login, não renderiza nada (o useEffect vai redirecionar)
  if (!session && pathname !== '/login') {
    return null;
  }

  // Se for a página de login, renderiza apenas o conteúdo sem casca do Layout
  if (pathname === '/login') {
    return (
      <TerminalContext.Provider value={{ terminalId, activeTerminal, loading, userRole, setTerminalId: handleSelectTerminal }}>
        {children}
      </TerminalContext.Provider>
    );
  }

  // Se for super_admin e não tiver terminal selecionado, mostra o seletor
  if (userRole === 'super_admin' && !terminalId) {
    return (
      <TerminalContext.Provider value={{ terminalId, activeTerminal, loading, userRole, setTerminalId: handleSelectTerminal }}>
        <TerminalSelector onSelect={handleSelectTerminal} />
      </TerminalContext.Provider>
    );
  }

  return (
    <TerminalContext.Provider value={{ terminalId, activeTerminal, loading, userRole, setTerminalId: handleSelectTerminal }}>
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
    </TerminalContext.Provider>
  );
}
