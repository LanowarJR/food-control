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
  TrendingDown,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Printer,
  FileText
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
import { useTerminal } from '@/components/Layout';

export default function HistoricoPage() {
  const { terminalId } = useTerminal();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contractFilter, setContractFilter] = useState('Todos os Contratos');
  const [selectedDayData, setSelectedDayData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load History from Supabase
  const loadHistory = React.useCallback(async () => {
    if (!terminalId) return;
    setLoading(true);
    try {
      let remoteData: any[] = [];
      const { data: mData, error } = await supabase
        .from('meal_history')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('date', { ascending: false });
        
      if (error && error.code === '42703') {
        const { data: mDataAlt } = await supabase
          .from('meal_history')
          .select('*')
          .order('date', { ascending: false });
        remoteData = mDataAlt || [];
      } else if (error) {
        console.warn('Erro ao carregar histórico:', error.message);
      } else {
        remoteData = mData || [];
      }
      setData(remoteData);
    } catch (err) {
      console.error('Fallback error:', err);
    } finally {
      setLoading(false);
    }
  }, [terminalId]);

  const openDayDetails = async (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      // 1. Fetch base collaborators (same logic as dashboard)
      const { data: colabData } = await supabase.from('collaborators').select('*').eq('terminal_id', terminalId);
      
      let mappings: any[] = [];
      const { data: mapData, error: mapErr } = await supabase
        .from('food_cost_mapping')
        .select('*')
        .eq('terminal_id', terminalId);
      if (mapErr && mapErr.code === '42703') {
        const { data: mapAlt } = await supabase.from('food_cost_mapping').select('*');
        mappings = mapAlt || [];
      } else {
        mappings = mapData || [];
      }
      
      const mapHash = new Map();
      mappings.forEach(m => mapHash.set(m.collaborator_name, m.contract_name));

      const dedupMap = new Map();
      (colabData || []).forEach(emp => {
        const nome = emp.nome || emp.name || 'Sem Nome';
        if (!dedupMap.has(nome)) {
          dedupMap.set(nome, {
            nome,
            centro_custo: mapHash.get(nome) || 'Não Alocado',
            cargo: emp.role || emp.cargo || 'Funcional'
          });
        }
      });
      const uniqueColabs = Array.from(dedupMap.values());

      // 2. Fetch daily_attendance for the selected date
      let attendanceData: any[] = [];
      const { data: attData, error: attError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('date', date)
        .eq('terminal_id', terminalId);
      
      if (attError && attError.code === '42703') {
        const { data: attAlt } = await supabase
          .from('daily_attendance')
          .select('*')
          .eq('date', date);
        attendanceData = attAlt || [];
      } else if (attError) {
        throw attError;
      } else {
        attendanceData = attData || [];
      }
      
      const attendanceMap = new Map();
      attendanceData.forEach(att => attendanceMap.set(att.collaborator_name, att));

      // 3. Merge Base + Daily (Exact same logic as dashboard)
      const merged = uniqueColabs.map(emp => {
        const att = attendanceMap.get(emp.nome);
        return {
          id: att?.id, // May be undefined if not created yet
          collaborator_name: emp.nome,
          centro_custo: emp.centro_custo,
          cargo: emp.cargo,
          status: att?.status || 'Presente',
          comment: att?.comment || '',
          overtime: att?.overtime || ''
        };
      });

      // 4. Extras (Only if they have a record for that day)
      const colabNames = new Set(uniqueColabs.map(e => e.nome));
      const extras: any[] = [];
      attendanceMap.forEach(att => {
        if (!colabNames.has(att.collaborator_name)) {
          extras.push({
            id: att.id,
            collaborator_name: att.collaborator_name,
            centro_custo: mapHash.get(att.collaborator_name) || 'Extra',
            cargo: 'Refeição Extra/Avulsa',
            status: att.status,
            comment: att.comment,
            overtime: att.overtime || ''
          });
        }
      });

      const finalArray = [...merged, ...extras].sort((a,b) => a.collaborator_name.localeCompare(b.collaborator_name));
      setSelectedDayData(finalArray);

    } catch (err: any) {
      alert('Erro ao carregar detalhes: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const updateDetail = async (record: any, field: string, value: string) => {
    setUpdatingId(record.collaborator_name);
    try {
      const payload = {
        date: selectedDate,
        collaborator_name: record.collaborator_name,
        status: field === 'status' ? value : record.status,
        comment: field === 'comment' ? value : record.comment,
        overtime: field === 'overtime' ? value : record.overtime,
        terminal_id: terminalId
      };

      // Tenta UPDATE primeiro; se não existir o registro, faz INSERT
      const { data: updatedRows, error: updateError } = await supabase
        .from('daily_attendance')
        .update({ status: payload.status, comment: payload.comment, overtime: payload.overtime })
        .eq('date', selectedDate)
        .eq('collaborator_name', record.collaborator_name)
        .eq('terminal_id', terminalId)
        .select();

      if (updateError) throw updateError;

      let finalId = record.id;
      if (!updatedRows || updatedRows.length === 0) {
        // Registro não existia: insere um novo
        const { data: inserted, error: insertError } = await supabase
          .from('daily_attendance')
          .insert([payload])
          .select();
        if (insertError) throw insertError;
        finalId = inserted?.[0]?.id || finalId;
      } else {
        finalId = updatedRows[0]?.id || finalId;
      }

      setSelectedDayData(prev => prev.map(d => 
        d.collaborator_name === record.collaborator_name 
          ? { ...d, ...payload, id: finalId } 
          : d
      ));
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 print:hidden">
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

      {/* Mobile Card List (Visible on < md) */}
      <div className="md:hidden space-y-4 mb-10">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-10 h-10 text-[#004354] animate-spin mx-auto opacity-10" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-24 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
            Nenhum lançamento encontrado.
          </div>
        ) : (
          filteredData.map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Data do Lançamento</p>
                  <p className="text-sm font-black text-[#111d23]">{new Date(item.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                  item.status === 'Validated' ? "bg-teal-100 text-teal-800" : "bg-amber-100 text-amber-800"
                )}>
                  {item.status === 'Validated' ? 'Validado' : 'Pendente'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Refeições</p>
                  <p className="text-lg font-black text-[#004354]">{item.meals} <span className="text-[10px]">UND</span></p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">C. Custo</p>
                  <p className="text-[10px] font-black text-teal-700 truncate">{item.cost_center || 'Geral'}</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Observações do Dia</p>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic">"{item.obs}"</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Detailed History Table (Hidden on < md) */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-slate-200/50 shadow-[0px_20px_40px_rgba(17,29,35,0.02)]">
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
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</th>
                <th className="px-8 py-4 font-inter text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 text-right">Ação</th>
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
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => openDayDetails(item.date)}
                        className="bg-slate-100 hover:bg-[#004354] hover:text-white text-slate-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Resumo
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Desktop */}
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

      {/* Audit Summary Modal */}
      {isModalOpen && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Reset body to allow content to show */
              body, html { 
                visibility: hidden;
                height: auto !important;
                background: white !important;
              }
              
              /* Show only the modal container */
              .print-container, .print-container * { 
                visibility: visible !important; 
              }

              .print-container { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                margin: 0 !important; 
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                display: flex !important;
                flex-direction: column !important;
                max-height: none !important;
                background: white !important;
                overflow: visible !important;
              }
              
              /* Ensure containers don't clip at the bottom of pages */
              .print-no-clip {
                overflow: visible !important;
                height: auto !important;
                max-height: none !important;
                border-radius: 0 !important;
              }

              section {
                margin-bottom: 3rem !important;
                break-inside: avoid-page !important;
              }
              
              /* Ensure the overlay background is gone in print */
              .modal-overlay-print {
                background: white !important;
                backdrop-filter: none !important;
                position: static !important;
                display: block !important;
              }
              
              /* Specific fixes for typography and colors in print */
              tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                display: block !important;
                width: 100% !important;
              }

              td, th, section, h3 {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }

              h3 {
                margin-top: 3rem !important;
                margin-bottom: 1.5rem !important;
                display: block !important;
              }

              h2, h3, h4, h5, p, span, td, th {
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111d23]/80 backdrop-blur-sm overflow-y-auto modal-overlay-print print:p-0 print:block print:static">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] print-container print:max-h-none print:shadow-none print:rounded-none print:w-full print:border-none print:static">
              {/* Modal Header */}
              <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30 print:bg-white print:px-0 print:py-4">
               <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="bg-[#004354] text-white p-1.5 rounded-lg print:hidden">
                      <Calendar className="w-5 h-5" />
                    </span>
                    <h2 className="font-manrope font-black text-[#111d23] text-2xl tracking-tight">Audit Diário: {new Date(selectedDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}</h2>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] print:text-slate-600">Relatório Completo de Presença e Consumo</p>
               </div>
               <div className="flex items-center gap-3 print:hidden">
                 <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                 >
                   <Printer className="w-4 h-4" />
                   Imprimir PDF
                 </button>
                 <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="p-3 text-slate-300 hover:text-[#004354] rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm group"
                 >
                   <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                 </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar print:overflow-visible print:p-4">
              {modalLoading ? (
                <div className="py-24 text-center">
                   <RefreshCw className="w-12 h-12 text-[#004354]/20 animate-spin mx-auto mb-4" />
                   <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Compilando Dados...</p>
                </div>
              ) : selectedDayData.length === 0 ? (
                <div className="py-24 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-bold italic">Nenhum registro encontrado para este dia.</p>
                </div>
              ) : (
                <>
                  {/* Summary Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:mb-8">
                    <div className="bg-teal-50/50 p-5 rounded-3xl border border-teal-100/50 flex flex-col justify-between print:border print:p-4">
                      <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Presentes
                      </p>
                      <h4 className="text-3xl font-manrope font-black text-[#004354]">{selectedDayData.filter(d => d.status === 'Presente').length}</h4>
                    </div>
                    <div className="bg-red-50/50 p-5 rounded-3xl border border-red-100/50 flex flex-col justify-between print:border print:p-4">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <XCircle className="w-3 h-3" /> Faltas
                      </p>
                      <h4 className="text-3xl font-manrope font-black text-red-700">{selectedDayData.filter(d => d.status === 'Falta').length}</h4>
                    </div>
                    <div className="bg-purple-50/50 p-5 rounded-3xl border border-purple-100/50 flex flex-col justify-between print:border print:p-4">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Outros
                      </p>
                      <h4 className="text-3xl font-manrope font-black text-purple-700">{selectedDayData.filter(d => !['Presente', 'Falta'].includes(d.status)).length}</h4>
                    </div>
                    <div className="bg-[#004354] p-5 rounded-3xl text-white shadow-xl shadow-[#004354]/10 flex flex-col justify-between print:text-[#004354] print:bg-slate-50 print:border print:p-4">
                      <p className="text-[10px] font-bold text-teal-200/60 uppercase tracking-widest mb-2 flex items-center gap-2 print:text-[#004354]">
                        <TrendingUp className="w-3 h-3" /> Total Refeições
                      </p>
                      <h4 className="text-3xl font-manrope font-black">{data.find(d => d.date === selectedDate)?.meals || 0}</h4>
                    </div>
                  </div>

                  {/* Present Group */}
                  <section className="print:break-inside-avoid">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] whitespace-nowrap bg-white pr-4">Equipe em Campo (Presentes)</h3>
                      <div className="h-px bg-slate-100 flex-1 print:hidden"></div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm print:border-slate-200 print:no-clip">
                      {/* Header for Desktop/Print */}
                      <div className="bg-slate-50/50 flex px-6 py-4 border-b border-slate-50 print:bg-white">
                        <div className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador</div>
                        <div className="w-20 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">H. Extra</div>
                        <div className="flex-1 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-4">Observações</div>
                      </div>
                      <div className="divide-y divide-slate-50 print:no-clip">
                        {selectedDayData.filter(d => d.status === 'Presente').map(record => (
                          <DetailRow key={record.collaborator_name} record={record} updateDetail={updateDetail} updatingId={updatingId} />
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Absent Group */}
                  <section className="print:break-inside-avoid print:no-clip">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] whitespace-nowrap bg-white pr-4">Ausências & Faltas</h3>
                      <div className="h-px bg-slate-100 flex-1 print:hidden"></div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm print:border-slate-200 print:no-clip">
                      <div className="divide-y divide-slate-50 print:no-clip">
                        {selectedDayData.filter(d => d.status === 'Falta').map(record => (
                          <DetailRow key={record.collaborator_name} record={record} updateDetail={updateDetail} updatingId={updatingId} />
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Others Group */}
                  <section className="print:break-inside-avoid print:no-clip">
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] whitespace-nowrap bg-white pr-4">Afastamentos & Outros Status</h3>
                      <div className="h-px bg-slate-100 flex-1 print:hidden"></div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm print:border-slate-200 print:no-clip">
                      <div className="divide-y divide-slate-50 print:no-clip">
                        {selectedDayData.filter(d => !['Presente', 'Falta'].includes(d.status)).map(record => (
                          <DetailRow key={record.collaborator_name} record={record} updateDetail={updateDetail} updatingId={updatingId} />
                        ))}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center print:hidden">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                 SISTEMA OPERACIONAL &bull; {new Date().toLocaleTimeString('pt-BR')}
               </p>
               <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-[#004354] text-white px-10 py-3 rounded-2xl font-manrope font-bold shadow-lg shadow-[#004354]/20 hover:scale-105 active:scale-95 transition-all"
               >
                 Fechar Relatório
               </button>
            </div>
          </div>
        </div>
      </>
      )}
    </Layout>
  );
}

function DetailRow({ record, updateDetail, updatingId }: { record: any, updateDetail: any, updatingId: string | null }) {
  const isUpdating = updatingId === record.collaborator_name;
  
  return (
    <div className="group hover:bg-slate-50/50 transition-colors flex items-center print:break-inside-avoid-page print:page-break-inside-avoid">
      <div className="flex-1 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-[10px] text-[#004354] uppercase print:hidden">
            {record.collaborator_name.substring(0, 2)}
          </div>
          <div>
            <h5 className="text-xs font-black text-[#111d23] tracking-tight">{record.collaborator_name}</h5>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{record.cargo || 'Funcional'} &bull; <span className="text-teal-600">{record.centro_custo}</span></p>
          </div>
          {isUpdating && <RefreshCw className="w-3 h-3 text-[#004354] animate-spin ml-auto" />}
        </div>
      </div>
      <div className="w-20 px-6 py-4 text-center">
        <input 
          key={record.overtime} // Force internal update if database refreshes
          type="text" 
          defaultValue={record.overtime ? (isNaN(Number(record.overtime)) ? record.overtime : record.overtime + 'h') : '0h'}
          onBlur={(e) => {
            let val = e.target.value;
            if (val && !isNaN(Number(val))) val = val + 'h';
            if (val !== record.overtime) updateDetail(record, 'overtime', val);
          }}
          placeholder="0h" 
          className="w-full bg-transparent border-none text-center text-xs text-[#004354] focus:ring-0 outline-none font-black placeholder:text-slate-200" 
        />
      </div>
      <div className="flex-1 px-6 py-4">
        <input 
          type="text" 
          defaultValue={record.comment}
          onBlur={(e) => {
            if (e.target.value !== record.comment) updateDetail(record, 'comment', e.target.value);
          }}
          placeholder="Adicionar nota..." 
          className="w-full bg-transparent border-none text-xs text-slate-500 focus:ring-0 outline-none font-medium placeholder:text-slate-200" 
        />
      </div>
    </div>
  );
}
