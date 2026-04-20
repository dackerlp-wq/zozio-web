'use client'
import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
export interface LocalRecord {
  _id: string
  record_date: string
  record_type: 'vaccination' | 'deworming' | 'medication' | 'exam' | 'treatment' | 'surgery' | 'note'
  title: string
  description?: string
  vet_name?: string
  next_due_date?: string
}

interface Props {
  animalId?: string
  onChange?: (records: LocalRecord[]) => void
}

// ── Config ─────────────────────────────────────────────────────────────────────
const MED_TYPES = [
  { value: 'vaccination', label: 'Vakcína',   icon: '💉' },
  { value: 'deworming',   label: 'Odčervení', icon: '🐛' },
  { value: 'medication',  label: 'Lék',       icon: '💊' },
  { value: 'exam',        label: 'Vyšetření', icon: '🔬' },
  { value: 'treatment',   label: 'Ošetření',  icon: '🩺' },
  { value: 'surgery',     label: 'Operace',   icon: '🔪' },
  { value: 'note',        label: 'Poznámka',  icon: '📝' },
] as const

type RecordType = typeof MED_TYPES[number]['value']

const TYPE_SUGGESTIONS: Record<string, string[]> = {
  vaccination: ['Vzteklina', 'Kombinovaná vakcína (DHPP)', 'Bordetella', 'Leishmanióza', 'Kombinovaná (FeLV+FIV)', 'Panleukopenie'],
  deworming:   ['Milbemax', 'Drontal Plus', 'Advocate', 'Stronghold'],
  medication:  [],
  exam:        ['Vstupní veterinární vyšetření', 'Krevní testy', 'RTG snímkování', 'Ultrasonografie'],
  treatment:   ['Ošetření ran', 'Infuze', 'Chirurgický obvaz'],
  surgery:     ['Kastrace', 'Sterilizace', 'Extrakce zubu'],
  note:        [],
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2.5 rounded-md border-2 border-[#F0EDE8] bg-white text-sm text-[#2C1810] placeholder:text-[#A09890] focus:outline-none focus:border-[#E8634A] transition-colors'
const textareaCls = inputCls + ' resize-y min-h-[80px]'

// ── Helpers ────────────────────────────────────────────────────────────────────
function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function fmtDateCs(iso: string | undefined) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('cs-CZ')
  } catch {
    return iso
  }
}

function nextDueDateColor(iso: string | undefined): string {
  if (!iso) return 'text-[#8B6550]'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff > 0) return 'text-[#D97706]'   // future → amber/orange
  return 'text-[#D83030]'                  // overdue → red
}

