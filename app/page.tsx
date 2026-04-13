'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Calendar,
  Download,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Helper to get yesterday date string safely
function getYesterdayDateStr(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function DailyControl() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Date State
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [importSourceDate, setImportSourceDate] = useState(() => getYesterdayDateStr(new Date().toISOString().split('T')[0]));
  const [importing, setImporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Extra Meal State
  const [isExtraOpen, setIsExtraOpen] = useState(false);
  const [extraForm, setExtraForm] = useState({ nome: '', centro_custo: '' });
  const [savingExtra, setSavingExtra] = useState(false);

  // UI State
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchContracts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('contracts').select('*').order('contract_name', { ascending: true });
      if (error) {
         const { data: altData } = await supabase.from('contracts').select('*');
         if (altData) setContracts(altData.map(c => ({ ...c, name: c.contract_name || c.name || c.nome })));
      } else {
         setContracts((data || []).map(c => ({ ...c, name: c.contract_name || c.name || c.nome })));
      }
    } catch(err) {}
  }, []);

  const fetchDailyData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch base collaborators
      const { data: colabData, error: colabError } = await supabase
        .from('collaborators')
        .select('*');
        
      if (colabError) throw colabError;

      // Pega os centros de custo personalizados
      const { data: mappings, error: mapErr } = await supabase.from('food_cost_mapping').select('*');
      if (mapErr && mapErr.code !== '42P01') throw mapErr;
      
      const mapHash = new Map();
      (mappings || []).forEach(m => {
        mapHash.set(m.collaborator_name, m.contract_name);
      });

      // Deduplicate by name for terminal flow base
      const dedupMap = new Map();
      (colabData || []).forEach(emp => {
        const nome = emp.nome || emp.name || 'Sem Nome';
        if (!dedupMap.has(nome)) {
          dedupMap.set(nome, {
            ...emp,
            nome,
            initials: nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
            centro_custo: mapHash.get(nome) || 'Não Alocado',
            cargo: emp.role || emp.cargo || 'Funcional'
          });
        }
      });
      const uniqueColabs = Array.from(dedupMap.values());

      // 2. Fetch daily_attendance for currentDate
      const { data: attendanceData, error: attError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('date', currentDate);
        
      if (attError && attError.code !== '42P01') throw attError;

      const attendanceMap = new Map();
      (attendanceData || []).forEach(att => {
        attendanceMap.set(att.collaborator_name, att);
      });

      // 3. Merge Bases
      const merged = uniqueColabs.map(emp => {
        const att = attendanceMap.get(emp.nome);
        return {
          ...emp,
          status_presenca: att?.status || 'Presente',
          comment: att?.comment || ''
        };
      });

      // 4. Identificar os EXTRAS (Avulsos salvos no attendanceMap mas que não vieram do TerminalFlow)
      const colabNames = new Set(uniqueColabs.map(e => e.nome));
      const extras: any[] = [];
      
      attendanceMap.forEach(att => {
        if (!colabNames.has(att.collaborator_name)) {
          extras.push({
            nome: att.collaborator_name,
            initials: 'EX',
            centro_custo: mapHash.get(att.collaborator_name) || 'Extra',
            cargo: 'Refeição Extra/Avulsa',
            status_presenca: att.status,
            comment: att.comment
          });
        }
      });

      const finalArray = [...merged.sort((a,b) => a.nome.localeCompare(b.nome)), ...extras.sort((a,b) => a.nome.localeCompare(b.nome))];
      setEmployees(finalArray);
      
    } catch (err: any) {
      console.error('Erro ao carregar dados diários:', err);
      if (err.message?.includes('daily_attendance')) {
        setError('Tabela daily_attendance não encontrada. Por favor, crie-a no Supabase.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchContracts();
    fetchDailyData();
  }, [fetchDailyData, fetchContracts]);

  const updateEmployeeAttendance = async (nome: string, field: 'status' | 'comment', value: string) => {
    setUpdatingId(nome);
    try {
      const emp = employees.find(e => e.nome === nome);
      if (!emp) return;

      const payload = {
        date: currentDate,
        collaborator_name: nome,
        status: field === 'status' ? value : emp.status_presenca,
        comment: field === 'comment' ? value : emp.comment
      };

      const { error } = await supabase
        .from('daily_attendance')
        .upsert(payload, { onConflict: 'date, collaborator_name' });

      if (error) {
        if (error.code === '42P01') {
          throw new Error('A tabela daily_attendance ainda não foi criada no Supabase.');
        }
        throw error;
      }

      setEmployees(prev => prev.map(e => e.nome === nome ? { ...e, status_presenca: payload.status, comment: payload.comment } : e));
    } catch (err: any) {
      console.error(`Erro ao atualizar ${field}:`, err);
      alert('Falha ao salvar: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleImportFromDate = async () => {
    if (!confirm(`Deseja importar as configurações e status do dia selecionado (${importSourceDate}) para o dia atual (${currentDate})?`)) return;
    
    setImporting(true);
    try {
      const { data: sourceData, error: sourceError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('date', importSourceDate);

      if (sourceError) {
        if (sourceError.code === '42P01') throw new Error('A tabela daily_attendance não existe.');
        throw sourceError;
      }

      if (!sourceData || sourceData.length === 0) {
        alert(`Nenhum dado encontrado no dia ${importSourceDate} para importar.`);
        return;
      }

      const upserts = sourceData.map(att => ({
        date: currentDate,
        collaborator_name: att.collaborator_name,
        status: att.status,
        comment: att.comment
      }));

      const { error: upsertError } = await supabase
        .from('daily_attendance')
        .upsert(upserts, { onConflict: 'date, collaborator_name' });

      if (upsertError) throw upsertError;
      
      alert('Status importados com sucesso!');
      setIsImportModalOpen(false);
      fetchDailyData();
    } catch (err: any) {
      console.error('Erro ao importar:', err);
      alert('Erro ao importar dados. ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleStatusChange = (nome: string, currentValue: string, newValue: string) => {
    if (newValue === 'custom') {
      const customStatus = prompt('Insira o nome do Status Personalizado (ex: Férias, Atestado, Maternidade):');
      if (customStatus && customStatus.trim() !== '') {
        updateEmployeeAttendance(nome, 'status', customStatus.trim());
      } else {
        setTimeout(() => setEmployees([...employees]), 10);
      }
    } else {
      updateEmployeeAttendance(nome, 'status', newValue);
    }
  };

  const saveExtraMeal = async () => {
    if (!extraForm.nome || !extraForm.centro_custo) {
       alert("Preencha nome e centro de custo!");
       return;
    }
    setSavingExtra(true);
    try {
       // 1. Salva no cost_mapping universal
       const mapPayload = {
         collaborator_name: extraForm.nome,
         contract_name: extraForm.centro_custo
       };
       await supabase.from('food_cost_mapping').upsert(mapPayload, { onConflict: 'collaborator_name' } as any);
       
       // 2. Insere a presenca no Attendance de hoje
       const attPayload = {
         date: currentDate,
         collaborator_name: extraForm.nome,
         status: 'Presente',
         comment: 'Refeição Extra/Visitante'
       };
       await supabase.from('daily_attendance').upsert(attPayload, { onConflict: 'date, collaborator_name' });

       alert("Refeição Avulsa Adicionada com Sucesso!");
       setIsExtraOpen(false);
       setExtraForm({ nome: '', centro_custo: '' });
       fetchDailyData();
    } catch (err: any) {
       alert("Erro ao adicionar avulso: " + err.message);
    } finally {
       setSavingExtra(false);
    }
  };

  const deleteExtraMember = async (nome: string) => {
    if (!confirm(`Deseja realmente remover "${nome}" da lista do dia?`)) return;
    
    try {
      const { error } = await supabase
        .from('daily_attendance')
        .delete()
        .eq('date', currentDate)
        .eq('collaborator_name', nome);

      if (error) throw error;
      
      setEmployees(prev => prev.filter(e => e.nome !== nome));
      setOpenMenuId(null);
    } catch (err: any) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const stats = {
    total: employees.length,
    presentes: employees.filter(e => e.status_presenca === 'Presente').length,
    faltas: employees.filter(e => e.status_presenca === 'Falta').length,
    outros: employees.filter(e => e.status_presenca !== 'Presente' && e.status_presenca !== 'Falta').length
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111d23] tracking-tight font-manrope">Controle Diário</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Gestão de presença por data e registro inteligente.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center gap-2 bg-white px-4 py-2.5 text-slate-700 rounded-xl border border-slate-200/50 shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#004354]/10">
            <Calendar className="w-4 h-4 text-[#004354]" />
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs md:text-sm cursor-pointer w-full"
            />
          </div>
          <button 
            onClick={fetchDailyData}
            className="p-3 bg-white text-slate-700 rounded-xl flex items-center justify-center border border-slate-200/50 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button 
             onClick={() => setIsExtraOpen(true)}
             className="flex-1 md:flex-none px-4 py-2 bg-white text-[#004354] rounded-xl flex items-center justify-center gap-2 border border-[#004354]/20 shadow-sm hover:bg-slate-50 transition-colors font-bold text-xs md:text-sm"
          >
             <Plus className="w-4 h-4" />
             <span>Extra</span>
          </button>
          <button 
            onClick={() => setIsImportModalOpen(true)}
            disabled={importing}
            className="flex-1 md:flex-none bg-[#004354] px-4 py-3 md:py-2 text-white rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer hover:bg-[#005c72] transition-colors disabled:opacity-50"
          >
            <Download className={cn("w-4 h-4", importing && "animate-bounce")} />
            <span className="text-sm font-bold">Importar dados de:</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
          <strong>Aviso:</strong> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <div className="flex flex-col md:flex-row md:items-end md:gap-2">
            <span className="text-2xl md:text-4xl font-black text-[#004354] font-manrope">{stats.total}</span>
            <span className="text-teal-600 text-[10px] font-bold mb-1 flex items-center">
              Pessoas
            </span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200/50 border-b-4 border-b-teal-500">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Presentes</p>
          <div className="flex flex-col md:flex-row md:items-end md:gap-2">
            <span className="text-2xl md:text-4xl font-black text-teal-700 font-manrope">{stats.presentes}</span>
            <span className="text-slate-400 text-[10px] font-medium mb-1">de {stats.total}</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200/50 border-b-4 border-b-red-400">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Faltas</p>
          <div className="flex flex-col md:flex-row md:items-end md:gap-2">
            <span className="text-2xl md:text-4xl font-black text-red-500 font-manrope">{stats.faltas.toString().padStart(2, '0')}</span>
            <span className="text-red-300 text-[10px] font-bold uppercase mb-1">Inativo</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200/50">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outros</p>
          <div className="flex flex-col md:flex-row md:items-end md:gap-2">
            <span className="text-2xl md:text-4xl font-black text-purple-500 font-manrope">{stats.outros.toString().padStart(2, '0')}</span>
            <span className="text-purple-300 text-[10px] font-bold uppercase mb-1">Licença</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <input 
            type="text"
            placeholder="Buscar colaborador ou visitante..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none shadow-sm font-medium"
          />
        </div>
        <div className="w-full md:w-64">
           <select 
             value={statusFilter}
             onChange={e => setStatusFilter(e.target.value)}
             className="w-full bg-white border border-slate-200/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none shadow-sm cursor-pointer font-bold text-slate-600"
           >
             <option value="Todos">Todos os Status</option>
             <option value="Presente">Somente Presentes</option>
             <option value="Falta">Somente Faltas</option>
             <option value="Atraso">Somente Atrasos</option>
             <option value="Custom">Customizados/Outros</option>
           </select>
        </div>
      </div>

      {/* Mobile Card List (Visible on < md) */}
      <div className="md:hidden space-y-3 mb-10">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#004354] animate-spin mx-auto opacity-20" />
          </div>
        ) : employees.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200">
            Nenhum colaborador encontrado.
          </div>
        ) : (
          employees
            .filter(emp => {
              if (searchQuery && !emp.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
              if (statusFilter !== 'Todos') {
                if (statusFilter === 'Custom' && ['Presente', 'Falta', 'Atraso'].includes(emp.status_presenca)) return false;
                if (statusFilter !== 'Custom' && emp.status_presenca !== statusFilter) return false;
              }
              return true;
            })
            .map((emp) => {
              const isCustom = !['Presente', 'Falta', 'Atraso', 'Férias', 'Atestado'].includes(emp.status_presenca);
              const isExtra = emp.initials === 'EX';

              return (
                <div key={emp.nome} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-black text-xs",
                        isExtra ? "bg-purple-100 text-purple-700" : "bg-[#b7eaff] text-[#004354]"
                      )}>
                        {emp.initials}
                      </div>
                      <div className="max-w-[160px]">
                        <p className="text-sm font-black text-[#111d23] leading-tight break-words">
                          {emp.nome}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                          {emp.centro_custo}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === emp.nome ? null : emp.nome)}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          openMenuId === emp.nome ? "bg-slate-100 text-[#004354]" : "text-slate-300"
                        )}
                      >
                         <MoreVertical className="w-5 h-5" />
                      </button>

                      {openMenuId === emp.nome && isExtra && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                           <button 
                             onClick={() => deleteExtraMember(emp.nome)}
                             className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                           >
                             <Trash2 className="w-4 h-4" />
                             Remover do Dia
                           </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <select
                      value={isCustom ? 'custom_mapped' : emp.status_presenca}
                      onChange={(e) => handleStatusChange(emp.nome, emp.status_presenca, e.target.value)}
                      disabled={updatingId === emp.nome}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase border border-slate-100 shadow-sm text-center appearance-none",
                        emp.status_presenca === 'Presente' ? "bg-teal-50 text-teal-700" :
                        emp.status_presenca === 'Atraso' ? "bg-amber-50 text-amber-700" :
                        emp.status_presenca === 'Falta' ? "bg-red-50 text-red-600" :
                        "bg-purple-50 text-purple-700",
                        updatingId === emp.nome && "opacity-50"
                      )}
                    >
                      <option value="Presente">Presente</option>
                      <option value="Atraso">Atraso</option>
                      <option value="Falta">Falta</option>
                      <option value="Férias">Férias</option>
                      <option value="Atestado">Atestado</option>
                      {isCustom && <option value="custom_mapped">{emp.status_presenca}</option>}
                      <option value="custom">+ Novo</option>
                    </select>
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      className={cn(
                        "w-full bg-slate-50 border-none rounded-lg text-xs text-slate-600 p-3 outline-none focus:ring-1 focus:ring-teal-500/20",
                        updatingId === emp.nome && "opacity-50"
                      )}
                      placeholder="Observação rápida..."
                      defaultValue={emp.comment}
                      onBlur={(e) => {
                        if (e.target.value !== emp.comment) {
                          updateEmployeeAttendance(emp.nome, 'comment', e.target.value);
                        }
                      }}
                      disabled={updatingId === emp.nome}
                    />
                    {updatingId === emp.nome && <RefreshCw className="absolute right-3 top-3 w-3 h-3 text-teal-600 animate-spin" />}
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Desktop Table Section (Hidden on < md) */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden shadow-[0px_20px_40px_rgba(17,29,35,0.04)] border border-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Colaborador / Visitante</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status Diário</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Observação Específica</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 min-h-[200px]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <RefreshCw className="w-8 h-8 text-[#004354] animate-spin mx-auto opacity-20" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400">
                    Nenhum colaborador encontrado na base.
                  </td>
                </tr>
              ) : (
                employees
                .filter(emp => {
                   if (searchQuery && !emp.nome.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                   if (statusFilter !== 'Todos') {
                     if (statusFilter === 'Custom' && ['Presente', 'Falta', 'Atraso'].includes(emp.status_presenca)) return false;
                     if (statusFilter !== 'Custom' && emp.status_presenca !== statusFilter) return false;
                   }
                   return true;
                })
                .map((emp) => {
                  const isCustom = !['Presente', 'Falta', 'Atraso', 'Férias', 'Atestado'].includes(emp.status_presenca);
                  const isExtra = emp.initials === 'EX';

                  return (
                    <tr key={emp.nome} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                             "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                             isExtra ? "bg-purple-100 text-purple-700" : "bg-[#b7eaff] text-[#004354]"
                          )}>
                            {emp.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111d23] flex items-center gap-2">
                               {emp.nome}
                               {isExtra && <span className="bg-purple-50 text-purple-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Avulso</span>}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                               {emp.cargo || 'Funcional'} &bull; <span className="text-teal-600">{emp.centro_custo}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <select
                          value={isCustom ? 'custom_mapped' : emp.status_presenca}
                          onChange={(e) => handleStatusChange(emp.nome, emp.status_presenca, e.target.value)}
                          disabled={updatingId === emp.nome}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-bold uppercase border-none focus:ring-0 cursor-pointer text-center",
                            emp.status_presenca === 'Presente' ? "bg-teal-50 text-teal-700" :
                            emp.status_presenca === 'Atraso' ? "bg-amber-50 text-amber-700" :
                            emp.status_presenca === 'Falta' ? "bg-red-50 text-red-600" :
                            "bg-purple-50 text-purple-700",
                            updatingId === emp.nome && "opacity-50"
                          )}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          <option value="Presente">Presente</option>
                          <option value="Atraso">Atraso</option>
                          <option value="Falta">Falta</option>
                          <option value="Férias">Férias</option>
                          <option value="Atestado">Atestado</option>
                          {isCustom && <option value="custom_mapped">{emp.status_presenca}</option>}
                          <option value="custom" className="text-slate-500 font-bold">+ Novo Customizado</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 relative">
                        <input 
                          type="text" 
                          className={cn(
                            "w-full bg-transparent border-none focus:ring-0 text-sm text-slate-600 placeholder:text-slate-300 outline-none",
                            updatingId === emp.nome && "opacity-50"
                          )}
                          placeholder="Adicione configurações, exceções..."
                          defaultValue={emp.comment}
                          onBlur={(e) => {
                            if (e.target.value !== emp.comment) {
                              updateEmployeeAttendance(emp.nome, 'comment', e.target.value);
                            }
                          }}
                          disabled={updatingId === emp.nome}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        {updatingId === emp.nome && (
                          <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <RefreshCw className="w-4 h-4 text-[#004354] animate-spin" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === emp.nome ? null : emp.nome)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            openMenuId === emp.nome ? "bg-slate-100 text-[#004354]" : "text-slate-400 hover:text-[#004354]"
                          )}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === emp.nome && isExtra && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                             <button 
                               onClick={() => deleteExtraMember(emp.nome)}
                               className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                               Remover do Dia
                             </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Desktop */}
        <div className="px-6 py-4 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            Vendo o snapshot do dia <strong className="text-slate-600">{currentDate}</strong>
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

      {/* Modal Importar Dados de Outra Data */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <div>
                  <h2 className="font-black text-[#111d23] text-lg">Importar de Outra Data</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronização inteligente de presença</p>
               </div>
               <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start">
                 <div className="p-2 bg-blue-100/50 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600" />
                 </div>
                 <p className="text-xs text-blue-800 font-medium leading-relaxed">
                    Selecione a data de origem. Todos os <strong>Status</strong> e <strong>Observações</strong> serão replicados para hoje ({currentDate}).
                 </p>
              </div>

              <div className="space-y-2">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Origem</label>
                 <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#004354] transition-colors" />
                    <input 
                      type="date" 
                      value={importSourceDate}
                      onChange={(e) => setImportSourceDate(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[#111d23] focus:ring-2 focus:ring-[#004354]/10 outline-none transition-all"
                    />
                 </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 flex flex-col md:flex-row gap-3 bg-slate-50/50">
               <button 
                 onClick={() => setIsImportModalOpen(false)}
                 className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-200/50 transition-all"
                 disabled={importing}
               >
                 Cancelar
               </button>
               <button 
                 onClick={handleImportFromDate}
                 disabled={importing}
                 className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-br from-[#004354] to-[#015266] hover:shadow-lg hover:shadow-[#004354]/20 transition-all disabled:opacity-50"
               >
                 {importing ? (
                   <>
                     <RefreshCw className="w-4 h-4 animate-spin" />
                     Processando...
                   </>
                 ) : (
                   <>
                     <Download className="w-4 h-4" />
                     Confirmar Importação
                   </>
                 )}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Refeição Extra */}
      {isExtraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-[#111d23]">Adicionar Refeição Avulsa</h2>
              <button onClick={() => setIsExtraOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-xs font-medium">
                Pessoas avulsas só aparecerão na tabela enquanto tiverem presença marcada aqui pelas datas. A conta vai para o Centro de Custo escolhido.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome ou Referência</label>
                <input 
                  type="text" 
                  value={extraForm.nome}
                  onChange={e => setExtraForm({...extraForm, nome: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none"
                  placeholder="Ex: VISITANTE FULANO, ENGENHEIRO DA BASE"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Centro de Custo (Contrato a Faturar)</label>
                <select 
                  value={contracts.some(c => c.name === extraForm.centro_custo) || !extraForm.centro_custo ? extraForm.centro_custo : 'custom_mapped'}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      const customCT = prompt('Digite o nome do Novo Centro de Custo Avulso:');
                      if (customCT && customCT.trim() !== '') {
                        setExtraForm({...extraForm, centro_custo: customCT.trim()});
                      }
                    } else if (e.target.value !== 'custom_mapped') {
                      setExtraForm({...extraForm, centro_custo: e.target.value});
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none cursor-pointer"
                >
                  <option value="" disabled>Selecione um contrato existente...</option>
                  {contracts && contracts.map(c => (
                     <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {extraForm.centro_custo && !contracts.some(c => c.name === extraForm.centro_custo) && (
                     <option value="custom_mapped">{extraForm.centro_custo}</option>
                  )}
                  <option value="custom" className="text-[#004354] font-bold">+ Novo Customizado</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={() => setIsExtraOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
                disabled={savingExtra}
              >
                Cancelar
              </button>
              <button 
                onClick={saveExtraMeal}
                disabled={savingExtra || !extraForm.nome || !extraForm.centro_custo}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#004354] hover:bg-[#005c72] transition-colors disabled:opacity-50"
              >
                {savingExtra ? 'Inserindo...' : 'Marcar Presença'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
