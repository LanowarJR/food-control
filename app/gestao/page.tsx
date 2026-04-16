'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { 
  Users, 
  AlertCircle, 
  ChevronLeft,
  ChevronRight,
  HardHat,
  RefreshCw,
  X,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useTerminal } from '@/components/Layout';

export default function GestaoPage() {
  const { terminalId } = useTerminal();
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEmp, setEditingEmp] = React.useState<any | null>(null);
  const [formData, setFormData] = React.useState({ nome: '', cargo: '', centro_custo: '' });
  const [saving, setSaving] = React.useState(false);

  // Fetch contracts for the dropdown
  const fetchContracts = React.useCallback(async () => {
    if (!terminalId) return;
    try {
      // O usuário informou que a coluna se chama contract_name
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('contract_name', { ascending: true });
      if (error) {
         // Fallback se por acaso a ordenação falhar, busca sem ordenar
         const { data: altData } = await supabase
           .from('contracts')
           .select('*')
           .eq('terminal_id', terminalId);
         if (altData) {
            setContracts(altData.map(c => ({ ...c, name: c.contract_name || c.name || c.nome })));
         } else {
             console.error("Erro no fallback de contracts:", error);
         }
      } else {
         setContracts((data || []).map(c => ({ ...c, name: c.contract_name || c.name || c.nome })));
      }
    } catch(err) {
       console.error("Erro ao buscar contratos:", err);
    }
  }, [terminalId]);

  const fetchEmployees = React.useCallback(async () => {
    if (!terminalId) return;
    setLoading(true);
    try {
      // 1. Pega contratos
      await fetchContracts();

      // 2. Pega base de colaboradores do TerminalFlow
      let colabData: any[] = [];
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('terminal_id', terminalId)
        .order('name', { ascending: true });
      
      if (error) {
        const { data: dataAlt, error: errorAlt } = await supabase
          .from('collaborators')
          .select('*')
          .eq('terminal_id', terminalId)
          .order('nome', { ascending: true });
        if (errorAlt) throw errorAlt;
        colabData = dataAlt || [];
      } else {
        colabData = data || [];
      }

      // 3. Pega os mapeamentos seguros de custo do FoodControl
      let mappings: any[] = [];
      const { data: mData, error: mapErr } = await supabase
        .from('food_cost_mapping')
        .select('*')
        .eq('terminal_id', terminalId);
      
      if (mapErr && mapErr.code === '42703') {
        const { data: mDataAlt } = await supabase.from('food_cost_mapping').select('*');
        mappings = mDataAlt || [];
      } else if (mapErr && mapErr.code !== '42P01') {
        throw mapErr;
      } else {
        mappings = mData || [];
      }
      
      const mapHash = new Map();
      mappings.forEach(m => {
        mapHash.set(m.collaborator_name, m.contract_name);
      });

      // 4. Desduplica e une com o food_cost_mapping
      const deduplicate = (list: any[]) => {
        const map = new Map();
        list.forEach(emp => {
          const nome = emp.nome || emp.name || 'Sem Nome';
          if (!map.has(nome)) {
            map.set(nome, {
              ...emp,
              nome,
              // Verifica se tem mapeamento salvo. Se não tiver, verifica se veio do TerminalFlow. Se não "Não Alocado"
              centro_custo: mapHash.get(nome) || 'Não Alocado', 
              cargo: emp.role || emp.cargo || 'Colaborador'
            });
          }
        });
        return Array.from(map.values()).sort((a,b) => a.nome.localeCompare(b.nome));
      };

      setEmployees(deduplicate(colabData));
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchContracts, terminalId]);

  React.useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const stats = [
    { label: 'Total de Colaboradores Base', value: employees.length.toString(), icon: HardHat, color: 'text-teal-600' },
    { label: 'Sem Custo Vinculado', value: employees.filter(e => e.centro_custo === 'Não Alocado').length.toString(), icon: AlertCircle, color: 'text-amber-500' },
    { label: 'Vinculados', value: employees.filter(e => e.centro_custo !== 'Não Alocado').length.toString(), icon: LinkIcon, color: 'text-[#004354]' },
  ];

  const openModal = (emp: any) => {
    setEditingEmp(emp);
    setFormData({
      nome: emp.nome || '',
      cargo: emp.cargo || '',
      centro_custo: emp.centro_custo !== 'Não Alocado' ? emp.centro_custo : ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmp(null);
  };

  const handleSaveMap = async () => {
    setSaving(true);
    try {
      if (!formData.centro_custo) {
         alert('Selecione um Centro de Custo pagador.');
         setSaving(false);
         return;
      }

      // Tenta UPDATE; se não afetar nenhuma linha, insere um novo registro
      const payload = {
        collaborator_name: formData.nome,
        contract_name: formData.centro_custo,
        terminal_id: terminalId
      };

      const { data: updatedRows, error: updateError } = await supabase
        .from('food_cost_mapping')
        .update({ contract_name: formData.centro_custo })
        .eq('collaborator_name', formData.nome)
        .eq('terminal_id', terminalId)
        .select();

      if (updateError) {
        if (updateError.code === '42P01') {
           throw new Error('A tabela food_cost_mapping ainda não foi criada no Supabase.');
        }
        throw updateError;
      }

      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from('food_cost_mapping').insert([payload]);
        if (insertError) {
          if (insertError.code === '42P01') {
             throw new Error('A tabela food_cost_mapping ainda não foi criada no Supabase.');
          }
          throw insertError;
        }
      }
      
      await fetchEmployees();
      closeModal();
    } catch (err: any) {
      console.error('Erro ao vincular:', err);
      alert('Erro ao vincular: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111d23] font-manrope tracking-tight">Gestão de Colaboradores</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Vincule os colaboradores aos centros de custo pagadores de refeição.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={fetchEmployees}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 md:py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#004354]", loading && "animate-spin")} />
            Atualizar Base
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
          <strong>Aviso:</strong> {error}
        </div>
      )}

      {/* Bento Grid Layout for Stats and Main Table */}
      <div className="grid grid-cols-12 gap-6">
        {/* Stats Column */}
        <div className="col-span-12 lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className={cn(
              "bg-white p-5 rounded-2xl border border-slate-200/50 shadow-sm transition-all",
              idx === 0 ? "col-span-2 lg:col-span-1" : "col-span-1"
            )}>
              <stat.icon className={cn("w-5 h-5 mb-3", stat.color)} />
              <h3 className="text-2xl md:text-3xl font-black text-[#111d23] font-manrope">{stat.value}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* List Area */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          
          {/* Mobile List (Hidden on Desktop) */}
          <div className="md:hidden space-y-3">
             {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
                </div>
             ) : employees.map((emp, idx) => (
                <div key={emp.id || idx} className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50 relative">
                       <Image 
                          className="object-cover" 
                          src={emp.avatar_url || `https://picsum.photos/seed/${emp.id || idx}/120/120`} 
                          alt={emp.nome} 
                          fill
                          sizes="48px"
                          referrerPolicy="no-referrer"
                       />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="font-black text-[#111d23] text-sm truncate">{emp.nome}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.cargo}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-50">
                    <div className="flex-1 min-w-0">
                       <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">C. Custo Atual</p>
                       <span className={cn(
                          "inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase truncate max-w-full",
                          emp.centro_custo === 'Não Alocado' ? "bg-amber-50 text-amber-600" : "bg-teal-50 text-teal-700"
                       )}>
                          {emp.centro_custo}
                       </span>
                    </div>
                    <button 
                       onClick={() => openModal(emp)}
                       className="flex items-center gap-2 px-4 py-2.5 bg-[#004354] text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-[#004354]/20"
                    >
                       <LinkIcon className="w-3 h-3" />
                       Vincular
                    </button>
                  </div>
                </div>
             ))}
          </div>

          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-200/50">
              <div className="col-span-6 text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Colaborador / Cargo Real</div>
              <div className="col-span-4 text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Centro de Custo (Refeição)</div>
              <div className="col-span-2 text-right text-xs font-bold font-inter uppercase tracking-widest text-slate-500">Ações</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-slate-100 min-h-[200px]">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold italic">
                  Nenhum colaborador carregado.
                </div>
              ) : (
                employees.map((emp, idx) => (
                  <div key={emp.id || idx} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50 transition-colors group">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50 relative focus-within:ring-2 ring-[#004354]">
                        <Image 
                          className="object-cover" 
                          src={emp.avatar_url || `https://picsum.photos/seed/${emp.id || idx}/100/100`} 
                          alt={emp.nome || 'Foto'} 
                          fill
                          sizes="40px"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#111d23] text-sm">{emp.nome}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{emp.cargo}</p>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <span className={cn(
                        "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight",
                        emp.centro_custo === 'Não Alocado' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-[#f4faff] text-[#004354] border border-[#004354]/10"
                      )}>
                        {emp.centro_custo}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(emp)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 hover:text-white transition-all hover:bg-[#004354] rounded-xl cursor-pointer text-[10px] font-black uppercase tracking-widest shadow-sm"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        Vincular
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Pagination */}
            <div className="px-6 py-4 border-t border-slate-200/50 flex items-center justify-between bg-slate-50/30">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Base: {employees.length} itens</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-xl border border-slate-200/50 text-slate-500 hover:bg-white transition-colors shadow-sm">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl border border-slate-200/50 text-slate-500 hover:bg-white transition-colors shadow-sm">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Seguro (Apenas Mapeamento) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-[#111d23]">Vincular Centro de Custo</h2>
              <button onClick={closeModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-teal-50 text-teal-800 p-4 rounded-xl text-xs font-medium">
                Altere o Contrato pagador para este colaborador neste sistema. O TerminalFlow original não será modificado.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome do Colaborador</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed opacity-70"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cargo Relatado</label>
                <input 
                  type="text" 
                  value={formData.cargo}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none cursor-not-allowed opacity-70 font-bold text-[#004354]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contrato Atual / Centro de Custo</label>
                <select 
                  value={formData.centro_custo}
                  onChange={(e) => setFormData({...formData, centro_custo: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none cursor-pointer"
                >
                  <option value="" disabled>Selecione um contrato existente...</option>
                  {contracts && contracts.map(c => (
                     <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {(!contracts || contracts.length === 0) && (
                     <option value="Sem Contratos Registrados">Sem Contratos Registrados no Banco</option>
                  )}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button 
                onClick={closeModal}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveMap}
                disabled={saving || !formData.centro_custo}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#004354] hover:bg-[#005c72] transition-colors disabled:opacity-50"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                Salvar Vínculo Seguro
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
