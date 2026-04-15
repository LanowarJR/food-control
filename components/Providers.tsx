'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import TerminalSelector from './TerminalSelector';

// Context for Terminal
export interface Terminal {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

export interface TerminalContextType {
  terminalId: string | null;
  activeTerminal: Terminal | null;
  loading: boolean;
  userRole: string | null;
  session: any | null;
  setTerminalId: (terminal: Terminal | null) => void;
}

const TerminalContext = createContext<TerminalContextType>({
  terminalId: null,
  activeTerminal: null,
  loading: true,
  userRole: null,
  session: null,
  setTerminalId: () => {},
});

export const useTerminal = () => useContext(TerminalContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [activeTerminal, setActiveTerminal] = useState<Terminal | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
          const { data: profile } = await supabase
            .from('profiles')
            .select('terminal_id, role')
            .eq('id', initialSession.user.id)
            .single();

          if (profile) {
            setUserRole(profile.role);
            
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
                 setTerminalId(profile.terminal_id);
              }
            }
          }
        } else if (pathname !== '/login') {
          router.push('/login');
        }
      } catch (err) {
        console.error('Session/Profile error:', err);
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

  // Se não estiver logado e não estiver na página de login, o useEffect vai redirecionar
  if (!session && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-20" />
      </div>
    );
  }

  // Se for super_admin e não tiver terminal selecionado (e não for página de login)
  if (session && userRole === 'super_admin' && !terminalId && pathname !== '/login') {
    return (
      <TerminalContext.Provider value={{ terminalId, activeTerminal, loading, userRole, session, setTerminalId: handleSelectTerminal }}>
        <TerminalSelector onSelect={handleSelectTerminal} />
      </TerminalContext.Provider>
    );
  }

  return (
    <TerminalContext.Provider value={{ terminalId, activeTerminal, loading, userRole, session, setTerminalId: handleSelectTerminal }}>
      {children}
    </TerminalContext.Provider>
  );
}
