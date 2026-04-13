'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  user: {
    email: string
    user_metadata?: { full_name?: string; phone?: string }
  }
  newsletterSubscribed: boolean
}

type Section = 'profile' | 'password' | 'newsletter' | 'delete'

export function AccountSettings({ user, newsletterSubscribed: initialSubscribed }: Props) {
  const router = useRouter()

  // Profil
  const [fullName, setFullName] = useState(user.user_metadata?.full_name ?? '')
  const [phone, setPhone]       = useState(user.user_metadata?.phone ?? '')
  const [profileSaving, setProfileSaving]  = useState(false)
  const [profileMsg, setProfileMsg]        = useState<{ ok: boolean; text: string } | null>(null)

  // Heslo
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPwd, setConfirmPwd]       = useState('')
  const [showPwd, setShowPwd]             = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg]     = useState<{ ok: boolean; text: string } | null>(null)

  // Newsletter
  const [subscribed, setSubscribed]         = useState(initialSubscribed)
  const [newsletterLoading, setNewsletterLoading] = useState(false)

  // Smazání účtu
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting]           = useState(false)
  const [deleteError, setDeleteError]     = useState('')

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function saveProfile() {
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, phone }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setProfileMsg({ ok: true, text: 'Profil uložen.' })
      router.refresh()
    } catch (e: any) {
      setProfileMsg({ ok: false, text: e.message ?? 'Chyba' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function changePassword() {
    if (newPassword !== confirmPwd) {
      setPasswordMsg({ ok: false, text: 'Hesla se neshodují.' })
      return
    }
    setPasswordSaving(true)
    setPasswordMsg(null)
    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPasswordMsg({ ok: true, text: 'Heslo bylo změněno.' })
      setNewPassword('')
      setConfirmPwd('')
    } catch (e: any) {
      setPasswordMsg({ ok: false, text: e.message ?? 'Chyba' })
    } finally {
      setPasswordSaving(false)
    }
  }

  async function toggleNewsletter() {
    setNewsletterLoading(true)
    try {
      const res = await fetch('/api/account/newsletter', {
        method: subscribed ? 'DELETE' : 'POST',
      })
      if (res.ok) setSubscribed(s => !s)
    } finally {
      setNewsletterLoading(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      router.push('/?deleted=1')
    } catch (e: any) {
      setDeleteError(e.message ?? 'Chyba')
      setDeleting(false)
    }
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
    return (
      <div className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0EDE8]">
          <span className="text-lg">{icon}</span>
          <h3 className="font-bold text-sm text-[#1A0F0A]">{title}</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          {children}
        </div>
      </div>
    )
  }

  function Input({ label, type = 'text', value, onChange, placeholder, suffix }: {
    label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: React.ReactNode
  }) {
    return (
      <div>
        <label className="block text-xs font-bold mb-1" style={{ color: '#6B4030' }}>{label}</label>
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{ borderColor: '#E0DDD8', background: '#FFFCF8', paddingRight: suffix ? '44px' : undefined }}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
          )}
        </div>
      </div>
    )
  }

  function StatusMsg({ msg }: { msg: { ok: boolean; text: string } | null }) {
    if (!msg) return null
    return (
      <p className="text-xs font-semibold px-3 py-2 rounded-lg"
        style={{ background: msg.ok ? '#EAF3DE' : '#FAECE7', color: msg.ok ? '#3B6D11' : '#993C1D' }}>
        {msg.ok ? '✓ ' : '✗ '}{msg.text}
      </p>
    )
  }

  function SaveBtn({ loading, label = 'Uložit', disabled }: { loading: boolean; label?: string; disabled?: boolean }) {
    return (
      <button
        onClick={label === 'Uložit' ? saveProfile : changePassword}
        disabled={loading || disabled}
        className="px-5 py-2.5 rounded-[100px] text-sm font-bold text-white transition-all disabled:opacity-40"
        style={{ background: '#E8634A' }}
      >
        {loading ? 'Ukládám…' : label}
      </button>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── E-mail (jen info) ── */}
      <SectionCard title="Přihlašovací e-mail" icon="✉️">
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 px-3.5 py-2.5 rounded-xl border text-sm" style={{ borderColor: '#F0EDE8', background: '#F8F5F2', color: '#6B4030' }}>
            {user.email}
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#EAF3DE', color: '#3B6D11' }}>
            Ověřeno ✓
          </span>
        </div>
        <p className="text-xs" style={{ color: '#A0968C' }}>
          Změna e-mailu vyžaduje ověření. Kontaktuj podporu na ahoj@zozio.cz
        </p>
      </SectionCard>

      {/* ── Profil ── */}
      <SectionCard title="Osobní údaje" icon="👤">
        <Input
          label="Jméno a příjmení"
          value={fullName}
          onChange={setFullName}
          placeholder="Jana Novák"
        />
        <Input
          label="Telefonní číslo"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+420 777 123 456"
        />
        <StatusMsg msg={profileMsg} />
        <div>
          <button
            onClick={saveProfile}
            disabled={profileSaving}
            className="px-5 py-2.5 rounded-[100px] text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: '#E8634A' }}
          >
            {profileSaving ? 'Ukládám…' : 'Uložit změny'}
          </button>
        </div>
      </SectionCard>

      {/* ── Heslo ── */}
      <SectionCard title="Změna hesla" icon="🔒">
        <Input
          label="Nové heslo"
          type={showPwd ? 'text' : 'password'}
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Alespoň 6 znaků"
          suffix={
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="text-xs font-bold"
              style={{ color: '#8B6550' }}
              tabIndex={-1}
            >
              {showPwd ? 'Skrýt' : 'Zobrazit'}
            </button>
          }
        />
        <Input
          label="Zopakovat heslo"
          type={showPwd ? 'text' : 'password'}
          value={confirmPwd}
          onChange={setConfirmPwd}
          placeholder="Stejné heslo znovu"
        />
        <StatusMsg msg={passwordMsg} />
        {confirmPwd && newPassword !== confirmPwd && (
          <p className="text-xs font-semibold" style={{ color: '#993C1D' }}>Hesla se neshodují</p>
        )}
        <div>
          <button
            onClick={changePassword}
            disabled={passwordSaving || !newPassword || newPassword !== confirmPwd}
            className="px-5 py-2.5 rounded-[100px] text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: '#E8634A' }}
          >
            {passwordSaving ? 'Měním…' : 'Změnit heslo'}
          </button>
        </div>
      </SectionCard>

      {/* ── Newsletter ── */}
      <SectionCard title="Zozio newsletter" icon="📬">
        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <p className="text-sm font-semibold text-[#1A0F0A]">
              {subscribed ? 'Odebíráš Zozio newsletter' : 'Neodebíráš Zozio newsletter'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#8B6550' }}>
              Novinky o adopcích, záchranách a příbězích zvířat.
            </p>
          </div>
          {/* Toggle switch */}
          <button
            onClick={toggleNewsletter}
            disabled={newsletterLoading}
            className="relative w-12 h-6 rounded-full flex-shrink-0 transition-colors duration-200 disabled:opacity-50"
            style={{ background: subscribed ? '#E8634A' : '#D0C8C0' }}
            aria-label={subscribed ? 'Odhlásit z newsletteru' : 'Přihlásit k newsletteru'}
          >
            <span
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
              style={{ transform: subscribed ? 'translateX(24px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
      </SectionCard>

      {/* ── Smazání účtu ── */}
      <div className="bg-white rounded-xl border border-[#F0EDE8] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0EDE8]">
          <span className="text-lg">⚠️</span>
          <h3 className="font-bold text-sm" style={{ color: '#993C1D' }}>Smazat účet</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm" style={{ color: '#8B6550' }}>
            Smazání je nevratné. Ztratíš oblíbená zvířata, sledované instituce a dobrovolnické přihlášky.
          </p>
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: '#993C1D' }}>
              Pro potvrzení napiš: <span className="font-mono bg-[#FAECE7] px-1 rounded">smazat účet</span>
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="smazat účet"
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all"
              style={{ borderColor: '#E0DDD8', background: '#FFFCF8' }}
            />
          </div>
          {deleteError && (
            <p className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: '#FAECE7', color: '#993C1D' }}>
              ✗ {deleteError}
            </p>
          )}
          <button
            onClick={deleteAccount}
            disabled={deleteConfirm !== 'smazat účet' || deleting}
            className="px-5 py-2.5 rounded-[100px] text-sm font-bold text-white transition-all disabled:opacity-30"
            style={{ background: '#CC3B1E' }}
          >
            {deleting ? 'Mažu…' : 'Smazat účet'}
          </button>
        </div>
      </div>

    </div>
  )
}
