'use client';

import React from 'react';
import { Sunrise, Sun, Moon, CheckCircle } from 'lucide-react';

export default function BottomBar() {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-14 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 flex justify-center items-center gap-8 px-4 z-50 shadow-[0px_-10px_30px_rgba(17,29,35,0.04)]">
      <div className="flex items-center gap-3 bg-teal-50 text-teal-800 px-6 py-2 rounded-xl">
        <CheckCircle className="w-4 h-4 text-teal-600 fill-current" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sistema Operacional</span>
      </div>
    </footer>
  );
}
