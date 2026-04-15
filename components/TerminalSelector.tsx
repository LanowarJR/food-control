'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  MapPin, 
  ChevronRight, 
  RefreshCw,
  Building2,
  Lock,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Terminal {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface TerminalSelectorProps {
  onSelect: (terminal: Terminal) => void;
}

export default function TerminalSelector({ onSelect }: TerminalSelectorProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTerminals() {
      try {
        console.log('TerminalSelector: Inicando busca...');
        const { data, error } = await supabase
          .from('terminals')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        setTerminals(data || []);
      } catch (err) {
        console.error('TerminalSelector Error:', err);
      } finally {
        console.log('TerminalSelector: Loading finished.');
        setLoading(false);
      }
    }
    fetchTerminals();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#001a23] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
             <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-teal-500/50 font-manrope font-bold text-xs uppercase tracking-[0.2em] animate-pulse">
            Carregando Unidades
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#001a23] overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#004354]/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6">
            <Lock className="w-3 h-3 text-teal-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Acesso Restrito - Admin</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white font-manrope tracking-tighter mb-4">
            Selecione a <span className="text-teal-400">Unidade</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto text-sm md:text-base font-medium">
            Escolha o terminal logístico que deseja gerenciar hoje. Todos os dados serão filtrados automaticamente.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          <AnimatePresence>
            {terminals.map((terminal, idx) => (
              <motion.div
                key={terminal.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredId(terminal.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(terminal)}
                className="group relative cursor-pointer"
              >
                <div className="relative h-[400px] w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:border-teal-500/50 group-hover:shadow-teal-500/20">
                  {/* Image */}
                  <Image 
                    src={terminal.image_url}
                    alt={terminal.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001a23] via-transparent to-transparent opacity-80 group-hover:opacity-90"></div>
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end">
                    <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400">Terminal Flow</span>
                      </div>
                      
                      <h2 className="text-3xl font-black text-white font-manrope mb-2">{terminal.name}</h2>
                      
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-teal-300 transition-colors">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">{terminal.slug.replace('-', ' ')}</span>
                      </div>
                    </div>

                    {/* Button like indicator */}
                    <div className="mt-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                      <div className="h-px flex-1 bg-teal-500/30 mr-4"></div>
                      <div className="bg-white text-[#001a23] w-12 h-12 rounded-full flex items-center justify-center shadow-xl">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {terminals.length === 0 && (
            <div className="col-span-full text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-slate-500 font-bold">Nenhuma unidade encontrada no banco de dados.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]"
        >
          FoodControl &copy; 2024 &bull; Gestão Industrial
        </motion.p>
      </div>
    </div>
  );
}
