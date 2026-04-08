'use client';

import React from 'react';
import { 
  ClipboardCheck, 
  Utensils, 
  Users, 
  Settings, 
  LayoutDashboard,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Controle Diário', icon: ClipboardCheck, href: '/' },
  { name: 'Histórico de Refeições', icon: Utensils, href: '/historico' },
  { name: 'Gestão de Colaboradores', icon: Users, href: '/gestao' },
  { name: 'Diagnóstico Supabase', icon: Database, href: '/debug-supabase' },
  { name: 'Configurações', icon: Settings, href: '/configuracoes' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem-3.5rem)] w-64 bg-[#f1f5f9] border-r border-slate-200/50 flex-col py-6 z-30">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#004354] rounded-lg flex items-center justify-center text-white font-bold">
            FC
          </div>
          <div>
            <h2 className="text-lg font-black text-[#004354] leading-tight font-manrope">FoodControl</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Industrial Facility A</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all text-sm font-medium",
                isActive 
                  ? "bg-white text-[#004354] shadow-sm translate-x-1" 
                  : "text-slate-600 hover:bg-slate-200 hover:text-[#004354]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-[#004354]" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <div className="bg-white/50 p-4 rounded-xl border border-slate-200/50">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Status da Unidade</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
            <span className="text-xs font-semibold text-[#004354]">Operacional</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