function emptyForm(): {
  record_type: RecordType
  title: string
  record_date: string
  vet_name: string
  description: string
  next_due_date: string
} {
  return {
    record_type: 'vaccination',
    title: '',
    record_date: todayIso(),
    vet_name: '',
    description: '',
    next_due_date: '',
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export function MedicalRecordsPanel({ animalId, onChange }: Props) {
  const isEditMode = Boolean(animalId)

  // Records state
  const [records, setRecords] = useState<LocalRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add form state
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  // ── Edit mode: fetch records ───────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    if (!animalId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/animals/${animalId}/medical-records`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRecords(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(`Chyba načítání: ${e instanceof Error ? e.message : 'Neznámá'}`)
    } finally {
      setLoading(false)
    }
  }, [animalId])

  useEffect(() => {
    if (isEditMode) {
      fetchRecords()
    }
  }, [isEditMode, fetchRecords])

  // ── Notify parent in create mode ────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode && onChange) {
      onChange(records)
    }
  }, [records, isEditMode, onChange])

  // ── Handlers ────────────────────────────────────────────────────────────────
  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleAdd() {
    if (!form.title.trim()) return
    setSaving(true)
    setError(null)

    const record: LocalRecord = {
      _id: uid(),
      record_date: form.record_date || todayIso(),
      record_type: form.record_type,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      vet_name: form.vet_name.trim() || undefined,
      next_due_date: form.next_due_date || undefined,
    }

    if (isEditMode && animalId) {
      try {
        const res = await fetch(`/api/animals/${animalId}/medical-records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            record_date: record.record_date,
            record_type: record.record_type,
            title: record.title,
            description: record.description ?? null,
            vet_name: record.vet_name ?? null,
            next_due_date: record.next_due_date ?? null,
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        await fetchRecords()
      } catch (e) {
        setError(`Chyba ukládání: ${e instanceof Error ? e.message : 'Neznámá'}`)
        setSaving(false)
        return
      }
    } else {
      setRecords(prev => [record, ...prev])
    }

    setForm(emptyForm())
    setAdding(false)
    setSaving(false)
  }

  async function handleDelete(recordId: string) {
    if (isEditMode && animalId) {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/animals/${animalId}/medical-records?record_id=${recordId}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error(await res.text())
        await fetchRecords()
      } catch (e) {
        setError(`Chyba mazání: ${e instanceof Error ? e.message : 'Neznámá'}`)
        setLoading(false)
      }
    } else {
      setRecords(prev => prev.filter(r => r._id !== recordId))
    }
  }

  const typeConfig = (t: string) => MED_TYPES.find(m => m.value === t)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-3 px-3.5 py-2.5 rounded-lg bg-[#FCEBEB] text-[#D83030] text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Existing records list */}
      {loading && records.length === 0 ? (
        <div className="text-sm text-[#A09890] py-3">Načítání...</div>
      ) : records.length > 0 ? (
        <div className="space-y-2 mb-3">
          {records.map(rec => {
            const cfg = typeConfig(rec.record_type)
            return (
              <div key={rec._id} className="p-3 rounded-lg border-2 border-[#F0EDE8] bg-[#FDFCFA]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Header row: icon + title + badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base leading-none">{cfg?.icon ?? '📋'}</span>
                      <span className="font-semibold text-sm text-[#2C1810]">{rec.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5E6D3] text-[#6B4030]">
                        {cfg?.label ?? rec.record_type}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#8B6550]">
                      <span>📅 {fmtDateCs(rec.record_date)}</span>
                      {rec.vet_name && <span>👨‍⚕️ {rec.vet_name}</span>}
                    </div>

                    {rec.description && (
                      <p className="mt-1 text-xs text-[#6B4030] line-clamp-2">{rec.description}</p>
                    )}

                    {/* Next due date */}
                    {rec.next_due_date && (
                      <div className={`mt-1 text-xs font-semibold ${nextDueDateColor(rec.next_due_date)}`}>
                        📅 Příští dávka: {fmtDateCs(rec.next_due_date)}
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(rec._id)}
                    disabled={loading}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#A09890] hover:text-[#D83030] hover:bg-[#FCEBEB] transition-colors touch-manipulation flex-shrink-0 disabled:opacity-40"
                    title="Smazat záznam"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : !adding ? (
        <p className="text-sm text-[#A09890] mb-3">Žádné záznamy.</p>
      ) : null}

      {/* Add form */}
      {adding ? (
        <div className="p-3.5 rounded-lg border-2 border-[#E8634A]/30 bg-[#FDEAE6]/50">

          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MED_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setField('record_type', t.value as RecordType)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all touch-manipulation ${
                  form.record_type === t.value
                    ? 'border-[#E8634A] bg-[#FDEAE6] text-[#993C1D]'
                    : 'border-[#F0EDE8] bg-white text-[#6B4030] hover:border-[#E8634A]'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Title with datalist suggestions */}
          <div className="mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] block mb-1">
              Název / diagnóza <span className="text-[#E8634A]">*</span>
            </label>
            <input
              className={inputCls}
              list={`medtypes-${form.record_type}`}
              value={form.title}
              onChange={e => setField('title', e.target.value)}
              placeholder="Např. Vzteklina, Milbemax..."
              autoFocus
            />
            <datalist id={`medtypes-${form.record_type}`}>
              {(TYPE_SUGGESTIONS[form.record_type] ?? []).map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Date + vet name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] block mb-1">Datum</label>
              <input
                type="date"
                className={inputCls}
                value={form.record_date}
                onChange={e => setField('record_date', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] block mb-1">Veterinář</label>
              <input
                className={inputCls}
                value={form.vet_name}
                onChange={e => setField('vet_name', e.target.value)}
                placeholder="MVDr. ..."
              />
            </div>
          </div>

          {/* Next due date */}
          <div className="mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] block mb-1">
              Přeočkovat do / další dávka
            </label>
            <input
              type="date"
              className={inputCls}
              value={form.next_due_date}
              onChange={e => setField('next_due_date', e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-[#8B6550] block mb-1">Poznámky</label>
            <textarea
              className={textareaCls}
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Volitelné poznámky..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.title.trim() || saving}
              className="px-4 py-2 rounded-md bg-[#E8634A] text-white text-sm font-bold disabled:opacity-50 touch-manipulation"
            >
              {saving ? 'Ukládám...' : 'Přidat záznam'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setForm(emptyForm()) }}
              className="px-4 py-2 rounded-md border-2 border-[#F0EDE8] text-[#8B6550] text-sm touch-manipulation"
            >
              Zrušit
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-[#D5CFC8] text-sm font-semibold text-[#8B6550] hover:border-[#E8634A] hover:text-[#E8634A] transition-colors w-full touch-manipulation"
        >
          + Přidat zdravotní záznam
        </button>
      )}
    </div>
  )
}
