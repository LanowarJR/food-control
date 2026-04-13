'use client';

import React from 'react';
import { 
  ClipboardCheck, 
  Utensils, 
  Users, 
  Settings, 
  LayoutDashboard,
  Coffee,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Controle Diário', icon: ClipboardCheck, href: '/' },
  { name: 'Insumos & Extras', icon: Coffee, href: '/extras' },
  { name: 'Histórico de Refeições', icon: Utensils, href: '/historico' },
  { name: 'Gestão de Colaboradores', icon: Users, href: '/gestao' },
  { name: 'Configurações', icon: Settings, href: '/configuracoes' },
];

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed left-0 top-0 md:top-16 h-full md:h-[calc(100vh-4rem-3.5rem)] w-64 bg-[#f1f5f9] border-r border-slate-200/50 flex flex-col py-6 z-30 transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Header na Sidebar (Versão Mobile) */}
      <div className="px-6 mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 relative overflow-hidden rounded-xl shadow-sm border border-slate-200 bg-white">
            <Image 
              src="/logo.png" 
              alt="FoodControl Logo" 
              fill 
              className="object-cover scale-150"
            />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#004354] leading-tight font-manrope">FoodControl</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Gestão Central</p>
          </div>
        </div>
        
        {/* Botão Fechar no Mobile */}
        <button 
          onClick={closeSidebar}
          className="p-2 -mr-2 text-slate-400 hover:text-slate-600 md:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl mx-2 transition-all text-sm font-bold",
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
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Unidade Logística</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-black text-[#004354] uppercase">Sistema Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
