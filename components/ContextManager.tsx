"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Copy, Check, Loader, ChevronDown, ChevronUp } from 'react-feather'

export interface ContextEntry {
  statement: string
  proof?: string
  date?: string
}

export interface UserContext {
  demographic: ContextEntry[]
  interests: ContextEntry[]
  relationships: ContextEntry[]
  events: ContextEntry[]
  instructions: ContextEntry[]
}

interface CategoryConfig {
  key: keyof UserContext
  label: string
  description: string
  placeholder: string
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'demographic',
    label: '1. Información demográfica',
    description: 'Nombres preferidos, profesión, educación y residencia general.',
    placeholder: 'Ej: El usuario se llama Juan.',
  },
  {
    key: 'interests',
    label: '2. Intereses y preferencias',
    description: 'Participaciones activas y sostenidas en el tiempo.',
    placeholder: 'Ej: El usuario practica yoga regularmente.',
  },
  {
    key: 'relationships',
    label: '3. Relaciones',
    description: 'Relaciones confirmadas y sostenidas en el tiempo.',
    placeholder: 'Ej: El usuario tiene una pareja llamada Ana.',
  },
  {
    key: 'events',
    label: '4. Eventos, proyectos y planes con fecha',
    description: 'Registro de actividades recientes y significativas.',
    placeholder: 'Ej: El usuario lanzó un proyecto en enero 2026.',
  },
  {
    key: 'instructions',
    label: '5. Instrucciones',
    description: 'Reglas explícitas para seguir en el futuro ("siempre haz X", "nunca hagas Y").',
    placeholder: 'Ej: El usuario prefiere respuestas cortas y directas.',
  },
]

const EMPTY_CONTEXT: UserContext = {
  demographic: [],
  interests: [],
  relationships: [],
  events: [],
  instructions: [],
}

function newEntry(): ContextEntry {
  return { statement: '', proof: '', date: new Date().toISOString().slice(0, 10) }
}

export default function ContextManager() {
  const [context, setContext] = useState<UserContext>(EMPTY_CONTEXT)
  const [formatted, setFormatted] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<keyof UserContext>>(
    new Set(['demographic', 'interests', 'relationships', 'events', 'instructions'])
  )
  const [showExport, setShowExport] = useState(false)

  const loadContext = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/context', { credentials: 'include' })
      const data = await res.json()
      if (data.ok) {
        setContext(data.context ?? EMPTY_CONTEXT)
        setFormatted(data.formatted ?? '')
      }
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar el contexto' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadContext()
  }, [loadContext])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/context', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al guardar')
      setFormatted(data.formatted ?? '')
      setMessage({ type: 'success', text: 'Contexto guardado correctamente' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage({ type: 'error', text: 'No se pudo copiar al portapapeles' })
    }
  }

  const toggleSection = (key: keyof UserContext) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const addEntry = (key: keyof UserContext) => {
    setContext((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), newEntry()] }))
  }

  const removeEntry = (key: keyof UserContext, idx: number) => {
    setContext((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((_, i) => i !== idx),
    }))
  }

  const updateEntry = (key: keyof UserContext, idx: number, field: keyof ContextEntry, value: string) => {
    setContext((prev) => {
      const updated = [...(prev[key] ?? [])]
      updated[idx] = { ...updated[idx], [field]: value }
      return { ...prev, [key]: updated }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="text-[#39FF14] animate-spin" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Description */}
      <p className="text-[#94a3b8] text-xs leading-relaxed">
        Almacena información sobre el usuario para importar contexto en otros asistentes de IA.
        Las entradas se exportan en un bloque de texto estructurado listo para pegar en cualquier asistente.
      </p>

      {/* Feedback message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-[#39FF14]/5 border-[#39FF14]/20 text-[#39FF14]'
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <Check size={14} /> : null}
          {message.text}
        </div>
      )}

      {/* Category sections */}
      {CATEGORIES.map(({ key, label, description, placeholder }) => {
        const entries = context[key] ?? []
        const isExpanded = expandedSections.has(key)
        return (
          <div key={key} className="border border-white/5 rounded-xl overflow-hidden">
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between p-3 bg-white/3 hover:bg-white/5 transition-colors"
              onClick={() => toggleSection(key)}
            >
              <div className="text-left">
                <span className="text-white text-xs font-bold">{label}</span>
                <p className="text-[#94a3b8] text-[10px] mt-0.5 opacity-70">{description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[#39FF14] text-[10px] font-mono">{entries.length}</span>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-[#94a3b8]" />
                ) : (
                  <ChevronDown size={14} className="text-[#94a3b8]" />
                )}
              </div>
            </button>

            {/* Entries */}
            {isExpanded && (
              <div className="p-3 space-y-3 bg-black/20">
                {entries.map((entry, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-lg bg-white/3 border border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">
                        Afirmación
                      </label>
                      <input
                        type="text"
                        value={entry.statement}
                        onChange={(e) => updateEntry(key, idx, 'statement', e.target.value)}
                        placeholder={placeholder}
                        className="w-full cyber-input text-xs h-9"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">
                          Cita literal (prueba)
                        </label>
                        <input
                          type="text"
                          value={entry.proof ?? ''}
                          onChange={(e) => updateEntry(key, idx, 'proof', e.target.value)}
                          placeholder='Ej: "llámame Juan"'
                          className="w-full cyber-input text-xs h-9"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold ml-1">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={entry.date ?? ''}
                          onChange={(e) => updateEntry(key, idx, 'date', e.target.value)}
                          className="w-full cyber-input text-xs h-9"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeEntry(key, idx)}
                      className="flex items-center gap-1 text-red-400/60 hover:text-red-400 text-[10px] transition-colors mt-1"
                    >
                      <Trash2 size={11} />
                      Eliminar entrada
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addEntry(key)}
                  className="flex items-center gap-2 text-[#39FF14]/60 hover:text-[#39FF14] text-xs transition-colors py-1"
                >
                  <Plus size={14} />
                  Añadir entrada
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full btn-neon py-3 disabled:opacity-50"
      >
        {isSaving ? <Loader className="animate-spin text-black" size={18} /> : 'Guardar Contexto'}
      </button>

      {/* Export section */}
      <div className="border border-white/5 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3 bg-white/3 hover:bg-white/5 transition-colors"
          onClick={() => setShowExport((v) => !v)}
        >
          <span className="text-white text-xs font-bold">Exportar contexto</span>
          {showExport ? (
            <ChevronUp size={14} className="text-[#94a3b8]" />
          ) : (
            <ChevronDown size={14} className="text-[#94a3b8]" />
          )}
        </button>

        {showExport && (
          <div className="p-3 space-y-3 bg-black/20">
            <p className="text-[#94a3b8] text-[10px]">
              Copia este bloque de texto y pégalo al inicio de una conversación con cualquier asistente de IA.
            </p>
            <div className="relative">
              <pre className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-[10px] text-[#94a3b8] font-mono whitespace-pre-wrap overflow-auto max-h-64 leading-relaxed">
                {formatted || '(guarda el contexto primero para ver la vista previa)'}
              </pre>
              <button
                onClick={handleCopy}
                disabled={!formatted}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[10px] font-bold hover:bg-[#39FF14]/20 transition-colors disabled:opacity-40"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
