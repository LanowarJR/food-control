'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/Layout';
import { 
  TrendingUp, 
  Filter, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Calendar,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function HistoricoPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contractFilter, setContractFilter] = useState('Todos os Contratos');

  // Load History from Supabase
  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data: remoteData, error } = await supabase
        .from('meal_history')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        console.warn('Erro ao carregar histórico:', error.message);
      } else {
        setData(remoteData || []);
      }
    } catch (err) {
      console.error('Fallback error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Calculate Chart Data (Last 7 Operative Days)
  const chartData = useMemo(() => {
    // Pegamos os últimos 7 registros (datas únicas)
    const last7 = [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7);

    return last7.map(item => {
      const dateObj = new Date(item.date + 'T12:00:00Z');
      const label = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).toUpperCase();
      return {
        name: label,
        total: item.meals,
        fullDate: item.date
      };
    });
  }, [data]);

  // Calculate Monthly Metrics
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthEntries = data.filter(item => {
      const d = new Date(item.date + 'T12:00:00Z');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalMeals = thisMonthEntries.reduce((acc, curr) => acc + curr.meals, 0);
    const avg = thisMonthEntries.length > 0 ? Math.round(totalMeals / thisMonthEntries.length) : 0;

    return {
      average: avg,
      count: thisMonthEntries.length
    };
  }, [data]);

  // Filtered Table Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        item.obs?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.contract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cost_center?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesContract = contractFilter === 'Todos os Contratos' || item.contract === contractFilter;
      
      return matchesSearch && matchesContract;
    });
  }, [data, searchQuery, contractFilter]);

  // Unique contracts for filter
  const uniqueContracts = useMemo(() => {
    const set = new Set(data.map(item => item.contract).filter(Boolean));
    return Array.from(set);
  }, [data]);

  return (
    <Layout>
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <span className="font-inter text-[11px] font-bold uppercase tracking-[0.2em] text-[#004354]">Visão Estratégica</span>
          <h2 className="font-manrope text-3xl font-extrabold text-[#111d23] tracking-tight">Análise de Consumo</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-2 rounded-xl border border-slate-200/50">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200/50">
            <Filter className="w-4 h-4 text-[#004354]" />
            <select 
              value={contractFilter}
              onChange={e => setContractFilter(e.target.value)}
              className="border-none p-0 focus:ring-0 text-sm font-bold bg-transparent text-slate-600 outline-none cursor-pointer"
            >
              <option value="Todos os Contratos">Todos os Contratos</option>
              {uniqueContracts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button 
            onClick={loadHistory}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200/50 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#004354]", loading && "animate-spin")} />
          </button>
          <button className="bg-[#004354] text-white px-5 py-2 rounded-lg font-manrope text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#004354]/20 hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Main Chart Card */}
        <div className="md:col-span-8 bg-white rounded-2xl p-8 border border-slate-200/50 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-manrope text-lg font-bold text-[#111d23]">Histórico de Volume Diário</h3>
              <p className="text-xs text-slate-500 font-medium">Consumo total consolidado por dia de operação</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#004354]"></span>
                <span className="font-inter text-[10px] font-bold uppercase text-slate-500 tracking-widest">Total Geral</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            {loading ? (
               <div className="w-full h-full flex items-center justify-center">
                 <RefreshCw className="w-8 h-8 text-[#004354]/20 animate-spin" />
               </div>
            ) : chartData.length === 0 ? (
               <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold italic">
                 Aguardando primeiros fechamentos...
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#004354" radius={[6, 6, 0, 0]} barSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#004354' : '#b4cad6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Metrics Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#004354] to-[#015266] rounded-2xl p-8 text-white shadow-xl shadow-[#004354]/10 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="font-inter text-[10px] font-black bg-white/20 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">Tempo Real</span>
            </div>
            <div>
              <p className="font-inter text-[11px] font-bold uppercase tracking-widest text-teal-100/60 mb-1">Média Mensal</p>
              <h4 className="font-manrope text-5xl font-black tracking-tighter mb-2">{monthlyStats.average}</h4>
              <p className="text-xs text-teal-100/40 font-medium">Baseado em {monthlyStats.count} fechamentos este mês</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-manrope text-sm font-bold text-[#111d23]">Fator de Oscilação</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monitoramento Ativo</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              O sistema detecta padrões de consumo para otimizar pedidos futuros. Mantenha os fechamentos atualizados.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/50 shadow-[0px_20px_40px_rgba(17,29,35,0.02)]">
        <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <div>
            <h3 className="font-manrope text-lg font-bold text-[#111d23]">Extrato de Lançamentos</h3>
            <p className="text-xs text-slate-500 font-medium tracking-tight">Listagem completa de todos os pedidos oficializados no sistema</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200/50 focus:ring-2 focus:ring-[#004354]/10 text-sm w-full md:w-80 outline-none shadow-sm font-medium" 
              placeholder="Buscar por contrato, obs ou CC..." 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Data</th>
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-center">Refeições</th>
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Centro de Custo</th>
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Contrato</th>
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Pratos / Obs</th>
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <RefreshCw className="w-10 h-10 text-[#004354] animate-spin mx-auto opacity-10" />
                    <p className="mt-4 text-xs font-bold text-slate-300 uppercase tracking-widest">Sincronizando Histórico...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <p className="text-slate-400 font-bold italic">Nenhum lançamento encontrado para os filtros atuais.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5 text-sm font-bold text-[#111d23]">{new Date(item.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</td>
                    <td className="px-8 py-5 text-sm text-center">
                       <span className="bg-[#004354] text-white px-3 py-1 rounded-lg font-black text-xs shadow-sm shadow-[#004354]/20">
                         {item.meals}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-lg bg-teal-50 text-[10px] font-black text-teal-700 uppercase tracking-wider">{item.cost_center || 'Não Consta'}</span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-600 italic tracking-tight">{item.contract}</td>
                    <td className="px-8 py-5 text-[11px] text-slate-500 font-medium leading-tight max-w-xs">{item.obs}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        item.status === 'Validated' ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.status === 'Validated' ? "bg-teal-500" : "bg-amber-500"
                        )}></span>
                        {item.status === 'Validated' ? 'Validado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-6 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Snapshot: {filteredData.length} entradas</p>
          <div className="flex gap-2">
            <button className="p-2 rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100 transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-2 rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100 transition-colors shadow-sm">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
