'use client';

import React from 'react';
import Layout from '@/components/Layout';
import { 
  TrendingUp, 
  Filter, 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Calendar
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

const chartData = [
  { name: 'SEG', lunch: 280, dinner: 120 },
  { name: 'TER', lunch: 310, dinner: 150 },
  { name: 'QUA', lunch: 290, dinner: 110 },
  { name: 'QUI', lunch: 340, dinner: 160 },
  { name: 'SEX', lunch: 300, dinner: 140 },
  { name: 'SAB', lunch: 100, dinner: 80 },
  { name: 'DOM', lunch: 80, dinner: 60 },
];

const historyData = [
  { date: 'Oct 14, 2023', meals: 542, costCenter: 'ENG-CORE', contract: 'Main Arch B-4', obs: 'Evening shift extended...', status: 'Validated' },
  { date: 'Oct 13, 2023', meals: 489, costCenter: 'LOG-WEST', contract: 'Supply Hub Alpha', obs: 'Standard volume', status: 'Validated' },
  { date: 'Oct 12, 2023', meals: 521, costCenter: 'ENG-CORE', contract: 'Main Arch B-4', obs: 'Inclement weather adjustment', status: 'Pending Review' },
  { date: 'Oct 11, 2023', meals: 612, costCenter: 'ADMIN-01', contract: 'Headquarters', obs: 'Workshop catering included', status: 'Validated' },
];

export default function HistoricoPage() {
  return (
    <Layout>
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <span className="font-inter text-[11px] font-bold uppercase tracking-[0.2em] text-[#004354]">Visão Estratégica</span>
          <h2 className="font-manrope text-3xl font-extrabold text-[#111d23] tracking-tight">Insights do Ledger</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-slate-100 p-2 rounded-xl border border-slate-200/50">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200/50">
            <Filter className="w-4 h-4 text-[#004354]" />
            <select className="border-none p-0 focus:ring-0 text-sm font-medium bg-transparent text-slate-600 outline-none">
              <option>Todos os Contratos</option>
              <option>Main Facility B2</option>
              <option>Logistics Hub</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200/50">
            <Calendar className="w-4 h-4 text-[#004354]" />
            <span className="text-sm font-medium text-slate-600">Últimos 30 Dias</span>
          </div>
          <button className="bg-[#004354] text-white px-5 py-2 rounded-lg font-manrope text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#004354]/20 hover:scale-105 transition-transform">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Main Chart Card */}
        <div className="md:col-span-8 bg-white rounded-xl p-8 border border-slate-200/50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="font-manrope text-lg font-bold text-[#111d23]">Consumo Semanal de Refeições</h3>
              <p className="text-xs text-slate-500">Dados agregados para Café, Almoço e Jantar</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#004354]"></span>
                <span className="font-inter text-[10px] font-bold uppercase text-slate-500">Almoço</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#b4cad6]"></span>
                <span className="font-inter text-[10px] font-bold uppercase text-slate-500">Jantar</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
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
                <Bar dataKey="lunch" stackId="a" fill="#004354" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="dinner" stackId="a" fill="#b4cad6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-[#004354] to-[#005c72] rounded-xl p-6 text-white shadow-xl shadow-[#004354]/10">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="font-inter text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded">+12.4%</span>
            </div>
            <p className="font-inter text-[11px] font-bold uppercase tracking-widest text-teal-100 opacity-80">Média Mensal</p>
            <h4 className="font-manrope text-4xl font-bold tracking-tight mb-2">521</h4>
            <p className="text-xs text-teal-100/70">Média de refeições diárias este mês</p>
          </div>

          <div className="bg-slate-100 rounded-xl p-6 border border-slate-200/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="font-manrope text-sm font-bold text-[#111d23]">Alerta de Desperdício</h4>
            </div>
            <p className="text-xs text-slate-600 mb-4">O contrato nº 349 relatou um aumento de 5% nas porções não consumidas.</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-500 uppercase">Ação Necessária</span>
              <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer hover:text-[#004354]" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed History Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200/50 shadow-sm">
        <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <div>
            <h3 className="font-manrope text-lg font-bold text-[#111d23]">Histórico Geral</h3>
            <p className="text-xs text-slate-500">Detalhamento diário individual e centros de custo</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-200/50 focus:ring-2 focus:ring-[#004354]/20 text-sm w-full md:w-64 outline-none" 
              placeholder="Buscar entradas..." 
              type="text"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-4 font-inter text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                <th className="px-8 py-4 font-inter text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Refeições</th>
                <th className="px-8 py-4 font-inter text-[10px] font-bold uppercase tracking-widest text-slate-500">Centro de Custo</th>
                <th className="px-8 py-4 font-inter text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato</th>
                <th className="px-8 py-4 font-inter text-[10px] font-bold uppercase tracking-widest text-slate-500">Observações</th>
                <th className="px-8 py-4 font-inter text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historyData.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5 text-sm font-semibold text-[#111d23]">{item.date}</td>
                  <td className="px-8 py-5 text-sm text-center font-bold text-[#004354]">{item.meals}</td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">{item.costCenter}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-600">{item.contract}</td>
                  <td className="px-8 py-5 text-xs text-slate-500 italic">{item.obs}</td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                      item.status === 'Validated' ? "bg-teal-50 text-teal-700" : "bg-amber-50 text-amber-700"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        item.status === 'Validated' ? "bg-teal-500" : "bg-amber-500"
                      )}></span>
                      {item.status === 'Validated' ? 'Validado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-4 bg-slate-50/30 flex justify-between items-center border-t border-slate-100">
          <p className="text-xs text-slate-400">Mostrando {historyData.length} de 31 entradas</p>
          <div className="flex gap-2">
            <button className="p-1 rounded bg-white border border-slate-200/50 hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
            <button className="p-1 rounded bg-white border border-slate-200/50 hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
