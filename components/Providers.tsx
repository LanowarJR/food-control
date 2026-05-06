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
  // authLoading: apenas bloqueia até saber se tem sessão ou não
  const [authLoading, setAuthLoading] = useState(true);
  // profileLoading: carrega perfil/terminal em background sem bloquear UI
  const [profileLoading, setProfileLoading] = useState(false);
  const loadedUserId = React.useRef<string | null>(null);
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
    setProfileLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('terminal_id, role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.warn('Providers: Sem perfil ou erro:', error?.message);
        // Se não conseguir buscar perfil, tenta usar super_admin como fallback
        // para não bloquear o app
        setUserRole('super_admin');
        return;
      }

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
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Providers: Evento:', event, '| Sessão:', !!currentSession);

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);

          // Desbloqueia a UI imediatamente — não espera o perfil carregar
          setAuthLoading(false);

          // Carrega perfil em background se logado e se for um usuário diferente do já carregado
          if (currentSession && loadedUserId.current !== currentSession.user.id) {
            loadedUserId.current = currentSession.user.id;
            loadProfileAndTerminal(currentSession.user.id);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUserRole(null);
          setActiveTerminal(null);
          setTerminalId(null);
          loadedUserId.current = null;
          setAuthLoading(false);
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

  // Redireciona para login somente quando a UI desbloqueou e não há sessão
  useEffect(() => {
    if (!authLoading && !session && pathname !== '/login') {
      router.replace('/login');
    }
  }, [authLoading, session, pathname, router]);

  // Tela de carregamento inicial (apenas até saber se tem sessão)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-20" />
      </div>
    );
  }

  // Sem sessão fora do login
  if (!session && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-20" />
      </div>
    );
  }

  // Super admin: aguardando perfil carregar para saber se precisa de seleção de terminal
  if (session && profileLoading && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-[#001a23] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin opacity-40" />
          <p className="text-teal-500/50 text-xs uppercase tracking-widest font-bold">Carregando perfil...</p>
        </div>
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
