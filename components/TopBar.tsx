'use client';

import React from 'react';
import { ShoppingCart, Menu, Bell, LogOut, Building2, ChevronDown, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useTerminal } from './Layout';

import Image from 'next/image';

interface TopBarProps {
  toggleMobileMenu: () => void;
}

export default function TopBar({ toggleMobileMenu }: TopBarProps) {
  const router = useRouter();
  const { activeTerminal, userRole, setTerminalId } = useTerminal();

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      await supabase.auth.signOut();
      localStorage.removeItem('active_terminal_id');
      router.push('/login');
    }
  };

  const handleSwitchTerminal = () => {
    if (confirm('Deseja alternar para outra unidade logística?')) {
      setTerminalId(null);
    }
  };

  const today = new Date();
  const formattedDate = format(today, "dd 'de' MMMM", { locale: ptBR });

  return (
    <header className="fixed top-0 w-full z-40 bg-white/85 backdrop-blur-md h-16 flex justify-between items-center px-4 md:px-6 border-b border-slate-200/50">
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        {/* Toggle Menu Mobile */}
        <button 
          onClick={toggleMobileMenu}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2">
           <span className="text-lg md:text-xl font-black text-[#004354] tracking-tighter font-manrope whitespace-nowrap overflow-hidden text-ellipsis">
             FoodControl
           </span>
           
           {activeTerminal && (
             <div className="flex items-center gap-2 ml-2 md:ml-4 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 group">
               <Building2 className="w-3.5 h-3.5 text-teal-600" />
               <span className="text-[11px] font-black text-teal-700 uppercase tracking-tight">
                 {activeTerminal.name}
               </span>
               {userRole === 'super_admin' && (
                 <button 
                   onClick={handleSwitchTerminal}
                   className="ml-1 p-0.5 hover:bg-teal-200/50 rounded transition-colors text-teal-400 group-hover:text-teal-600"
                   title="Trocar Unidade"
                 >
                   <ChevronDown className="w-3.5 h-3.5" />
                 </button>
               )}
             </div>
           )}
        </div>
        
        <div className="hidden lg:block h-6 w-[1px] bg-slate-200 mx-2"></div>
        <span className="hidden lg:block font-manrope text-sm font-semibold tracking-tight text-slate-400 capitalize whitespace-nowrap overflow-hidden text-ellipsis">
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <Link 
          href="/pedidos"
          className="bg-[#004354] text-white p-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-[#005c72] transition-all shadow-lg shadow-[#004354]/10 group"
          title="Fechar Pedido"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="hidden md:inline">Fechar Pedido</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
          
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-[#b7eaff] overflow-hidden cursor-pointer relative shadow-sm">
            <Image 
              src="https://picsum.photos/seed/manager/100/100" 
              alt="Perfil" 
              fill
              sizes="40px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
