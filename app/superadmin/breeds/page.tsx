import { createServiceClient } from '@/lib/supabase/service'
import { BreedsManager } from './BreedsManager'

export default async function SuperadminBreedsPage() {
  const service = createServiceClient()

  const { data: species } = await service
    .from('animal_species')
    .select('id, name_cs, category')
    .order('name_cs')

  const { data: breeds } = await service
    .from('animal_breeds')
    .select('id, species_id, name_cs, name_sk, origin_country, size_category, energy_level, hypoallergenic, description, is_custom, institution_id, created_at, profile, species:animal_species(name_cs)')
    .order('name_cs')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl text-[#2C1810] mb-1">Správa plemen</h1>
        <p className="text-sm text-[#8B6550]">Globální číselník plemen pro všechny instituce</p>
      </div>
      <BreedsManager species={species ?? []} initialBreeds={breeds ?? []} />
    </div>
  )
}
