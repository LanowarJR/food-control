'use client';

import React from 'react';
import { ShoppingCart, Calendar, Bell, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

import Image from 'next/image';

export default function TopBar() {
  const today = new Date();
  const formattedDate = format(today, "dd 'de' MMMM, yyyy", { locale: ptBR });

  return (
    <header className="fixed top-0 w-full z-40 bg-white/85 backdrop-blur-md h-16 flex justify-between items-center px-6 border-b border-slate-200/50">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-[#004354] tracking-tighter font-manrope">Architectural Ledger</span>
        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
        <span className="font-manrope text-sm font-semibold tracking-tight text-[#004354]">{formattedDate}</span>
      </div>

      <div className="flex items-center gap-6">
        <Link 
          href="/pedidos"
          className="bg-gradient-to-br from-[#004354] to-[#005c72] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#004354]/10"
        >
          <ShoppingCart className="w-5 h-5" />
          Fechar Pedido
        </Link>

        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <Calendar className="w-5 h-5" />
          </button>
          <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-[#8dd0e9] overflow-hidden cursor-pointer relative">
            <Image 
              src="https://picsum.photos/seed/manager/100/100" 
              alt="Profile" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
