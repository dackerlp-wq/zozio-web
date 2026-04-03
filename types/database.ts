export type InstitutionType = 'shelter' | 'rescue_station'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type SubscriptionPlan = 'free' | 'standard' | 'pro'
export type ShelterAnimalStatus = 'available' | 'reserved' | 'adopted' | 'foster' | 'not_for_adoption'
export type RescueCaseStatus = 'intake' | 'treatment' | 'rehabilitation' | 'released' | 'deceased' | 'transferred'
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'meeting_scheduled' | 'adopted'

export interface Institution {
  id: string
  name: string
  slug: string
  type: InstitutionType
  description: string | null
  short_description: string | null
  logo_url: string | null
  cover_url: string | null
  email: string | null
  phone: string | null
  website: string | null
  street: string | null
  city: string
  postal_code: string | null
  country: string
  lat: number | null
  lng: number | null
  plan: SubscriptionPlan
  plan_expires_at: string | null
  approval_status: ApprovalStatus
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface AnimalSpecies {
  id: string
  name_cs: string
  name_en: string | null
  category: 'domestic' | 'wild' | null
  icon: string | null
  created_at: string
}

export interface Animal {
  id: string
  institution_id: string
  species_id: string | null
  name: string
  slug: string | null
  sex: 'male' | 'female' | 'unknown' | null
  birth_year: number | null
  birth_month: number | null
  size: 'small' | 'medium' | 'large' | 'xlarge' | null
  breed: string | null
  color: string | null
  weight_kg: number | null
  adoption_status: ShelterAnimalStatus
  urgent: boolean
  adoption_fee: number
  description: string | null
  good_with_kids: boolean | null
  good_with_dogs: boolean | null
  good_with_cats: boolean | null
  vaccinated: boolean
  neutered: boolean
  microchipped: boolean
  special_needs: string | null
  photos: string[]
  primary_photo: string | null
  intake_date: string | null
  // Widget / legal fields
  found_date: string | null       // Datum nálezu (§ 25 odst. 4 zák. 246/1992)
  found_location: string | null   // Místo nálezu (zákonná povinnost)
  adopted_at: string | null       // Datum předání novému chovateli
  published: boolean
  created_at: string
  updated_at: string
  // Relations
  institution?: Institution
  species?: AnimalSpecies
}

export interface RescueCase {
  id: string
  institution_id: string
  species_id: string | null
  case_number: string | null
  name: string | null
  sex: 'male' | 'female' | 'unknown' | null
  estimated_age: string | null
  status: RescueCaseStatus
  intake_date: string
  release_date: string | null
  found_location: string | null
  found_date: string | null
  found_by: string | null
  cause_of_injury: string | null
  diagnosis: string | null
  treatment_notes: string | null
  vet_name: string | null
  public_description: string | null
  photos: string[]
  primary_photo: string | null
  published: boolean
  created_at: string
  updated_at: string
  // Relations
  institution?: Institution
  species?: AnimalSpecies
}

export interface AdoptionApplication {
  id: string
  animal_id: string
  institution_id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  housing_type: 'house' | 'apartment' | 'farm' | 'other' | null
  has_garden: boolean | null
  garden_fenced: boolean | null
  other_pets: string | null
  has_children: boolean | null
  children_ages: string | null
  experience: string | null
  motivation: string
  status: ApplicationStatus
  staff_notes: string | null
  meeting_at: string | null
  created_at: string
  updated_at: string
  // Relations
  animal?: Animal
}

export interface Fundraiser {
  id: string
  institution_id: string
  animal_id: string | null
  rescue_case_id: string | null
  title: string
  description: string | null
  goal_amount: number
  current_amount: number
  deadline: string | null
  active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Volunteer {
  id: string
  institution_id: string
  name: string
  email: string
  phone: string | null
  availability: string | null
  skills: string[]
  motivation: string | null
  status: 'pending' | 'active' | 'inactive' | 'rejected'
  created_at: string
}

export interface Article {
  id: string
  institution_id: string | null
  title: string
  slug: string
  perex: string | null
  content: string | null
  cover_url: string | null
  category: 'story' | 'tips' | 'news' | 'rescue' | null
  tags: string[]
  published: boolean
  published_at: string | null
  views: number
  likes: number
  author_id: string | null
  author_name: string | null
  created_at: string
  updated_at: string
}
