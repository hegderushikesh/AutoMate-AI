import React from 'react'
import { Car, Cpu, ShieldCheck, Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800/80 border border-navy-600/50 text-accent-cyan text-sm font-medium">
          <Sparkles className="w-4 h-4 text-accent-cyan animate-pulse" />
          <span>Automotive Intelligence Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-accent-cyan bg-clip-text text-transparent">
          AutoMate AI
        </h1>

        <p className="text-slate-400 text-base sm:text-lg">
          Production-grade AI Assistant grounded in OEM vehicle brochures and structured engineering specifications.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-700/60 text-left">
            <Cpu className="w-6 h-6 text-accent-cyan mb-2" />
            <h3 className="font-semibold text-slate-200">Local Ollama AI</h3>
            <p className="text-xs text-slate-400 mt-1">Grounded RAG with Qwen3 & all-minilm vector embeddings.</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-700/60 text-left">
            <Car className="w-6 h-6 text-accent-emerald mb-2" />
            <h3 className="font-semibold text-slate-200">Spec Comparison</h3>
            <p className="text-xs text-slate-400 mt-1">Multi-trim and vehicle side-by-side technical evaluation.</p>
          </div>
          <div className="p-4 rounded-xl bg-navy-900/60 border border-navy-700/60 text-left">
            <ShieldCheck className="w-6 h-6 text-accent-amber mb-2" />
            <h3 className="font-semibold text-slate-200">Page Provenance</h3>
            <p className="text-xs text-slate-400 mt-1">Verified citations with exact brochure page references.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
