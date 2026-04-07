'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  History, 
  UtensilsCrossed, 
  Send, 
  Save,
  MessageCircle
} from 'lucide-react';

export default function PedidosPage() {
  const [costelinha, setCostelinha] = useState(12);
  const [frango, setFrango] = useState(4);
  const [obs, setObs] = useState('');

  const total = costelinha + frango;

  const copyToWhatsApp = () => {
    const text = `*Resumo de Refeições - FoodControl*\n\nTotal Consolidado: ${total} UND\n- Costelinha assada: ${costelinha}\n- Filé de frango: ${frango}\n\nObservações: ${obs || 'Nenhuma'}`;
    navigator.clipboard.writeText(text);
    alert('Texto copiado para o WhatsApp!');
  };

  return (
    <Layout>
      {/* Header Section */}
      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111d23] font-manrope tracking-tight mb-2">Fechamento do Pedido</h1>
            <p className="text-slate-500">Resumo final e consolidação para o fornecedor.</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-inter font-bold text-xs uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center gap-2">
              <History className="w-4 h-4" />
              Ver Histórico
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Summary Card */}
        <section className="lg:col-span-8 space-y-6">
          {/* Totals Breakdown */}
          <div className="bg-white p-8 rounded-xl shadow-[0px_20px_40px_rgba(17,29,35,0.04)] relative overflow-hidden border border-slate-200/50">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <UtensilsCrossed className="w-24 h-24" />
            </div>
            <h3 className="text-slate-400 font-manrope font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004354]"></span>
              Resumo por Centro de Custo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#f4faff] p-6 rounded-xl border border-slate-200/50">
                <p className="text-slate-500 font-inter text-[11px] font-bold uppercase tracking-tighter mb-1">Total Consolidado</p>
                <p className="text-4xl font-manrope font-extrabold text-[#004354]">{total} <span className="text-lg font-medium text-slate-400">UND</span></p>
              </div>
              <div className="bg-[#f4faff] p-6 rounded-xl border border-slate-200/50">
                <p className="text-slate-500 font-inter text-[11px] font-bold uppercase tracking-tighter mb-1">Setor Telhado</p>
                <p className="text-4xl font-manrope font-extrabold text-cyan-700">15 <span className="text-lg font-medium text-slate-400">UND</span></p>
              </div>
              <div className="bg-[#f4faff] p-6 rounded-xl border border-slate-200/50">
                <p className="text-slate-500 font-inter text-[11px] font-bold uppercase tracking-tighter mb-1">Setor Predial</p>
                <p className="text-4xl font-manrope font-extrabold text-teal-700">1 <span className="text-lg font-medium text-slate-400">UND</span></p>
              </div>
            </div>
          </div>

          {/* Specific Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-manrope font-bold text-[#111d23]">Costelinha assada</h4>
                  <p className="text-xs text-slate-500">Proteína Principal</p>
                </div>
                <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Ativo</span>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Quantidade</label>
                <input 
                  type="number" 
                  value={costelinha}
                  onChange={(e) => setCostelinha(Number(e.target.value))}
                  className="w-full bg-[#f4faff] border-none rounded-lg font-manrope font-bold text-2xl text-[#004354] p-4 focus:ring-2 focus:ring-[#004354]/20"
                />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-manrope font-bold text-[#111d23]">Filé de frango</h4>
                  <p className="text-xs text-slate-500">Opção Leve</p>
                </div>
                <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Ativo</span>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute -top-2 left-3 bg-white px-1">Quantidade</label>
                <input 
                  type="number" 
                  value={frango}
                  onChange={(e) => setFrango(Number(e.target.value))}
                  className="w-full bg-[#f4faff] border-none rounded-lg font-manrope font-bold text-2xl text-[#004354] p-4 focus:ring-2 focus:ring-[#004354]/20"
                />
              </div>
            </div>
          </div>

          {/* Identificação Adicional */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/50">
            <h3 className="font-manrope font-bold text-[#111d23] mb-4">Identificação Adicional</h3>
            <textarea 
              className="w-full bg-[#f4faff] border-none rounded-lg text-sm text-[#111d23] p-4 h-24 focus:ring-2 focus:ring-[#004354]/20"
              placeholder="Ex: Adicionar 2 marmitas sem cebola para a equipe técnica..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            ></textarea>
          </div>
        </section>

        {/* Sidebar Actions */}
        <aside className="lg:col-span-4 space-y-6">
          {/* WhatsApp Share Card */}
          <div className="bg-[#004354] p-8 rounded-xl text-white shadow-lg shadow-[#004354]/10 flex flex-col items-center text-center">
            <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-manrope font-bold text-xl mb-2">Enviar ao Fornecedor</h3>
            <p className="text-white/70 text-sm mb-8 px-4">Gere o texto formatado para envio instantâneo via WhatsApp corporativo.</p>
            <button 
              onClick={copyToWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-manrope font-extrabold flex items-center justify-center gap-3 transition-all transform active:scale-95 duration-150 shadow-md"
            >
              <MessageCircle className="w-6 h-6" />
              Copiar para WhatsApp
            </button>
          </div>

          {/* Final Confirmation */}
          <div className="bg-slate-100 p-6 rounded-xl border border-slate-200/50">
            <p className="text-xs text-slate-500 font-inter font-bold uppercase tracking-widest mb-4">Ação Administrativa</p>
            <button className="w-full bg-[#005c72] text-white hover:bg-[#004354] py-4 rounded-xl font-manrope font-bold flex items-center justify-center gap-2 transition-all">
              <Save className="w-5 h-5" />
              Salvar no Histórico
            </button>
            <p className="mt-4 text-[11px] text-center text-slate-400">Ao salvar, este pedido será registrado como &quot;Finalizado&quot; no FoodControl.</p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
