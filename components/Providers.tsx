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
    let isMounted = true;
    
    // 1. Initial Check
    async function initSession() {
      console.log('Providers: Iniciando verificação de sessão...');
      
      // Timeout de segurança de 8 segundos para não travar a UI se o Supabase demorar
      const timeout = setTimeout(() => {
        if (isMounted && authLoading) {
          console.warn('Providers: Verificação de sessão excedeu o tempo limite. Desbloqueando UI...');
          setAuthLoading(false);
          setLoading(false);
        }
      }, 8000);

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const initialSession = data?.session;
        console.log('Providers: Sessão encontrada:', !!initialSession);
        
        if (isMounted) setSession(initialSession);
        
        if (initialSession) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('terminal_id, role')
            .eq('id', initialSession.user.id)
            .single();

          if (profileError) {
             console.warn('Providers: Erro ao buscar perfil:', profileError.message);
          }

          if (profile && isMounted) {
            console.log('Providers: Perfil encontrado, role:', profile.role);
            setUserRole(profile.role);
            
            const storedTerminalId = typeof window !== 'undefined' ? localStorage.getItem('active_terminal_id') : null;
            const targetId = profile.role === 'super_admin' ? (storedTerminalId || null) : profile.terminal_id;
            
            if (targetId) {
              const { data: terminalData } = await supabase
                .from('terminals')
                .select('*')
                .eq('id', targetId)
                .single();
              
              if (terminalData && isMounted) {
                setActiveTerminal(terminalData);
                setTerminalId(terminalData.id);
              } else if (profile.role !== 'super_admin' && isMounted) {
                 setTerminalId(profile.terminal_id);
              }
            }
          }
        } else {
          console.log('Providers: Sem sessão ativa.');
        }
      } catch (err) {
        console.error('Providers: Falha na inicialização:', err);
      } finally {
        clearTimeout(timeout);
        if (isMounted) {
          setAuthLoading(false);
          setLoading(false);
          console.log('Providers: Carregamento de autenticação finalizado.');
        }
      }
    }

    initSession();

    // 2. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Providers: Evento de Auth:', event);
      if (isMounted) setSession(currentSession);
      
      if (currentSession && isMounted) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('terminal_id, role')
          .eq('id', currentSession.user.id)
          .single();
        
        if (profile && isMounted) {
          setUserRole(profile.role);
          if (profile.role !== 'super_admin') {
             const { data: tData } = await supabase.from('terminals').select('*').eq('id', profile.terminal_id).single();
             if (tData && isMounted) {
                setActiveTerminal(tData);
                setTerminalId(tData.id);
             }
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

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
