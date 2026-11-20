import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Car,
  GitCompare,
  SlidersHorizontal,
  ShieldAlert,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { api } from '../../services/api';

export function Sidebar({ currentTab, setCurrentTab, isMobileOpen, setIsMobileOpen }) {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        setHealth(res.data);
      } catch (e) {
        setHealth({ status: 'offline', ollama: { status: 'disconnected' } });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'chat',
      label: 'AI Assistant',
      description: 'Brochure RAG & Q&A',
      icon: MessageSquare,
      badge: 'Grounded',
    },
    {
      id: 'catalog',
      label: 'Vehicle Catalog',
      description: 'Engineering Profiles',
      icon: Car,
    },
    {
      id: 'comparison',
      label: 'Comparison Studio',
      description: 'Side-by-side & Radar',
      icon: GitCompare,
    },
    {
      id: 'variants',
      label: 'Variant Analyzer',
      description: 'Trim Specs & Deltas',
      icon: SlidersHorizontal,
    },
    {
      id: 'admin',
      label: 'Admin & Brochures',
      description: 'PDF Ingestion & Chunks',
      icon: ShieldAlert,
    },
  ];

  const ollamaOnline = health?.ollama?.status === 'connected';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-navy-950 border-r border-navy-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-navy-800/80 bg-navy-950/50">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-cyan/20 to-navy-800 border border-accent-cyan/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <Car className="w-5 h-5 text-accent-cyan" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-emerald animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-emerald" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AutoMate <span className="text-accent-cyan">AI</span>
              </h1>
              <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Automotive Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 relative ${
                  isActive
                    ? 'bg-navy-900 border border-accent-cyan/30 text-white shadow-[0_4px_20px_-4px_rgba(56,189,248,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900/40 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-accent-cyan shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'bg-navy-800/60 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Engine Diagnostics Widget */}
        <div className="p-4 border-t border-navy-800/80 bg-navy-950/80 space-y-2.5">
          <div className="p-3 rounded-xl bg-navy-900/70 border border-navy-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-accent-cyan" /> Ollama Engine
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  ollamaOnline
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                }`}
              >
                {ollamaOnline ? (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5" /> Online
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-2.5 h-2.5" /> Offline
                  </>
                )}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Model:</span>
                <span className="font-mono text-slate-200">
                  {health?.ollama?.target_model || 'qwen3:1.7b'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Embedding:</span>
                <span className="font-mono text-slate-200">
                  {health?.ollama?.embed_model || 'all-minilm'} (384d)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-accent-emerald" /> Supabase pgvector
            </span>
            <span className="font-mono text-slate-400">Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
