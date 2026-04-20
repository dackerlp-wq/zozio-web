'use client'

import React, { useState } from 'react'

interface ExitModalProps {
  animalId: string
  animalName: string
  evidenceNumber: string
  onClose: () => void
}

type ExitType = 'adopted' | 'returned' | 'transferred' | 'deceased' | 'escaped' | null

interface FormState {
  exitType: ExitType
  // Common
  note: string
  // Adopce
  adoptionDate: string
  contractNumber: string
  adopterName: string
  adopterPhone: string
  adopterEmail: string
  adopterAddress: string
  // Vrácení
  returnDate: string
  ownerName: string
  ownerDocId: string
  // Přemístění
  targetInstitution: string
  transferDate: string
  // Úhyn
  deathDate: string
  deathType: string
  vet: string
  cause: string
  disposalMethod: string
  disposalDoc: string
  disposalFirm: string
}

const INITIAL: FormState = {
  exitType: 'adopted',
  note: '',
  adoptionDate: '', contractNumber: '', adopterName: '', adopterPhone: '', adopterEmail: '', adopterAddress: '',
  returnDate: '', ownerName: '', ownerDocId: '',
  targetInstitution: '', transferDate: '',
  deathDate: '', deathType: 'natural', vet: '', cause: '', disposalMethod: '', disposalDoc: '', disposalFirm: '',
}

