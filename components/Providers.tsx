'use client';

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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
  // hasSession: null = ainda não sabemos, true = tem sessão, false = definitivamente sem sessão
  const hasSessionRef = useRef<boolean | null>(null);
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

  async function loadProfileAndTerminal(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('terminal_id, role')
        .eq('id', userId)
        .single();

      if (!profile) return;

      setUserRole(profile.role);

      const storedTerminalId = typeof window !== 'undefined'
        ? localStorage.getItem('active_terminal_id')
        : null;

      const targetId = profile.role === 'super_admin'
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
    // Fallback: Se após 10s ainda não tivermos uma resposta definitiva,
    // desbloqueia a UI de qualquer forma
    const globalTimeout = setTimeout(() => {
      console.warn('Providers: Timeout global atingido. Desbloqueando UI.');
      setAuthLoading(false);
    }, 10000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Providers: Evento:', event, '| Sessão:', !!currentSession);

        if (event === 'INITIAL_SESSION') {
          if (currentSession) {
            // Tem sessão imediatamente — caminho normal
            hasSessionRef.current = true;
            setSession(currentSession);
            await loadProfileAndTerminal(currentSession.user.id);
            clearTimeout(globalTimeout);
            setAuthLoading(false);
          } else {
            // Sem sessão no INITIAL_SESSION — pode ser que o SIGNED_IN chegue logo
            // Aguardamos 3s antes de decidir fazer redirect
            hasSessionRef.current = false;
            setTimeout(() => {
              if (hasSessionRef.current === false) {
                // Após 3s ainda sem sessão: definitivamente não logado
                clearTimeout(globalTimeout);
                setAuthLoading(false);
              }
            }, 3000);
          }
          return;
        }

        if (event === 'SIGNED_IN' && currentSession) {
          // Sessão chegou (pode ter sido após INITIAL_SESSION null no Vercel)
          hasSessionRef.current = true;
          setSession(currentSession);
          await loadProfileAndTerminal(currentSession.user.id);
          clearTimeout(globalTimeout);
          setAuthLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          hasSessionRef.current = false;
          setSession(null);
          setUserRole(null);
          setActiveTerminal(null);
          setTerminalId(null);
          clearTimeout(globalTimeout);
          setAuthLoading(false);
          router.replace('/login');
          return;
        }
      }
    );

    return () => {
      clearTimeout(globalTimeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redireciona para login somente quando a UI desbloqueou e não há sessão
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
