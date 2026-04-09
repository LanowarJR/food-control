'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { 
  History, 
  UtensilsCrossed, 
  Send, 
  Save,
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function PedidosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Real Data State
  const [totalPresentes, setTotalPresentes] = useState(0);
  const [agrupamento, setAgrupamento] = useState<{name: string, count: number}[]>([]);

  // Menu State
  const [prot1Name, setProt1Name] = useState('Proteína Principal');
  const [prot1Qty, setProt1Qty] = useState(0);
  
  const [prot2Name, setProt2Name] = useState('Proteína Leve');
  const [prot2Qty, setProt2Qty] = useState(0);
  
  const [obs, setObs] = useState('');

  const fetchRealData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Fetch base collaborators
      const { data: colabData, error: colabError } = await supabase.from('collaborators').select('*');
      if (colabError) throw colabError;

      // Deduplicate base (mesma lógica do dashboard principal)
      const dedupMap = new Map();
      (colabData || []).forEach(emp => {
        const nome = emp.nome || emp.name || 'Sem Nome';
        if (!dedupMap.has(nome)) dedupMap.set(nome, { nome });
      });
      const uniqueColabs = Array.from(dedupMap.values());

      // 2. Fetch presenças e status do dia
      const { data: attendanceData, error: attError } = await supabase
        .from('daily_attendance')
        .select('*')
        .eq('date', today);
      if (attError && attError.code !== '42P01') throw attError;
      
      const attendanceMap = new Map();
      (attendanceData || []).forEach(att => {
        attendanceMap.set(att.collaborator_name, att);
      });

      // 3. Cruzamento e descoberta dos Presentes REAIS (Implícitos + Mapeados + Extras)
      const nomesPresentes = new Set<string>();

      // A) Varre base fixa: se o status salvo for 'Presente' ou se NÃO tiver salvo nada (default Presente)
      uniqueColabs.forEach(emp => {
        const att = attendanceMap.get(emp.nome);
        const statusAtual = att?.status || 'Presente';
        if (statusAtual === 'Presente') nomesPresentes.add(emp.nome);
      });

      // B) Varre os Avulsos/Extras: pessoas no attendanceMap que não estão na base fixa
      attendanceMap.forEach(att => {
        if (!dedupMap.has(att.collaborator_name) && att.status === 'Presente') {
          nomesPresentes.add(att.collaborator_name);
        }
      });

      setTotalPresentes(nomesPresentes.size);

      // 4. Fetch de Mapeamento de Custos para rateio
      const { data: mappings } = await supabase.from('food_cost_mapping').select('*');
      const mapHash = new Map();
      (mappings || []).forEach(m => {
        mapHash.set(m.collaborator_name, m.contract_name || 'Geral/Não Alocado');
      });

      // 5. Agrupa apenas os Nomes Presentes por contrato
      const groups = new Map<string, number>();
      nomesPresentes.forEach(nome => {
        const contrato = mapHash.get(nome) || 'Geral/Não Alocado';
        groups.set(contrato, (groups.get(contrato) || 0) + 1);
      });

      // Converte para array para renderizar ordenado
      const sortedGroups = Array.from(groups.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a,b) => b.count - a.count);

      setAgrupamento(sortedGroups);

    } catch (err: any) {
      console.error('Erro ao calcular fechamento:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]);

  const handleSaveHistory = async () => {
    // Validação matemática
    if (prot1Qty + prot2Qty !== totalPresentes && totalPresentes > 0) {
      if(!confirm(`Aviso: A soma das carnes (${prot1Qty + prot2Qty}) é diferente do Total de Presentes (${totalPresentes}). Deseja salvar mesmo assim?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        date: new Date().toISOString().split('T')[0],
        meals: prot1Qty + prot2Qty || totalPresentes,
        cost_center: 'Geral Consolidado',
        contract: 'Fechamento Total',
        obs: obs || `${prot1Name}: ${prot1Qty}, ${prot2Name}: ${prot2Qty}`,
        status: 'Validated'
      };
      
      const { error } = await supabase.from('meal_history').insert([payload]);
      
      if (error) {
        if (error.code === '42P01') {
          alert('Aviso: Tabela "meal_history" não encontrada no Supabase. Crie-a se desejar armazenar oficialmente.');
        } else {
          throw error;
        }
      } else {
        alert('Pedido salvo no histórico de longo prazo!');
      }
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToWhatsApp = () => {
    let agrupamentoTxt = agrupamento.map(g => `- ${g.name}: ${g.count} UND`).join('\n');
    if (agrupamento.length === 0) agrupamentoTxt = "- Sem rateios específicos capturados no cenário de hoje.";

    const text = `*Resumo de Almoço - FoodControl*\n\n*TOTAL CÁLCULO DE PRESENÇA:* ${totalPresentes} UND\n\n*PROTEÍNAS (PEDIDO FINAL)*\n- ${prot1Name}: ${prot1Qty}\n- ${prot2Name}: ${prot2Qty}\n\n*DIVISÃO / RATEIO INTERNO*\n${agrupamentoTxt}\n\n*OBSERVAÇÕES:*\n${obs || 'Nenhuma'}`;
    navigator.clipboard.writeText(text);
    alert('Texto de requisição copiado para o WhatsApp com sucesso!');
  };

  return (
    <Layout>
      <header className="mb-8 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#111d23] font-manrope tracking-tight mb-1">Fechamento do Pedido</h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">Resumo em tempo real dos Presentes e consolidação.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={fetchRealData}
              className="flex-1 md:flex-none justify-center bg-white text-slate-700 px-5 py-3 md:py-2.5 rounded-xl border border-slate-200/50 shadow-sm font-inter font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 flex items-center gap-2"
            >
              <RefreshCw className={cn("w-4 h-4 text-[#004354]", loading && "animate-spin")} />
              Recalcular
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Summary Card */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Validador de Totais Alerta */}
          {(prot1Qty + prot2Qty !== totalPresentes) && totalPresentes > 0 && (
             <div className="bg-amber-50 text-amber-800 border border-amber-200 p-4 rounded-xl text-sm font-medium flex justify-between items-center">
               <span>⚠️ O total de Proteínas digitadas ({prot1Qty + prot2Qty}) não bate com os Presentes do dia ({totalPresentes}). Verifique!</span>
             </div>
          )}

          {/* Totals Breakdown */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden border border-slate-200/50">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <UtensilsCrossed className="w-16 md:w-24 h-16 md:h-24" />
            </div>
            
            <h3 className="text-slate-400 font-manrope font-bold text-[10px] uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004354]"></span>
              Leitura em Tempo Real (Painel Diário)
            </h3>
            
            {loading ? (
              <div className="flex justify-center py-10">
                <RefreshCw className="w-8 h-8 text-[#004354] animate-spin opacity-20" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                
                {/* Total Geral de Presentes */}
                <div className="col-span-2 lg:col-span-1 bg-teal-50/50 p-6 rounded-2xl border border-teal-100 shadow-sm">
                  <p className="text-teal-600 font-inter text-[10px] font-black uppercase tracking-widest mb-1">Pessoas em Campo</p>
                  <p className="text-4xl font-manrope font-black text-[#004354]">{totalPresentes} <span className="text-xs font-bold text-teal-600 opacity-60">UND</span></p>
                </div>

                {/* Subdivisões por contrato */}
                {agrupamento.slice(0, 5).map((grupo, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200/50 flex flex-col justify-between">
                    <p className="text-slate-500 font-inter text-[10px] font-bold uppercase tracking-tighter mb-2 line-clamp-2" title={grupo.name}>{grupo.name}</p>
                    <p className="text-3xl font-manrope font-extrabold text-teal-700">
                      {grupo.count} <span className="text-base font-medium text-slate-400">UND</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Specific Items Grid - MANUAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50 focus-within:ring-2 focus-within:ring-[#004354]/10 transition-all">
              <div className="flex flex-col mb-6 gap-2">
                <input 
                  type="text"
                  value={prot1Name}
                  onChange={e => setProt1Name(e.target.value)}
                  className="font-manrope font-bold text-xl text-[#111d23] border-b border-dashed border-slate-300 focus:border-[#004354] bg-transparent outline-none pb-1"
                />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Opção 1</p>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Quantidade Distribuída</label>
                <input 
                  type="number" 
                  min="0"
                  value={prot1Qty}
                  onChange={(e) => setProt1Qty(Number(e.target.value))}
                  className="w-full bg-[#f4faff] border-none rounded-lg font-manrope font-bold text-2xl text-[#004354] p-4 text-center focus:ring-2 focus:ring-[#004354]/20 outline-none"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50 focus-within:ring-2 focus-within:ring-[#004354]/10 transition-all">
              <div className="flex flex-col mb-6 gap-2">
                <input 
                  type="text"
                  value={prot2Name}
                  onChange={e => setProt2Name(e.target.value)}
                  className="font-manrope font-bold text-xl text-[#111d23] border-b border-dashed border-slate-300 focus:border-[#004354] bg-transparent outline-none pb-1"
                />
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Opção 2</p>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Quantidade Distribuída</label>
                <input 
                  type="number" 
                  min="0"
                  value={prot2Qty}
                  onChange={(e) => setProt2Qty(Number(e.target.value))}
                  className="w-full bg-[#f4faff] border-none rounded-lg font-manrope font-bold text-2xl text-[#004354] p-4 text-center focus:ring-2 focus:ring-[#004354]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Identificação Adicional */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
            <h3 className="font-manrope font-bold text-[#111d23] mb-4">Informações e Exceções</h3>
            <textarea 
              className="w-full bg-[#f4faff] border-none rounded-lg text-sm text-[#111d23] p-4 h-24 focus:ring-2 focus:ring-[#004354]/20 outline-none resize-none"
              placeholder="Ex: Mandar 2 sem pimenta, o número final fecha com o extra da noite..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            ></textarea>
          </div>
        </section>

        {/* Sidebar Actions */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-[#004354] p-8 rounded-xl text-white shadow-lg shadow-[#004354]/10 flex flex-col items-center text-center">
            <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-manrope font-bold text-xl mb-2">Enviar ao Fornecedor</h3>
            <p className="text-white/70 text-sm mb-8 px-4">Dispare o rateio oficial via Mensagem.</p>
            <button 
              onClick={copyToWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-manrope font-extrabold flex items-center justify-center gap-3 transition-all transform active:scale-95 duration-150 shadow-md"
            >
              <MessageCircle className="w-6 h-6" />
              Copiar para WhatsApp
            </button>
          </div>

          <div className="bg-slate-100 p-6 rounded-xl border border-slate-200/50">
            <p className="text-xs text-slate-500 font-inter font-bold uppercase tracking-widest mb-4">Ação Administrativa</p>
            <button 
              onClick={handleSaveHistory}
              disabled={saving}
              className="w-full bg-[#005c72] text-white hover:bg-[#004354] py-4 rounded-xl font-manrope font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Registrando...' : 'Gravar Histórico Oficial'}
            </button>
            <p className="mt-4 text-[11px] text-center text-slate-400">Salva os dados do pedido montado acima para registro de fechamento financeiro.</p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
