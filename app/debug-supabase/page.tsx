'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { Database, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';

export default function DebugSupabase() {
  const [tableName, setTableName] = useState('');
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'ok' | 'fail'>('checking');

  // Test connection on mount
  useEffect(() => {
    async function testConnection() {
      try {
        // Just a simple check to see if we can reach the Supabase URL
        const { error } = await supabase.from('_non_existent_table_').select('*').limit(1);
        // If error is 'relation "_non_existent_table_" does not exist', it means we ARE connected
        if (error && error.code === 'PGRST116') {
          setConnectionStatus('ok');
        } else if (error && error.message.includes('fetch')) {
          setConnectionStatus('fail');
        } else {
          setConnectionStatus('ok');
        }
      } catch (err) {
        setConnectionStatus('fail');
      }
    }
    testConnection();
  }, []);

  const fetchData = async () => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from(tableName).select('*').limit(10);
      if (error) throw error;
      setData(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#004354] font-manrope">Diagnóstico Supabase</h1>
            <p className="text-slate-500">Verifique a conexão e visualize os dados das suas tabelas.</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest ${
            connectionStatus === 'ok' ? 'bg-teal-50 text-teal-700' : 
            connectionStatus === 'fail' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {connectionStatus === 'ok' ? <CheckCircle className="w-4 h-4" /> : 
             connectionStatus === 'fail' ? <XCircle className="w-4 h-4" /> : <RefreshCw className="w-4 h-4 animate-spin" />}
            {connectionStatus === 'ok' ? 'Conectado' : 
             connectionStatus === 'fail' ? 'Erro de Conexão' : 'Verificando...'}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/50 mb-8">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Digite o nome da tabela (ex: employees, meals...)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004354]/20 outline-none font-medium"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchData()}
              />
            </div>
            <button 
              onClick={fetchData}
              disabled={loading || !tableName}
              className="bg-[#004354] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Buscar Dados
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium mb-6">
              <strong>Erro:</strong> {error}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                Resultados da tabela <span className="text-[#004354]">{tableName}</span>
              </h3>
              <div className="bg-slate-900 rounded-xl p-6 overflow-auto max-h-[500px]">
                <pre className="text-teal-400 text-xs font-mono">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="text-center py-12 text-slate-400">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Insira o nome de uma tabela existente no seu Supabase para ver os dados.</p>
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
          <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
            <Database className="w-4 h-4" /> Dicas de Configuração
          </h4>
          <ul className="text-sm text-amber-700 space-y-2 list-disc pl-5">
            <li>Certifique-se de que as variáveis no seu <strong>.env</strong> começam com <code>NEXT_PUBLIC_</code>.</li>
            <li>Verifique se as <strong>Políticas de RLS (Row Level Security)</strong> no Supabase permitem a leitura pública ou se você precisa estar autenticado.</li>
            <li>Se o status acima estiver como &quot;Erro de Conexão&quot;, revise a URL e a Anon Key no painel do Supabase.</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
