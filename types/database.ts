export type InstitutionType = 'shelter'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type SubscriptionPlan = 'free' | 'standard' | 'pro'
export type ShelterAnimalStatus = 'available' | 'reserved' | 'adopted' | 'foster' | 'not_for_adoption' | 'conditional' | 'intake' | 'treatment' | 'deceased'
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
  facebook_url: string | null
  instagram_url: string | null
  opening_hours: string | null
  darujme_api_id: string | null
  darujme_api_secret: string | null
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
  category: 'domestic' | null
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
  good_with_kids: 'yes' | 'ok' | 'no' | 'unknown' | null
  good_with_dogs: 'yes' | 'ok' | 'no' | 'unknown' | null
  good_with_cats: 'yes' | 'ok' | 'no' | 'unknown' | null
  good_with_other_animals: 'yes' | 'ok' | 'no' | 'unknown' | null
  good_with_adults: string | null
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

export type AdSlotType = 'inline_grid' | 'sidebar' | 'banner_adopt' | 'banner_home' | 'banner_animal' | 'newsletter'
export type AdTier = 'friend' | 'supporter' | 'partner' | 'main'
export type AdStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paused'

export interface Ad {
  id:               string
  company_name:     string
  contact_email:    string | null
  logo_url:         string | null
  image_url:        string | null
  headline:         string
  description:      string | null
  cta_label:        string
  cta_url:          string
  slots:            AdSlotType[]
  target_species:            string | null
  target_regions:            string[]  // [] = celá ČR, jinak seznam krajů
  target_institutions:       string[]  // [] = všechny, jinak UUID útulků
  target_article_categories: string[]  // [] = všechny, jinak ['story','tips',...]
  active_from:      string
  active_to:        string
  tier:             AdTier
  active:           boolean
  notes:            string | null
  impressions:      number
  clicks:           number
  // Company portal fields
  company_id:       string | null
  status:           AdStatus
  rejection_reason: string | null
  submitted_at:     string | null
  created_at:       string
  updated_at:       string
}

export interface AdCompany {
  id:               string
  user_id:          string
  company_name:     string
  contact_name:     string | null
  contact_email:    string
  phone:            string | null
  website:          string | null
  ico:              string | null
  billing_name:     string | null
  billing_address:  string | null
  notes:            string | null
  approved:         boolean
  created_at:       string
  updated_at:       string
}

export interface AdDailyStat {
  ad_id:       string
  day:         string
  impressions: number
  clicks:      number
}

export interface Fundraiser {
  id: string
  institution_id: string
  animal_id: string | null
  title: string
  description: string | null
  goal_amount: number
  current_amount: number
  deadline: string | null
  active: boolean
  image_url: string | null
  darujme_project_id: string | null
  darujme_url: string | null
  darujme_synced_at: string | null
  darujme_donors_count: number
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
  category: 'story' | 'tips' | 'news' | null
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
