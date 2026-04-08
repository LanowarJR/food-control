'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { 
  Users, 
  Truck, 
  AlertCircle, 
  Search, 
  Plus, 
  Filter, 
  Edit2, 
  UserMinus,
  ChevronLeft,
  ChevronRight,
  HardHat,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function GestaoPage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEmployees = React.useCallback(async () => {
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
        
        const mappedData = (dataAlt || []).map(emp => ({
          ...emp,
          nome: emp.name || emp.nome || 'Sem Nome',
          centro_custo: emp.cost_center || emp.centro_custo || 'Não Alocado'
        }));
        setEmployees(mappedData);
      } else {
        const mappedData = (data || []).map(emp => ({
          ...emp,
          nome: emp.name || emp.nome || 'Sem Nome',
          centro_custo: emp.cost_center || emp.centro_custo || 'Não Alocado'
        }));
        setEmployees(mappedData);
      }
    } catch (err: any) {
      console.error('Erro ao buscar colaboradores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const stats = [
    { label: 'Total de Colaboradores', value: employees.length.toString(), icon: HardHat, color: 'text-teal-600' },
    { label: 'Ativos Agora', value: employees.filter(e => e.status === 'Ativo').length.toString(), icon: Users, color: 'text-cyan-600' },
    { label: 'Pendências', value: '0', icon: AlertCircle, color: 'text-amber-500' },
  ];

  return (
    <Layout>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#111d23] font-manrope tracking-tight">Colaboradores e Contratos</h1>
          <p className="text-slate-500 mt-1">Gerencie motoristas, prestadores e equipe industrial de Facility A.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchEmployees}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-300 transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Atualizar
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-[#004354] to-[#005c72] text-white rounded-xl shadow-lg hover:opacity-90 transition-all font-semibold text-sm">
            <Plus className="w-4 h-4" />
            Adicionar Novo
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
          <strong>Erro ao carregar dados:</strong> {error}. Verifique se a tabela <code>colaboradores</code> existe no Supabase.
        </div>
      )}

      {/* Bento Grid Layout for Stats and Main Table */}
      <div className="grid grid-cols-12 gap-6">
        {/* Stats Column */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200/50 shadow-sm">
              <stat.icon className={cn("w-6 h-6 mb-2", stat.color)} />
              <h3 className="text-2xl font-bold text-[#111d23]">{stat.value}</h3>
              <p className="text-xs font-inter font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table Area */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-200/50">
              <div className="col-span-5 text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Colaborador / Cargo</div>
              <div className="col-span-3 text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Centro de Custo</div>
              <div className="col-span-2 text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Status</div>
              <div className="col-span-2 text-right text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Ações</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-slate-100 min-h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  Nenhum colaborador encontrado na tabela <code>colaboradores</code>.
                </div>
              ) : (
                employees.map((emp, idx) => (
                  <div key={emp.id || idx} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50 transition-colors group">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50 relative">
                        <Image 
                          className="object-cover" 
                          src={emp.avatar_url || `https://picsum.photos/seed/${emp.id}/100/100`} 
                          alt={emp.nome || 'Foto do colaborador'} 
                          fill
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-[#111d23] text-sm">{emp.nome}</p>
                        <p className="text-xs text-slate-500">{emp.cargo || 'Colaborador'}</p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <span className="px-3 py-1 bg-[#f4faff] rounded-lg text-xs font-medium text-[#004354] border border-[#004354]/10">
                        {emp.centro_custo || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tighter",
                        emp.status === 'Ativo' ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"
                      )}>
                        {emp.status || 'Inativo'}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-[#004354] transition-colors hover:bg-slate-100 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-slate-100 rounded-lg">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination / Footer */}
            <div className="px-6 py-4 border-t border-slate-200/50 flex items-center justify-between bg-slate-50/30">
              <span className="text-xs text-slate-500">Mostrando {employees.length} colaboradores</span>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-lg border border-slate-200/50 text-slate-500 hover:bg-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg border border-slate-200/50 text-slate-500 hover:bg-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
