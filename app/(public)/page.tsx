import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { FavoriteButtonWrapper } from '@/components/public/FavoriteButtonWrapper'

export const metadata: Metadata = {
  title: 'Zozio — Najdi svého nového přítele',
  description: 'Adoptuj zvíře z útulku nebo podpoř záchrannou stanici. Stovky zvířat čekají na nový domov po celé ČR a SR.',
}

export default async function HomePage() {
  const [animals, rescueCases, fundraisers] = await Promise.all([
    getFeaturedAnimals(),
    getFeaturedRescueCases(),
    getActiveFundraisers(),
  ])

  return (
    <main className="overflow-x-hidden">
      <HeroSection animals={animals} />
      <StatsStrip />
      <AnimalsSection animals={animals} />
      <RescueSection cases={rescueCases} fundraisers={fundraisers} />
      <StoriesSection />
      <InstitutionsCta />
    </main>
  )
}

/* ── HERO ── */
function HeroSection({ animals }: { animals: any[] }) {
  const urgentCount = animals.filter(a => a.urgent).length

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 pb-12 px-4 md:px-12 bg-warm overflow-hidden">
      {/* Blob pozadí */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] rounded-full bg-coral opacity-[0.12] -top-32 -right-20 blur-[80px]"
          style={{ animation: 'blobFloat 8s ease-in-out infinite' }} />
        <div className="absolute w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full bg-amber opacity-[0.10] bottom-0 right-1/3 blur-[80px]"
          style={{ animation: 'blobFloat 11s ease-in-out infinite reverse' }} />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Text */}
          <div>
            {urgentCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-coral-light text-coral-dark font-body text-xs font-bold px-4 py-2 rounded-pill mb-5"
                style={{ animation: 'fadeUp .4s ease both' }}>
                🆘 {urgentCount} zvířat potřebuje urgentní pomoc
              </div>
            )}

            <h1 className="font-display font-extrabold text-[clamp(38px,6vw,72px)] leading-[1.0] text-espresso mb-5"
              style={{ animation: 'fadeUp .5s ease .05s both' }}>
              Každé zvíře<br />
              hledá{' '}
              <span className="text-coral relative inline-block">
                domov
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-amber opacity-40 rounded-full -z-10" />
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed text-brown-mid mb-8 max-w-[480px]"
              style={{ animation: 'fadeUp .5s ease .1s both' }}>
              Adoptuj zvíře z útulku nebo podpoř záchrannou stanici.
              Stovky zvířat čekají na nový domov po celé ČR a SR.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10" style={{ animation: 'fadeUp .5s ease .15s both' }}>
              <Link href="/adopt">
                <Button variant="primary" size="lg" className="justify-center w-full sm:w-auto">
                  🐾 Najít zvíře k adopci
                </Button>
              </Link>
              <Link href="/rescue">
                <Button variant="rescue" size="lg" className="justify-center w-full sm:w-auto">
                  🦉 Podpořit záchranné stanice
                </Button>
              </Link>
            </div>

            {/* Rychlé filtry */}
            <div style={{ animation: 'fadeUp .5s ease .2s both' }}>
              <p className="text-xs font-bold text-gray uppercase tracking-wider mb-3">Hledáš konkrétní zvíře?</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: '/adopt?species=pes',   emoji: '🐕', label: 'Psy' },
                  { href: '/adopt?species=kocka', emoji: '🐱', label: 'Kočky' },
                  { href: '/adopt?species=kralik', emoji: '🐇', label: 'Králíky' },
                  { href: '/adopt?urgent=true',    emoji: '🆘', label: 'Urgentní' },
                ].map(({ href, emoji, label }) => (
                  <Link key={label} href={href}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-gray-pale rounded-pill font-body text-sm font-bold text-espresso hover:border-coral hover:text-coral transition-all cursor-pointer">
                      {emoji} {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mozaika fotek — živá data */}
          <div className="hidden lg:grid grid-cols-2 gap-3" style={{ animation: 'fadeUp .5s ease .1s both' }}>
            {animals.slice(0, 4).map((animal, i) => (
              <Link key={animal.id} href={`/animals/${animal.id}`}>
                <div className={`relative rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${i === 0 ? 'aspect-square' : i === 1 ? 'aspect-[4/3]' : i === 2 ? 'aspect-[4/3]' : 'aspect-square'}`}>
                  {animal.primary_photo ? (
                    <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sand to-coral-light flex items-center justify-center text-5xl">
                      {animal.species?.icon ?? '🐾'}
                    </div>
                  )}
                  {animal.urgent && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="urgent" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-espresso/80 to-transparent p-3">
                    <div className="font-display font-bold text-sm text-white">{animal.name}</div>
                    <div className="text-xs text-white/70">{animal.species?.name_cs} · {animal.institution?.city}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── STATS ── */
function StatsStrip() {
  return (
    <div className="bg-espresso py-8 px-4 md:px-12">
      <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
        {[
          { num: '700+',   label: 'Útulků a stanic' },
          { num: '12 400', label: 'Zvířat ročně' },
          { num: '3 200+', label: 'Úspěšných adopcí' },
          { num: 'Zdarma', label: 'Základní plán' },
        ].map(({ num, label }, i) => (
          <div key={label} className={`text-center ${i < 3 ? 'md:border-r border-white/10' : ''}`}>
            <div className="font-display font-extrabold text-2xl md:text-3xl text-coral mb-1">{num}</div>
            <div className="text-xs md:text-sm text-gray-light font-semibold">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ZVÍŘATA K ADOPCI ── */
function AnimalsSection({ animals }: { animals: any[] }) {
  return (
    <section className="py-14 md:py-20 px-4 md:px-12 bg-warm">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              🐾 K adopci
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso leading-tight">
              Zvířata čekající<br className="hidden md:block" /> na nový domov
            </h2>
          </div>
          <Link href="/adopt" className="hidden md:block">
            <Button variant="ghost">Zobrazit vše →</Button>
          </Link>
        </div>

        {animals.length === 0 ? (
          <div className="text-center py-12 text-gray">Načítám zvířata...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {animals.slice(0, 8).map(animal => (
              <AnimalCard key={animal.id} animal={animal} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link href="/adopt">
            <Button variant="ghost" className="w-full justify-center">Zobrazit všechna zvířata →</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

function AnimalCard({ animal }: { animal: any }) {
  return (
    <Link href={`/animals/${animal.id}`} className="no-underline">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-pale hover:-translate-y-1 hover:shadow-md transition-all duration-300">
        <div className="relative h-44 bg-gradient-to-br from-sand to-coral-light">
          {animal.primary_photo ? (
            <Image src={animal.primary_photo} alt={animal.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              {animal.species?.icon ?? '🐾'}
            </div>
          )}
          {animal.urgent && <Badge variant="urgent" className="absolute top-2 left-2" />}
          <FavoriteButtonWrapper type="animal" id={animal.id} size="sm" className="absolute top-2 right-2" />
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded-pill px-2 py-0.5">
            <span className="text-[10px] font-bold text-espresso">{animal.institution?.city}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="font-display font-extrabold text-lg text-espresso mb-0.5">{animal.name}</div>
          <div className="text-xs text-gray mb-2">
            {animal.species?.name_cs}
            {animal.birth_year && ` · ${new Date().getFullYear() - animal.birth_year} let`}
          </div>
          <div className="flex flex-wrap gap-1">
            {animal.neutered    && <Tag label="Kastrovaný"   variant="green" />}
            {animal.vaccinated  && <Tag label="Očkovaný"     variant="green" />}
            {animal.good_with_kids && <Tag label="Miluje děti" variant="coral" />}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── ZÁCHRANNÉ STANICE + SBÍRKY ── */
function RescueSection({ cases, fundraisers }: { cases: any[], fundraisers: any[] }) {
  return (
    <section className="py-14 md:py-20 px-4 md:px-12 bg-cream">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">

          {/* Záchranné případy */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-rescue-bg text-rescue-dark font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              🦉 Záchranné stanice
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-6 leading-tight">
              Volně žijící zvířata<br />potřebují tvoji pomoc
            </h2>

            <div className="space-y-3 mb-6">
              {cases.slice(0, 3).map(c => (
                <Link key={c.id} href={`/rescue/${c.id}`} className="no-underline">
                  <div className="flex items-center gap-4 bg-white rounded-lg p-4 hover:shadow-md hover:-translate-y-0.5 transition-all border border-gray-pale">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-rescue-bg flex items-center justify-center text-3xl flex-shrink-0">
                      {c.primary_photo ? (
                        <Image src={c.primary_photo} alt={c.name ?? ''} fill className="object-cover" />
                      ) : (
                        <span>{c.species?.icon ?? '🐾'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-base text-espresso truncate">
                        {c.name ?? c.case_number}
                      </div>
                      <div className="text-xs text-gray">{c.species?.name_cs} · {c.institution?.city}</div>
                      <div className="text-xs text-brown-mid mt-1 line-clamp-1">{c.cause_of_injury}</div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-pill text-[10px] font-bold bg-rescue-bg text-rescue-dark flex-shrink-0">
                      {c.status === 'treatment' ? '🩺 Léčba' : c.status === 'rehabilitation' ? '💪 Rehab' : '🚑 Příjem'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/rescue">
              <Button variant="ghost-rescue">Všechny záchranné stanice →</Button>
            </Link>
          </div>

          {/* Sbírky */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-amber-light text-warning font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              💛 Aktivní sbírky
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-espresso mb-6 leading-tight">
              Přispěj konkrétnímu<br />zvířeti nebo útulku
            </h2>

            <div className="space-y-4 mb-6">
              {fundraisers.slice(0, 3).map(f => {
                const percent = Math.min(Math.round((f.current_amount / f.goal_amount) * 100), 100)
                const isShelter = f.institution?.type === 'shelter'
                return (
                  <div key={f.id} className="bg-white rounded-lg p-4 border border-gray-pale">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div>
                        <div className="font-display font-bold text-sm text-espresso leading-tight">{f.title}</div>
                        <div className="text-xs text-gray mt-0.5">{f.institution?.name}</div>
                      </div>
                      <span className={`text-lg flex-shrink-0`}>
                        {f.animal?.species?.icon ?? f.rescue_case?.species?.icon ?? '🐾'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-espresso">{f.current_amount.toLocaleString('cs-CZ')} Kč</span>
                      <span className="text-gray">z {f.goal_amount.toLocaleString('cs-CZ')} Kč · {percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-pale rounded-pill overflow-hidden">
                      <div className={`h-full rounded-pill ${isShelter ? 'bg-coral' : 'bg-rescue'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <Link href="/fundraisers">
              <Button variant="amber">💛 Zobrazit všechny sbírky</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── PŘÍBĚHY ── */
function StoriesSection() {
  const stories = [
    { emoji: '🐕', name: 'Max', text: 'Po 3 měsících v útulku si Maxe adoptovala rodina z Prahy. Dnes žije na chatě se dvěma dětmi a nikdy nebyl šťastnější.', institution: 'Útulok Praha Chodov', time: 'před 2 týdny' },
    { emoji: '🦉', name: 'Výr Vocálko', text: 'Přijeli k nám s přebitým křídlem. Po třech měsících rehabilitace se Vocálko vrátil do přírody u Jihlavy.', institution: 'Záchranná stanice Jihlava', time: 'před měsícem' },
    { emoji: '🐱', name: 'Luna', text: 'Luna přišla do útulku podvyživená a bázlivá. Dnes žije v bytě v Brně a její nová majitelka ji miluje nadměrně.', institution: 'Kočičí azyl Ostrava', time: 'před 3 týdny' },
  ]

  return (
    <section className="py-14 md:py-20 px-4 md:px-12 bg-warm">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-coral-light text-coral-dark font-body text-xs font-bold px-3 py-1.5 rounded-pill uppercase tracking-wider mb-3">
              📖 Příběhy
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-espresso leading-tight">
              Příběhy, které<br className="hidden md:block" /> zahřejí srdce
            </h2>
          </div>
          <Link href="/articles" className="hidden md:block">
            <Button variant="ghost">Číst více →</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stories.map(s => (
            <div key={s.name} className="bg-white rounded-lg p-5 md:p-6 border border-gray-pale shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="text-4xl mb-4">{s.emoji}</div>
              <h3 className="font-display font-extrabold text-lg text-espresso mb-2">{s.name}</h3>
              <p className="text-sm text-brown-mid leading-relaxed mb-4">{s.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray font-semibold">{s.institution}</span>
                <span className="text-xs text-gray">{s.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/articles">
            <Button variant="ghost" className="w-full justify-center">Číst více příběhů →</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── PRO INSTITUCE ── */
function InstitutionsCta() {
  return (
    <section className="py-12 md:py-16 px-4 md:px-12 bg-espresso">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-display font-extrabold text-xs text-amber uppercase tracking-wider mb-2">Pro útulky a záchranné stanice</div>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-tight">
            Spravujte svou instituci<br className="hidden md:block" /> online přes Zozio
          </h2>
          <p className="text-sm text-gray-light mt-2 max-w-[400px]">
            Adopce, záchranné případy, sbírky, dobrovolníci — vše na jednom místě. Začněte zdarma.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/pro-instituce" className="w-full sm:w-auto">
            <Button variant="amber" size="lg" className="justify-center w-full">Zjistit více</Button>
          </Link>
          <Link href="/auth/register" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center px-8 py-[17px] rounded-pill font-display font-bold text-base text-white border-2 border-white/30 hover:bg-white/10 transition-all cursor-pointer">
              Registrovat instituci →
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── DATA ── */
async function getFeaturedAnimals() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('animals')
    .select('id, name, species:animal_species(name_cs,icon), institution:institutions(name,city,type), primary_photo, photos, urgent, adoption_status, birth_year, neutered, vaccinated, good_with_kids')
    .eq('published', true)
    .eq('adoption_status', 'available')
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

async function getFeaturedRescueCases() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rescue_cases')
    .select('id, name, case_number, species:animal_species(name_cs,icon), institution:institutions(name,city), primary_photo, status, cause_of_injury')
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
    .select('id, title, goal_amount, current_amount, institution:institutions(name,type), animal:animals(species:animal_species(icon)), rescue_case:rescue_cases(species:animal_species(icon))')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(3)
  return data ?? []
}
