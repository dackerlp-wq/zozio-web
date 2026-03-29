import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Zozio — Najdi zvíře k adopci',
  description: 'Adoptuj zvíře z útulku nebo podpoř záchrannou stanici.',
}

export default async function HomePage() {
  const [animals, rescueCases, fundraisers, stats] = await Promise.all([
    getFeaturedAnimals(),
    getFeaturedRescueCases(),
    getActiveFundraisers(),
    getStats(),
  ])

  return (
    <main>
      <HeroSection stats={stats} animals={animals.slice(0, 4)} />
      <QuickEntry />
      <AnimalsSection animals={animals} />
      <RescueAndFundraisers rescueCases={rescueCases} fundraisers={fundraisers} />
      <HowItWorks />
      <InstitutionCta />
    </main>
  )
}

/* ─── HERO ──────────────────────────────────────────── */

function HeroSection({
  stats,
  animals,
}: {
  stats: { animals: number; rescueCases: number; institutions: number }
  animals: any[]
}) {
  return (
    <section
      className="relative min-h-[92vh] flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2C1810 0%, #3D2015 45%, #1C2E28 100%)' }}
    >
      {/* Světelné kruhy */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div
          className="absolute top-[-120px] right-[-80px] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(232,99,74,0.28) 0%, rgba(232,99,74,0.06) 50%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-80px] left-[-60px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,158,143,0.20) 0%, transparent 65%)' }}
        />
        {/* Mřížka */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Obsah */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-5 md:px-10 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Levý sloupec — text ── */}
          <div>
            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8"
              style={{ background: 'rgba(232,99,74,0.18)', border: '1px solid rgba(232,99,74,0.35)' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#E8634A] animate-pulse" />
              <span className="text-xs font-semibold text-[#F5B8A8]">
                {stats.animals} zvířat právě hledá domov
              </span>
            </div>

            {/* Nadpis */}
            <h1
              className="font-display font-extrabold text-white leading-[1.05] mb-6"
              style={{ fontSize: 'clamp(38px, 5.5vw, 72px)' }}
            >
              Každé zvíře<br />
              si zaslouží<br />
              <span style={{ color: '#E8634A' }}>domov</span>
            </h1>

            <p className="text-lg leading-relaxed mb-10 max-w-[480px]" style={{ color: 'rgba(255,255,255,0.60)' }}>
              Adoptuj zvíře z útulku nebo podpoř záchrannou stanici
              po celé ČR a SR.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mb-14">
              <Link href="/adopt">
                <button
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white cursor-pointer border-none transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: '#E8634A', boxShadow: '0 4px 32px rgba(232,99,74,0.45)' }}
                >
                  Najít zvíře k adopci
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </Link>
              <Link href="/rescue">
                <button
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base cursor-pointer border-none transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.20)' }}
                >
                  Záchranné stanice
                </button>
              </Link>
            </div>

            {/* Statistiky */}
            <div className="flex flex-wrap gap-8">
              {[
                { num: stats.animals,      label: 'zvířat k adopci' },
                { num: stats.rescueCases,  label: 'záchranných případů' },
                { num: stats.institutions, label: 'institucí v ČR/SR' },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="font-display font-extrabold text-3xl" style={{ color: '#E8634A' }}>{num}+</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pravý sloupec — mozaika fotek ── */}
          <div className="hidden lg:grid grid-cols-2 gap-3">
            {animals.length > 0 ? animals.slice(0, 4).map((animal, i) => {
              const species     = animal.species     as any
              const institution = animal.institution as any
              const sizes       = ['aspect-square', 'aspect-[4/3]', 'aspect-[4/3]', 'aspect-square']

              return (
                <Link key={animal.id} href={`/animals/${animal.id}`} className="no-underline group">
                  <div
                    className={`relative ${sizes[i]} rounded-2xl overflow-hidden`}
                    style={{
                      transform: i % 2 === 0 ? 'translateY(-8px)' : 'translateY(8px)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                    }}
                  >
                    {/* Foto nebo placeholder */}
                    {animal.primary_photo ? (
                      <Image
                        src={animal.primary_photo}
                        alt={animal.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-6xl"
                        style={{ background: i % 2 === 0 ? '#3D2015' : '#1C2E28' }}
                      >
                        {species?.icon ?? '🐾'}
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 50%)' }}
                    />

                    {/* Badge urgentní */}
                    {animal.urgent && (
                      <div className="absolute top-3 left-3 bg-[#E8634A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                        Urgentní
                      </div>
                    )}

                    {/* Info dole */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="font-bold text-white text-sm leading-tight">{animal.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {species?.name_cs}{institution?.city ? ` · ${institution.city}` : ''}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            }) : (
              /* Placeholder prázdný stav */
              [0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`relative ${i % 2 === 0 ? 'aspect-square' : 'aspect-[4/3]'} rounded-2xl flex items-center justify-center text-5xl`}
                  style={{
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transform: i % 2 === 0 ? 'translateY(-8px)' : 'translateY(8px)',
                  }}
                >
                  🐾
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[11px] text-white font-medium uppercase tracking-widest">Scrollovat</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-bounce">
            <path d="M3 6l5 5 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}

/* ─── RYCHLÝ VSTUP ───────────────────────────────────── */

function QuickEntry() {
  const items = [
    { href: '/adopt',        emoji: '🐾', label: 'Adoptovat',         sub: 'Psy, kočky, králíky...',  bg: '#FAECE7', color: '#993C1D' },
    { href: '/rescue',       emoji: '🦉', label: 'Záchranné stanice', sub: 'Volně žijící zvířata',     bg: '#E1F5EE', color: '#0F6E56' },
    { href: '/fundraisers',  emoji: '💛', label: 'Podpořit sbírky',   sub: 'Přispět konkrétnímu',      bg: '#FAEEDA', color: '#854F0B' },
    { href: '/institutions', emoji: '🏠', label: 'Útulky a stanice',  sub: 'Adresář institucí',        bg: '#F1EFE8', color: '#5F5E5A' },
  ]

  return (
    <section className="bg-white border-b border-[#F0EDE8] py-5 px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ href, emoji, label, sub, bg, color }) => (
          <Link key={href} href={href} className="no-underline">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-0.5 transition-all bg-white">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: bg }}>
                {emoji}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[#1A0F0A] truncate">{label}</div>
                <div className="text-xs truncate" style={{ color }}>{sub}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ─── ZVÍŘATA K ADOPCI ───────────────────────────────── */

function AnimalsSection({ animals }: { animals: any[] }) {
  const urgent = animals.filter((a: any) => a.urgent)
  const rest   = animals.filter((a: any) => !a.urgent)

  return (
    <section className="py-16 md:py-20 px-5 md:px-10 bg-[#FFFCF8]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>K adopci</p>
            <h2 className="font-display font-extrabold text-[#1A0F0A] leading-tight" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
              Čekají na domov
            </h2>
          </div>
          <Link href="/adopt" className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold no-underline hover:opacity-70 transition-opacity" style={{ color: '#E8634A' }}>
            Zobrazit vše →
          </Link>
        </div>

        {urgent.length > 0 && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-4" style={{ background: '#E8634A' }}>
              🆘 Urgentní adopce
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {urgent.slice(0, 3).map((a: any) => <AnimalCard key={a.id} animal={a} large />)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {rest.slice(0, 8).map((a: any) => <AnimalCard key={a.id} animal={a} />)}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/adopt">
            <button className="px-6 py-3 rounded-xl border font-bold text-sm bg-transparent cursor-pointer hover:opacity-80 transition-all" style={{ borderColor: '#E8634A', color: '#E8634A' }}>
              Zobrazit všechna zvířata →
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function AnimalCard({ animal, large = false }: { animal: any; large?: boolean }) {
  const species     = animal.species     as any
  const institution = animal.institution as any

  return (
    <Link href={`/animals/${animal.id}`} className="no-underline group">
      <div className="bg-white rounded-2xl overflow-hidden border border-[#F0EDE8] hover:border-[#E8634A]/40 hover:-translate-y-1 transition-all duration-200">
        <div className={`relative ${large ? 'h-48' : 'h-36'} bg-[#FAECE7] flex items-center justify-center overflow-hidden`}>
          {animal.primary_photo
            ? <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
            : <span className="text-5xl">{species?.icon ?? '🐾'}</span>
          }
          {animal.urgent && (
            <div className="absolute top-2.5 left-2.5 bg-[#E8634A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Urgentní</div>
          )}
          {institution?.city && (
            <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5">
              <span className="text-[10px] font-bold text-[#1A0F0A]">{institution.city}</span>
            </div>
          )}
        </div>
        <div className="p-3.5">
          <div className="font-bold text-[#1A0F0A] text-base mb-0.5 truncate">{animal.name}</div>
          <div className="text-xs text-[#8B6550] mb-2.5 truncate">
            {[species?.name_cs, animal.breed, animal.birth_year ? `${new Date().getFullYear() - animal.birth_year} let` : null].filter(Boolean).join(' · ')}
          </div>
          <div className="flex flex-wrap gap-1">
            {animal.vaccinated    && <Pill label="Očkovaný"   bg="#EAF3DE" color="#3B6D11" />}
            {animal.neutered      && <Pill label="Kastrovaný" bg="#EAF3DE" color="#3B6D11" />}
            {animal.good_with_kids && <Pill label="S dětmi"   bg="#FAEEDA" color="#854F0B" />}
          </div>
        </div>
      </div>
    </Link>
  )
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: bg, color }}>
      {label}
    </span>
  )
}

/* ─── ZÁCHRANA + SBÍRKY ─────────────────────────────── */

function RescueAndFundraisers({ rescueCases, fundraisers }: { rescueCases: any[]; fundraisers: any[] }) {
  return (
    <section className="py-16 md:py-20 px-5 md:px-10 bg-white">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

        {/* Záchranné stanice */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#2E9E8F' }}>Záchranné stanice</p>
          <h2 className="font-display font-extrabold text-[#1A0F0A] mb-6 leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
            Volně žijící zvířata<br />potřebují pomoc
          </h2>
          <div className="space-y-3 mb-6">
            {rescueCases.length === 0
              ? <p className="text-sm text-[#8B6550]">Zatím žádné aktivní záchranné případy.</p>
              : rescueCases.slice(0, 3).map((c: any) => (
                <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline">
                  <div className="flex items-center gap-4 p-4 rounded-xl border hover:-translate-y-0.5 transition-all" style={{ background: '#F8FDFB', borderColor: '#C8EBE3' }}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden" style={{ background: '#E1F5EE' }}>
                      {c.primary_photo
                        ? <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover" />
                        : <span>{(c.species as any)?.icon ?? '🐾'}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#1A0F0A] truncate">{c.name ?? c.case_number}</div>
                      <div className="text-xs text-[#6B4030] mt-0.5 truncate">{c.cause_of_injury}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                      {c.status === 'rehabilitation' ? 'Rehabilitace' : c.status === 'treatment' ? 'Léčba' : 'Příjem'}
                    </span>
                  </div>
                </Link>
              ))
            }
          </div>
          <Link href="/rescue">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm bg-transparent cursor-pointer hover:opacity-80 transition-all" style={{ borderColor: '#2E9E8F', color: '#0F6E56' }}>
              Všechny záchranné stanice →
            </button>
          </Link>
        </div>

        {/* Sbírky */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#854F0B' }}>Aktivní sbírky</p>
          <h2 className="font-display font-extrabold text-[#1A0F0A] mb-6 leading-tight" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
            Přispěj<br />konkrétnímu zvířeti
          </h2>
          <div className="space-y-4 mb-6">
            {fundraisers.length === 0
              ? <p className="text-sm text-[#8B6550]">Zatím žádné aktivní sbírky.</p>
              : fundraisers.slice(0, 3).map((f: any) => {
                const pct       = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
                const isShelter = (f.institution as any)?.type === 'shelter'
                return (
                  <div key={f.id} className="p-4 rounded-xl border" style={{ background: '#FEFCF8', borderColor: '#F0DDD6' }}>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div>
                        <div className="font-bold text-sm text-[#1A0F0A] leading-tight">{f.title}</div>
                        <div className="text-xs text-[#8B6550] mt-0.5">{(f.institution as any)?.name}</div>
                      </div>
                      <span className="text-xl flex-shrink-0">{isShelter ? '🐾' : '🦉'}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-[#1A0F0A]">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                      <span style={{ color: '#8B6550' }}>z {f.goal_amount.toLocaleString('cs-CZ')} Kč · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: isShelter ? '#E8634A' : '#2E9E8F' }} />
                    </div>
                  </div>
                )
              })
            }
          </div>
          <Link href="/fundraisers">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer border-none hover:opacity-90 transition-all" style={{ background: '#F0A500' }}>
              Zobrazit všechny sbírky →
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── JAK TO FUNGUJE ─────────────────────────────────── */

function HowItWorks() {
  return (
    <section className="py-16 md:py-20 px-5 md:px-10" style={{ background: '#1A0F0A' }}>
      <div className="max-w-[1200px] mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>Jak to funguje</p>
        <h2 className="font-display font-extrabold text-white mb-12 leading-tight" style={{ fontSize: 'clamp(26px, 4vw, 40px)' }}>
          Adopce ve třech krocích
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[
            { n: '01', title: 'Najdi zvíře',   body: 'Filtruj podle druhu, města nebo věku. Urgentní zvířata jsou vždy nahoře.' },
            { n: '02', title: 'Pošli žádost',  body: 'Vyplň online formulář za 2 minuty. Útulok tě kontaktuje do 3 pracovních dní.' },
            { n: '03', title: 'Adoptuj',        body: 'Domluvte se na schůzce, podepište adopční smlouvu a vezměte zvíře domů.' },
          ].map(({ n, title, body }) => (
            <div key={n}>
              <div className="font-display font-extrabold select-none mb-3 leading-none" style={{ fontSize: 72, color: 'rgba(232,99,74,0.15)' }}>{n}</div>
              <h3 className="font-bold text-white text-xl mb-2 -mt-8">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#B08070' }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── PRO INSTITUCE ──────────────────────────────────── */

function InstitutionCta() {
  return (
    <section className="py-14 px-5 md:px-10 border-t" style={{ background: '#FFFCF8', borderColor: '#F0EDE8' }}>
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8634A' }}>Pro útulky a stanice</p>
          <h2 className="font-display font-extrabold text-[#1A0F0A] text-2xl md:text-3xl mb-2">Spravujte instituci online</h2>
          <p className="text-sm max-w-[420px] leading-relaxed" style={{ color: '#8B6550' }}>
            Adopce, záchranné případy, sbírky a dobrovolníci na jednom místě. Základní plán zdarma.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <Link href="/pro-instituce">
            <button className="px-6 py-3 rounded-xl font-bold text-sm cursor-pointer border hover:opacity-80 transition-all" style={{ background: 'white', color: '#1A0F0A', borderColor: '#E0DDD8' }}>
              Zjistit více
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="px-6 py-3 rounded-xl font-bold text-sm text-white cursor-pointer border-none hover:opacity-90 transition-all" style={{ background: '#E8634A' }}>
              Registrovat instituci →
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── DATA ───────────────────────────────────────────── */

async function getFeaturedAnimals() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animals')
    .select('id, name, breed, birth_year, primary_photo, urgent, adoption_status, vaccinated, neutered, good_with_kids, species:animal_species(name_cs,icon), institution:institutions(name,city,type)')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .neq('in_quarantine', true)
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12)
  return data ?? []
}

async function getFeaturedRescueCases() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, status, cause_of_injury, primary_photo, species:animal_species(name_cs,icon), institution:institutions(name,city)')
    .eq('published', true)
    .in('status', ['intake', 'treatment', 'rehabilitation'])
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getActiveFundraisers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('fundraisers')
    .select('id, title, goal_amount, current_amount, institution:institutions(name,type)')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}

async function getStats() {
  const supabase = await createClient()
  const [a, r, i] = await Promise.all([
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('published', true).eq('adoption_status', 'available'),
    supabase.from('rescue_cases').select('id', { count: 'exact', head: true }).eq('published', true).not('status', 'in', '("released","deceased")'),
    supabase.from('institutions').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
  ])
  return { animals: a.count ?? 0, rescueCases: r.count ?? 0, institutions: i.count ?? 0 }
}
