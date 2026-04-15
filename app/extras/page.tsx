'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { 
  Plus, 
  Trash2, 
  Coffee, 
  Moon, 
  Package, 
  RefreshCw,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useTerminal } from '@/components/Layout';

export default function ExtrasPage() {
  const { terminalId } = useTerminal();
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form State
  const [formType, setFormType] = useState('Cafe');
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formContract, setFormContract] = useState('');

  const fetchBaseData = useCallback(async () => {
    if (!terminalId) return;
    setLoading(true);
    try {
      // Pega Contratos
      const { data: ctData, error: ctErr } = await supabase.from('contracts').select('*').eq('terminal_id', terminalId).order('contract_name', { ascending: true });
      if (ctErr) {
        const { data: altCt } = await supabase.from('contracts').select('*').eq('terminal_id', terminalId);
        if (altCt) setContracts(altCt.map(c => ({ ...c, name: c.contract_name || c.name || c.nome })));
      } else {
        setContracts((ctData || []).map(c => ({ ...c, name: c.contract_name || c.name || c.nome })));
      }

      // Pega Insumos Secundarios do Dia
      const { data: mealsData, error: mealsErr } = await supabase
        .from('secondary_meals')
        .select('*')
        .eq('date', currentDate)
        .eq('terminal_id', terminalId)
        .order('created_at', { ascending: false });

      if (mealsErr && mealsErr.code !== '42P01') throw mealsErr;
      setItems(mealsData || []);
    } catch (err: any) {
      console.error('Erro ao buscar extras:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, terminalId]);

  useEffect(() => {
    fetchBaseData();
  }, [fetchBaseData]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return alert('Preencha o nome do insumo ou lote!');
    if (!formContract && formType !== 'Cafe') {
       if (!confirm("Tem certeza que deseja adicionar Jantar/Lanche sem Centro de Custo?")) return;
    }

    setAdding(true);
    try {
      const payload = {
        date: currentDate,
        meal_type: formType,
        item_name: formName,
        quantity: Math.max(1, formQty),
        contract_name: formContract || null,
        terminal_id: terminalId
      };

      const { error } = await supabase.from('secondary_meals').insert([payload]);
      if (error) {
         if (error.code === '42P01') throw new Error('Corte o banco: A tabela secondary_meals ainda precisa ser criada usando o código SQL.');
         throw error;
      }

      setFormName('');
      setFormQty(1);
      if (formType !== 'Cafe') setFormContract(''); // Keep contract for next entry if needed but safer to reset
      fetchBaseData();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    try {
      const { error } = await supabase.from('secondary_meals').delete().eq('id', id).eq('terminal_id', terminalId);
      if (error) throw error;
      fetchBaseData();
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // Separando itens por categoria
  const cafes = items.filter(i => i.meal_type === 'Cafe');
  const jantares = items.filter(i => i.meal_type === 'Jantar');
  const lanches = items.filter(i => i.meal_type === 'Lanche');

  const renderSection = (title: string, list: any[], icon: any, colorClass: string, bgClass: string) => (
    <div className={cn("rounded-2xl border p-6 shadow-sm", bgClass)}>
      <h3 className={cn("font-manrope font-extrabold text-lg flex items-center gap-2 mb-4", colorClass)}>
        {React.createElement(icon, { className: "w-5 h-5" })} {title}
      </h3>
      
      {list.length === 0 ? (
        <p className="text-sm text-slate-400 font-medium py-4 text-center">Nenhum registro para hoje.</p>
      ) : (
        <div className="space-y-3">
          {list.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group">
              <div>
                 <p className="font-bold text-[#111d23] flex items-center gap-2">
                   <span className={cn("px-2 py-0.5 rounded-full text-xs font-black", colorClass.replace('text-', 'bg-').concat('/10'))}>
                     {item.quantity}x
                   </span>
                   {item.item_name}
                 </p>
                 {item.contract_name && (
                   <p className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-widest">
                     CC: <span className="text-[#004354]">{item.contract_name}</span>
                   </p>
                 )}
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111d23] tracking-tight font-manrope">Insumos & Extras</h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Lotes globais de Café, Jantar e Lanches Avulsos.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center gap-2 bg-white px-4 py-2.5 text-slate-700 rounded-xl border border-slate-200/50 shadow-sm">
            <Calendar className="w-4 h-4 text-[#004354]" />
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-xs md:text-sm cursor-pointer w-full"
            />
          </div>
          <button 
            onClick={fetchBaseData}
            className="p-3 bg-white text-slate-700 rounded-xl flex items-center justify-center border border-slate-200/50 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* FORMULÁRIO DE ADIÇÃO */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-[0px_20px_40px_rgba(17,29,35,0.04)] h-fit sticky top-20">
          <h2 className="font-manrope font-bold text-[#111d23] border-b border-slate-100 pb-4 mb-5">Novo Registro Diário</h2>
          
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categoria</label>
              <div className="flex gap-1 p-1 bg-slate-100/50 rounded-xl border border-slate-100">
                 <button type="button" onClick={() => setFormType('Cafe')} className={cn("flex-1 py-2.5 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-tighter", formType === 'Cafe' ? "bg-amber-100 text-amber-800 shadow-sm border border-amber-200" : "text-slate-500 hover:bg-slate-100")}>Café</button>
                 <button type="button" onClick={() => setFormType('Jantar')} className={cn("flex-1 py-2.5 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-tighter", formType === 'Jantar' ? "bg-[#004354] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100")}>Jantar</button>
                 <button type="button" onClick={() => setFormType('Lanche')} className={cn("flex-1 py-2.5 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-tighter", formType === 'Lanche' ? "bg-purple-100 text-purple-700 shadow-sm border border-purple-200" : "text-slate-500 hover:bg-slate-100")}>Lanche</button>
              </div>
            </div>

            <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Descrição do Pedido (Insumos/Lote)</label>
               <input 
                  type="text" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: 50 Pães de Sal e Manteiga"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none"
               />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2 sm:col-span-1">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantidade</label>
                 <input 
                    type="number" 
                    min="1"
                    value={formQty}
                    onChange={e => setFormQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#004354]/20 outline-none"
                 />
               </div>
               <div className="col-span-2 sm:col-span-1">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex justify-between">
                    Centro Custo 
                    {formType === 'Cafe' && <span className="text-[#004354]/50">Opcional</span>}
                 </label>
                 <select 
                    value={contracts.some(c => c.name === formContract) || !formContract ? formContract : 'custom_mapped'}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        const customCT = prompt('Digite o nome do Novo Centro de Custo:');
                        if (customCT && customCT.trim() !== '') {
                          setFormContract(customCT.trim());
                        }
                      } else if (e.target.value !== 'custom_mapped') {
                        setFormContract(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold focus:ring-2 focus:ring-[#004354]/20 outline-none cursor-pointer"
                 >
                    <option value="">Nenhum/Rateio</option>
                    {contracts && contracts.map(c => (
                       <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {formContract && !contracts.some(c => c.name === formContract) && (
                       <option value="custom_mapped">{formContract}</option>
                    )}
                    <option value="custom" className="text-[#004354] font-bold">+ Novo Customizado</option>
                 </select>
               </div>
            </div>

            <button 
              type="submit"
              disabled={adding}
              className="w-full mt-4 bg-[#004354] hover:bg-[#005c72] text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {adding ? 'Lançando...' : 'Lançar no Dia'}
            </button>
          </form>
        </div>

        {/* LISTAGEM DOS PEDIDOS DO DIA */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           {renderSection('Pedidos de Café da Manhã', cafes, Coffee, 'text-amber-600', 'bg-amber-50/30 border-amber-100')}
           {renderSection('Lotes de Jantar', jantares, Moon, 'text-[#004354]', 'bg-slate-50/50 border-slate-200')}
           {renderSection('Lanches Adicionais', lanches, Package, 'text-purple-600', 'bg-purple-50/30 border-purple-100')}
        </div>

      </div>
    </Layout>
  );
}
