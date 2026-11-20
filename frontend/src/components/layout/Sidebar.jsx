import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Car,
  GitCompare,
  SlidersHorizontal,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Layers
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
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Executive overview & metrics',
      icon: LayoutDashboard,
    },
    {
      id: 'documents',
      label: 'Document Management',
      description: 'PDF brochures & indexing',
      icon: FileText,
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      description: 'Grounded RAG brochure Q&A',
      icon: MessageSquare,
      badge: 'RAG',
    },
    {
      id: 'catalog',
      label: 'Vehicle Catalog',
      description: 'Engineering specifications',
      icon: Car,
    },
    {
      id: 'comparison',
      label: 'Comparison Studio',
      description: 'Side-by-side & radar evaluation',
      icon: GitCompare,
    },
    {
      id: 'variants',
      label: 'Variant Analyzer',
      description: 'Trim differentials & specs',
      icon: SlidersHorizontal,
    },
  ];

  const ollamaOnline = health?.ollama?.status === 'connected';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-900 text-white shadow-xs">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900">
                  AutoMate
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
                Automotive Intelligence
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors relative ${
                  isActive
                    ? 'bg-blue-50/80 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-blue-600" />
                )}
                <div
                  className={`p-1.5 rounded transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-100/60'
                      : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Engine Diagnostics Widget */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2">
          <div className="p-2.5 rounded-md bg-white border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-slate-600" /> Ollama Local AI
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded ${
                  ollamaOnline
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    ollamaOnline ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                {ollamaOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Model:</span>
              <span className="font-mono text-slate-700 font-medium truncate max-w-[120px]">
                {health?.ollama?.target_model || 'qwen3:1.7b'}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Embedding:</span>
              <span className="font-mono text-slate-700 font-medium">all-minilm (384d)</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-600" /> pgvector Store
            </span>
            <span className="font-mono text-emerald-600 font-medium">Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}
