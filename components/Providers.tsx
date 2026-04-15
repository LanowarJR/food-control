'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import TerminalSelector from './TerminalSelector';

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
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleSelectTerminal = (terminal: Terminal | null) => {
    setActiveTerminal(terminal);
    setTerminalId(terminal?.id || null);
    if (terminal) {
      localStorage.setItem('active_terminal_id', terminal.id);
    } else {
      localStorage.removeItem('active_terminal_id');
    }
  };

  async function loadProfileAndTerminal(userId: string, role?: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('terminal_id, role')
        .eq('id', userId)
        .single();

      if (!profile) return;

      const resolvedRole = role || profile.role;
      setUserRole(resolvedRole);

      const storedTerminalId = typeof window !== 'undefined'
        ? localStorage.getItem('active_terminal_id')
        : null;

      const targetId = resolvedRole === 'super_admin'
        ? (storedTerminalId || null)
        : profile.terminal_id;

      if (targetId) {
        const { data: terminalData } = await supabase
          .from('terminals')
          .select('*')
          .eq('id', targetId)
          .single();

        if (terminalData) {
          setActiveTerminal(terminalData);
          setTerminalId(terminalData.id);
        }
      }
    } catch (err) {
      console.error('Providers: Erro ao carregar perfil:', err);
    }
  }

  useEffect(() => {
    // Usa APENAS o onAuthStateChange como fonte de verdade.
    // O INITIAL_SESSION é disparado imediatamente com a sessão atual (ou null).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Providers: Evento:', event, '| Sessão:', !!currentSession);

        if (event === 'INITIAL_SESSION') {
          // Este evento é disparado uma única vez ao montar o componente
          setSession(currentSession);

          if (currentSession) {
            await loadProfileAndTerminal(currentSession.user.id);
          }

          // Independente de ter sessão ou não, desbloqueia a UI
          setAuthLoading(false);
          console.log('Providers: UI desbloqueada.');
          return;
        }

        if (event === 'SIGNED_IN' && currentSession) {
          setSession(currentSession);
          await loadProfileAndTerminal(currentSession.user.id);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUserRole(null);
          setActiveTerminal(null);
          setTerminalId(null);
          router.replace('/login');
          return;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redireciona para login se a UI desbloqueou e não há sessão
  useEffect(() => {
    if (!authLoading && !session && pathname !== '/login') {
      router.replace('/login');
    }
  }, [authLoading, session, pathname, router]);

  // Tela de carregamento inicial
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-20" />
      </div>
    );
  }

  // Aguardando redirecionamento para login
  if (!session && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-20" />
      </div>
    );
  }

  // Super admin sem terminal selecionado
  if (session && userRole === 'super_admin' && !terminalId && pathname !== '/login') {
    return (
      <TerminalContext.Provider value={{ terminalId, activeTerminal, loading: false, userRole, session, setTerminalId: handleSelectTerminal }}>
        <TerminalSelector onSelect={handleSelectTerminal} />
      </TerminalContext.Provider>
    );
  }

  return (
    <TerminalContext.Provider value={{ terminalId, activeTerminal, loading: false, userRole, session, setTerminalId: handleSelectTerminal }}>
      {children}
    </TerminalContext.Provider>
  );
}
