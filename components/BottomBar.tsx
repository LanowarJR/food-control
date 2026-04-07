'use client';

import React from 'react';
import { Sunrise, Sun, Moon, CheckCircle } from 'lucide-react';

export default function BottomBar() {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-14 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 flex justify-center items-center gap-8 px-4 z-50 shadow-[0px_-10px_30px_rgba(17,29,35,0.04)]">
      <div className="flex items-center gap-2 px-6 py-1 text-slate-500 font-inter text-[11px] font-bold uppercase tracking-widest">
        <Sunrise className="w-4 h-4" />
        <span>Café da Manhã: 142</span>
      </div>

      <div className="flex flex-col items-center justify-center bg-teal-50 text-teal-800 rounded-xl px-6 py-1 scale-105 transition-all border border-teal-100">
        <div className="flex items-center gap-2 font-inter text-[11px] font-bold uppercase tracking-widest">
          <Sun className="w-4 h-4" />
          <span>Almoço: 284</span>
        </div>
        <div className="h-0.5 w-full bg-teal-500 rounded-full mt-0.5"></div>
      </div>

      <div className="flex items-center gap-2 px-6 py-1 text-slate-500 font-inter text-[11px] font-bold uppercase tracking-widest">
        <Moon className="w-4 h-4" />
        <span>Jantar: 95</span>
      </div>

      <div className="h-6 w-[1px] bg-slate-200 mx-4 hidden md:block"></div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] font-black text-[#004354] uppercase tracking-[0.2em]">Total de Refeições: 521</span>
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-teal-600 fill-current" />
        </div>
      </div>
    </footer>
  );
}
