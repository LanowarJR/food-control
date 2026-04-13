'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  LogIn, 
  ChefHat, 
  AlertCircle,
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Se já estiver logado, redireciona direto
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
      setChecking(false);
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro de Autenticação Supabase:', error);
        if (error.message === 'Invalid login credentials') {
           setError('E-mail ou senha incorretos.');
        } else {
           setError(error.message);
        }
        return;
      }

      console.log('Login bem sucedido:', data.user?.email);
      router.push('/');
    } catch (err: any) {
      console.error('Erro inesperado no Login:', err);
      setError('Ocorreu um erro inesperado ao realizar o login.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 selection:bg-[#004354] selection:text-white">
      {/* Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#004354]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo/Brand Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-xl shadow-[#004354]/10 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-100 relative overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="FoodControl Logo" 
              fill 
              className="object-cover scale-150"
            />
          </div>
          <h1 className="text-4xl font-black text-[#111d23] tracking-tighter font-manrope">FoodControl</h1>
          <p className="text-slate-500 font-medium mt-2">Gestão diária de Presença e Refeições</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,67,84,0.08)] border border-white/60">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#111d23] mb-1">Acesso Restrito</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Entre com suas credenciais oficiais</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold animate-in shake-in duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">E-mail Profissional</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#004354] transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-[#111d23] focus:ring-2 focus:ring-[#004354]/10 outline-none transition-all placeholder:text-slate-300"
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>

              <div className="relative group">
                <div className="flex justify-between items-end mb-2 px-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                  <a href="#" className="text-[10px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-widest">Esqueceu?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#004354] transition-colors" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-[#111d23] focus:ring-2 focus:ring-[#004354]/10 outline-none transition-all placeholder:text-slate-800/10"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-br from-[#004354] to-[#015266] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-[#004354]/20 hover:shadow-[#004354]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center mt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           &copy; 2024 FoodControl &bull; Versão 2.1 (Mobile Optimized)
        </p>
      </div>
    </div>
  );
}
