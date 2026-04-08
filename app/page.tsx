'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { 
  TrendingUp, 
  Filter, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function DailyControl() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        // Tenta buscar por 'nome' se 'name' não existir
        const { data: dataAlt, error: errorAlt } = await supabase
          .from('collaborators')
          .select('*')
          .order('nome', { ascending: true });
        
        if (errorAlt) throw errorAlt;
        setEmployees(mapData(dataAlt));
      } else {
        setEmployees(mapData(data));
      }
    } catch (err: any) {
      console.error('Erro ao buscar colaboradores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const mapData = (data: any[]) => {
    return data.map(emp => ({
      ...emp,
      nome: emp.name || emp.nome || 'Sem Nome',
      initials: (emp.name || emp.nome || '??').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
      status_presenca: emp.status_presenca || 'Presente',
      centro_custo: emp.cost_center || emp.centro_custo || 'Não Alocado',
      comment: emp.comment || ''
    }));
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const stats = {
    total: employees.length,
    presentes: employees.filter(e => e.status_presenca === 'Presente').length,
    alertas: employees.filter(e => e.status_presenca === 'Falta' || e.status_presenca === 'Atraso').length
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111d23] tracking-tight font-manrope">Controle Diário</h1>
          <p className="text-slate-500 font-medium mt-1">Gestão de presença e alocação de colaboradores ativos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchEmployees}
            className="bg-white px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-200/50 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#004354]", loading && "animate-spin")} />
            <span className="text-sm font-semibold text-slate-600">Atualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
          Erro ao carregar colaboradores: {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total de Colaboradores</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-[#004354] font-manrope">{stats.total}</span>
            <span className="text-teal-600 text-xs font-bold mb-1.5 flex items-center">
              Ativos
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Presentes Agora</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-teal-700 font-manrope">{stats.presentes}</span>
            <span className="text-slate-400 text-xs font-medium mb-1.5">de {stats.total}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Atrasos/Faltas</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-red-500 font-manrope">{stats.alertas.toString().padStart(2, '0')}</span>
            <div className="flex flex-col mb-1">
              <span className="text-[10px] font-bold text-red-500 uppercase">Ação Requerida</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-[0px_20px_40px_rgba(17,29,35,0.04)] border border-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Colaborador</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Centro de Custo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status de Presença</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Comentário/OBS</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 min-h-[200px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <RefreshCw className="w-8 h-8 text-[#004354] animate-spin mx-auto opacity-20" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#b7eaff] flex items-center justify-center text-[#004354] font-bold text-xs">
                          {emp.initials}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111d23]">{emp.nome}</p>
                          <p className="text-[10px] text-slate-400 font-medium">ID: {emp.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                        {emp.centro_custo || 'Não Alocado'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase",
                        emp.status_presenca === 'Presente' && "bg-teal-50 text-teal-700",
                        emp.status_presenca === 'Atraso' && "bg-amber-50 text-amber-700",
                        emp.status_presenca === 'Falta' && "bg-red-50 text-red-600"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          emp.status_presenca === 'Presente' && "bg-teal-500",
                          emp.status_presenca === 'Atraso' && "bg-amber-500",
                          emp.status_presenca === 'Falta' && "bg-red-500"
                        )}></span>
                        {emp.status_presenca}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <input 
                        type="text" 
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-600 placeholder:text-slate-300"
                        placeholder="Adicionar observação..."
                        defaultValue={emp.comment}
                      />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-slate-400 hover:text-[#004354] transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            Mostrando {employees.length} colaboradores
          </p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg border border-slate-200/50 hover:bg-white transition-all">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-1.5 rounded-lg border border-slate-200/50 hover:bg-white transition-all">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