export default function ExitModal({ animalId, animalName, evidenceNumber, onClose }: ExitModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)

  function set(field: keyof FormState, value: string | ExitType) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!form.exitType) return
    setSaving(true)
    try {
      await fetch(`/api/animals/${animalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exit_type: form.exitType,
          exit_date: form.adoptionDate || form.returnDate || form.transferDate || form.deathDate || new Date().toISOString().slice(0, 10),
          exit_notes: form.note,
          adopter_name: form.adopterName,
          adopter_phone: form.adopterPhone,
          adopter_email: form.adopterEmail,
          adopter_address: form.adopterAddress,
          adoption_contract_num: form.contractNumber,
          adoption_date: form.adoptionDate || null,
          transfer_institution: form.targetInstitution,
          transfer_date: form.transferDate || null,
          death_date: form.deathDate || null,
          death_type: form.deathType || null,
          death_vet: form.vet,
          death_cause: form.cause,
          disposal_method: form.disposalMethod,
          disposal_doc_number: form.disposalDoc,
          disposal_company: form.disposalFirm,
        }),
      })
      onClose()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const opts: Array<{ key: ExitType; icon: string; label: string; desc: string; danger?: boolean }> = [
    { key: 'adopted',     icon: '✅', label: 'Adopce — předání novému majiteli',       desc: 'Zvíře bylo předáno adoptérovi na základě adopční smlouvy' },
    { key: 'returned',    icon: '↩️', label: 'Vrácení původnímu majiteli',             desc: 'Byl nalezen registrovaný majitel' },
    { key: 'transferred', icon: '🚛', label: 'Přemístění do jiného útulku',           desc: 'Zvíře bylo přeřazeno do jiné instituce' },
    { key: 'deceased',    icon: '🕊️', label: 'Úhyn / Eutanazie',                      desc: 'Zvíře uhynulo nebo bylo humánně utraceno', danger: true },
    { key: 'escaped',     icon: '🏃', label: 'Útěk / Ztráta',                         desc: 'Zvíře uprchlo nebo bylo ztraceno' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(44,24,16,.5)', padding: '32px 16px' }}
    >
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '600px', background: 'white' }}>
        {/* Header */}
        <div style={{ background: '#E8634A', padding: '20px 24px' }}>
          <h2 className="font-black text-white" style={{ fontSize: '16px' }}>🚪 Zaznamenat odchod zvířete</h2>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '12px', marginTop: '3px' }}>
            {animalName} · {evidenceNumber} · §25b zák. 246/1992 Sb. — zákonná evidence
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Law info */}
          <div className="flex gap-2 rounded-lg text-xs font-semibold mb-4" style={{ padding: '12px 14px', background: '#E6F1FB', borderLeft: '3px solid #185FA5', color: '#185FA5' }}>
            <span style={{ fontSize: '15px', flexShrink: 0 }}>⚖️</span>
            <span>Záznamy o odchodu jsou <strong>zákonně povinné</strong> a uchovávají se min. 3 roky.</span>
          </div>

          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#8B6550', letterSpacing: '.05em' }}>
            Vyberte způsob odchodu
          </div>

          {opts.map(opt => (
            <React.Fragment key={opt.key}>
              <div
                className="flex items-start gap-3 rounded-lg cursor-pointer mb-2 transition-all"
                style={{
                  padding: '13px',
                  border: `2px solid ${form.exitType === opt.key ? '#E8634A' : opt.danger ? '#FCEBEB' : '#F0EDE8'}`,
                  background: form.exitType === opt.key ? '#FFF8F7' : 'white',
                }}
                onClick={() => set('exitType', opt.key)}
              >
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{opt.icon}</span>
                <div>
                  <div className="font-black text-sm" style={{ color: opt.danger ? '#D83030' : '#2C1810' }}>{opt.label}</div>
                  <div className="text-xs" style={{ color: '#8B6550', marginTop: '2px' }}>{opt.desc}</div>
                </div>
              </div>

              {/* Sub-forms */}
              {form.exitType === opt.key && opt.key === 'adopted' && (
                <ExitFormAdopted form={form} set={set} />
              )}
              {form.exitType === opt.key && opt.key === 'returned' && (
                <ExitFormReturned form={form} set={set} />
              )}
              {form.exitType === opt.key && opt.key === 'transferred' && (
                <ExitFormTransferred form={form} set={set} />
              )}
              {form.exitType === opt.key && opt.key === 'deceased' && (
                <ExitFormDeceased form={form} set={set} />
              )}
            </React.Fragment>
          ))}

          {/* Divider + note */}
          <div style={{ height: '1px', background: '#F0EDE8', margin: '16px 0' }} />
          <Field label="Poznámka do záznamu">
            <textarea
              rows={2}
              placeholder="Volitelná poznámka..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2" style={{ padding: '14px 24px', borderTop: '1px solid #F0EDE8', background: '#FDFCFA' }}>
          <button
            onClick={onClose}
            className="font-black rounded-lg"
            style={{ padding: '10px 20px', background: 'transparent', border: '2px solid transparent', color: '#8B6550', fontSize: '13px', cursor: 'pointer' }}
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-black rounded-lg text-white"
            style={{ padding: '10px 20px', background: '#E8634A', border: 'none', fontSize: '13px', cursor: 'pointer', opacity: saving ? .7 : 1 }}
          >
            ✓ Uložit a uzavřít kartu
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Sub-forms ──────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '6px', border: '2px solid #F0EDE8',
  background: 'white', fontSize: '13px', color: '#2C1810', outline: 'none', fontFamily: 'inherit',
}

function Field({ label, children, lawTag }: { label: string; children: React.ReactNode; lawTag?: boolean }) {
  return (
    <div className="flex flex-col gap-1 mb-3">
      <label className="font-black uppercase text-xs flex items-center gap-1" style={{ color: '#8B6550', letterSpacing: '.06em' }}>
        {label}
        {lawTag && <span className="rounded text-xs font-black px-1.5 py-0.5 normal-case tracking-normal" style={{ fontSize: '9px', background: '#E6F1FB', color: '#185FA5' }}>Zákon</span>}
      </label>
      {children}
    </div>
  )
}

function ExitFormAdopted({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="rounded-lg mb-2" style={{ background: '#FFF8F7', padding: '14px', border: '1px solid #F5DDD8' }}>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Datum předání *" lawTag>
          <input type="date" value={form.adoptionDate} onChange={e => set('adoptionDate', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Číslo adopční smlouvy" lawTag>
          <input value={form.contractNumber} onChange={e => set('contractNumber', e.target.value)} style={{ ...inputStyle, fontFamily: 'monospace' }} />
        </Field>
      </div>
      <div className="text-xs font-black mb-2 flex items-center gap-1" style={{ color: '#2C1810' }}>
        👤 Adoptér — nový majitel
        <span className="rounded text-xs font-black px-1.5 py-0.5" style={{ fontSize: '9px', background: '#E6F1FB', color: '#185FA5' }}>§25b — povinné</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Jméno a příjmení *">
          <input placeholder="Jana Dvořáková" value={form.adopterName} onChange={e => set('adopterName', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Telefon *">
          <input type="tel" placeholder="+420 777 123 456" value={form.adopterPhone} onChange={e => set('adopterPhone', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="E-mail">
          <input type="email" placeholder="jana@email.cz" value={form.adopterEmail} onChange={e => set('adopterEmail', e.target.value)} style={inputStyle} />
        </Field>
        <div className="col-span-3">
          <Field label="Trvalá adresa *" lawTag>
            <input placeholder="Ulice 12, Praha 5, 150 00" value={form.adopterAddress} onChange={e => set('adopterAddress', e.target.value)} style={inputStyle} />
          </Field>
        </div>
      </div>
      <div className="mt-2 rounded-lg text-xs" style={{ padding: '10px 12px', background: 'white', border: '1px solid #F0EDE8', color: '#8B6550' }}>
        📄 Po uložení se vygeneruje adopční smlouva (PDF) ke stažení.
      </div>
    </div>
  )
}

function ExitFormReturned({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="rounded-lg mb-2" style={{ background: '#FFF8F7', padding: '14px', border: '1px solid #F5DDD8' }}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Datum vrácení" lawTag>
          <input type="date" value={form.returnDate} onChange={e => set('returnDate', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Jméno majitele *">
          <input placeholder="Jan Novák" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Č. dokladu totožnosti">
          <input placeholder="OP: 123456789" value={form.ownerDocId} onChange={e => set('ownerDocId', e.target.value)} style={inputStyle} />
        </Field>
      </div>
    </div>
  )
}

function ExitFormTransferred({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="rounded-lg mb-2" style={{ background: '#FFF8F7', padding: '14px', border: '1px solid #F5DDD8' }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cílová instituce" lawTag>
          <input placeholder="Útulek Brno" value={form.targetInstitution} onChange={e => set('targetInstitution', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Datum přemístění" lawTag>
          <input type="date" value={form.transferDate} onChange={e => set('transferDate', e.target.value)} style={inputStyle} />
        </Field>
      </div>
    </div>
  )
}

function ExitFormDeceased({ form, set }: { form: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="rounded-lg mb-2" style={{ background: '#FFF5F5', padding: '14px', border: '1px solid #F5C0C0' }}>
      <div className="flex gap-2 rounded-lg text-xs font-semibold mb-3" style={{ padding: '12px 14px', background: '#FCEBEB', borderLeft: '3px solid #D83030', color: '#D83030' }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>⚖️</span>
        <span><strong>Zákon:</strong> Likvidace těla dle VZ č. 255/2012 Sb. Doklad je nutné uschovat.</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Datum *" lawTag>
          <input type="date" value={form.deathDate} onChange={e => set('deathDate', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Typ *">
          <select value={form.deathType} onChange={e => set('deathType', e.target.value)} style={inputStyle}>
            <option value="natural">Přirozený úhyn</option>
            <option value="euthanasia_medical">Eutanazie — lékař.</option>
            <option value="euthanasia_behavior">Eutanazie — chování</option>
          </select>
        </Field>
        <Field label="Veterinář" lawTag>
          <input placeholder="MVDr. Novák" value={form.vet} onChange={e => set('vet', e.target.value)} style={inputStyle} />
        </Field>
        <div className="col-span-3">
          <Field label="Příčina / diagnóza" lawTag>
            <textarea rows={2} placeholder="Popis příčiny..." value={form.cause} onChange={e => set('cause', e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }} />
          </Field>
        </div>
        <Field label="Likvidace těla *" lawTag>
          <select value={form.disposalMethod} onChange={e => set('disposalMethod', e.target.value)} style={inputStyle}>
            <option value="">Vyberte...</option>
            <option value="raseko">Spalovna RASEKO</option>
            <option value="vet_cremation">Vet. spalovna</option>
            <option value="burial">Pohřbení</option>
          </select>
        </Field>
        <Field label="Č. dokladu o likvidaci">
          <input placeholder="Č. dokladu" value={form.disposalDoc} onChange={e => set('disposalDoc', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Firma likvidace">
          <input placeholder="RASEKO s.r.o." value={form.disposalFirm} onChange={e => set('disposalFirm', e.target.value)} style={inputStyle} />
        </Field>
      </div>
    </div>
  )
}
