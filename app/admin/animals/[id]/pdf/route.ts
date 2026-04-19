import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ADOPTION_STATUS_LABEL,
  HEALTH_STATUS_LABEL, INTAKE_REASON_LABEL, SEX_LABEL, SIZE_LABEL,
} from '@/lib/animal-labels'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Nepřihlášen', { status: 401 })

  const service = createServiceClient()

  const { data: membership } = await service
    .from('institution_members')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return new NextResponse('Nemáš přístup', { status: 403 })

  const { data: institution } = await service
    .from('institutions')
    .select('id, name, city, email, phone')
    .eq('id', membership.institution_id)
    .single()

  if (!institution) return new NextResponse('Instituce nenalezena', { status: 404 })

  const { data: animal } = await service
    .from('animals')
    .select('*, species:animal_species(name_cs, icon)')
    .eq('id', id)
    .eq('institution_id', institution.id)
    .single()

  if (!animal) return new NextResponse('Záznam nenalezen', { status: 404 })

  const a = animal as any
  const today = new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })

  const row = (label: string, value: string | null | undefined, highlight = false) =>
    value ? `
      <tr style="background:${highlight ? '#FDEAE6' : 'transparent'}">
        <td style="padding:6px 12px;font-weight:700;color:#6B3F1F;font-size:12px;width:180px;border-bottom:1px solid #F0E8DC">${label}</td>
        <td style="padding:6px 12px;color:#2C1810;font-size:13px;border-bottom:1px solid #F0E8DC">${value}</td>
      </tr>` : ''

  const section = (title: string, content: string) => `
    <div style="margin-bottom:20px">
      <div style="background:#E8634A;color:white;font-family:sans-serif;font-weight:800;font-size:13px;padding:6px 12px;border-radius:6px 6px 0 0;letter-spacing:.05em;text-transform:uppercase">${title}</div>
      <table style="width:100%;border-collapse:collapse;background:white;border-radius:0 0 6px 6px;overflow:hidden">${content}</table>
    </div>`

  const bool = (v: boolean | null) => v ? '✓ Ano' : v === false ? '✗ Ne' : '—'

  const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Karta zvířete — ${a.name ?? a.case_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #FFFCF8; color: #2C1810; padding: 24px; font-size: 13px; }
  @media print {
    body { padding: 0; background: white; }
    .no-print { display: none; }
    @page { margin: 1.5cm; }
  }
</style>
</head>
<body>

<!-- Tlačítko tisku -->
<div class="no-print" style="margin-bottom:20px">
  <button onclick="window.print()" style="background:#E8634A;color:white;border:none;padding:10px 24px;border-radius:100px;font-size:14px;font-weight:700;cursor:pointer">
    🖨️ Tisknout / Uložit jako PDF
  </button>
</div>

<!-- Hlavička -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #E8634A">
  <div>
    <div style="font-size:22px;font-weight:800;color:#2C1810">${a.name ?? a.case_number ?? 'Bez jména'}</div>
    <div style="font-size:13px;color:#6B3F1F;margin-top:2px">${a.species?.icon ?? ''} ${a.species?.name_cs ?? '—'} ${a.breed ? '· ' + a.breed : ''}</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:11px;color:#8B7355">Karta vytisknuta: ${today}</div>
    <div style="font-size:11px;color:#8B7355">${institution.name}</div>
    <div style="font-size:11px;color:#8B7355">${institution.city ?? ''}</div>
    <div style="background:${ADOPTION_STATUS_LABEL[a.adoption_status ?? ''] ? '#E8634A' : '#8B7355'};
      color:white;font-weight:700;font-size:12px;padding:3px 10px;border-radius:100px;margin-top:6px;display:inline-block">
      ${ADOPTION_STATUS_LABEL[a.adoption_status ?? ''] ?? a.adoption_status}
    </div>
  </div>
</div>

${section('Základní informace', `
  ${row('ID záznamu', a.id?.slice(0, 8) + '...')}
  ${row('Číslo čipu', a.chip_number)}
  ${row('Číslo pasu', a.passport_number)}
  ${row('Pohlaví', SEX_LABEL[a.sex ?? ''] ?? '—')}
  ${row('Rok narození', a.birth_year?.toString())}
  ${row('Velikost', SIZE_LABEL[a.size ?? ''] ?? '—')}
  ${row('Barva', a.color)}
  ${row('Zdravotní stav', HEALTH_STATUS_LABEL[a.health_status ?? ''] ?? '—')}
`)}

${section('Zdravotní záznamy', `
  ${row('Očkovaný', bool(a.vaccinated), a.vaccinated)}
  ${row('Kastrovaný', bool(a.neutered), a.neutered)}
  ${row('Čipovaný', bool(a.microchipped), a.microchipped)}
  ${row('Datum čipování', a.chip_date)}
  ${row('Veterinář', a.vet_name ? `${a.vet_name}${a.vet_phone ? ' · ' + a.vet_phone : ''}` : null)}
  ${row('Poslední vet. návštěva', a.last_vet_visit)}
  ${row('Aktuální léky', a.medications)}
  ${row('V karanténě', a.in_quarantine ? `Ano${a.quarantine_until ? ' do ' + a.quarantine_until : ''}` : null, a.in_quarantine)}
  ${a.in_foster ? row('Foster péče', `${a.foster_name ?? ''}${a.foster_phone ? ' · ' + a.foster_phone : ''}${a.foster_since ? ' (od ' + a.foster_since + ')' : ''}`, true) : ''}
  ${row('Zdravotní poznámky', a.medical_notes)}
`)}

${section('Původ a příjem', `
  ${row('Datum příjmu', a.intake_date)}
  ${row('Důvod příjmu', INTAKE_REASON_LABEL[a.intake_reason ?? ''] ?? a.intake_reason)}
  ${row('Místo nálezu', a.found_location)}
  ${row('Datum nálezu', a.found_date)}
  ${row('Nalézatel', a.finder_name ? `${a.finder_name}${a.finder_phone ? ' · ' + a.finder_phone : ''}` : null)}
  ${row('Předchozí majitel', a.previous_owner ? `${a.previous_owner}${a.previous_owner_phone ? ' · ' + a.previous_owner_phone : ''}` : null)}
  ${row('Poznámky k příjmu', a.intake_notes)}
`)}

${section('Instituce', `
  ${row('Název', institution.name)}
  ${row('Město', institution.city)}
  ${row('E-mail', institution.email)}
  ${row('Telefon', institution.phone)}
`)}

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
