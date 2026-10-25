// Comprehensive Field Catalog & Data Architecture
// Matching the 20 Field Groups of the Master Specification

export type ScrapingStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
export type EnrichmentStatus = 'pending' | 'in_progress' | 'enriched' | 'partial' | 'failed';
export type SelectorStatus = 'verified' | 'degraded' | 'broken' | 'untested';
export type LeadPriority = 'high' | 'medium' | 'low';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'suppressed';

// 4.1 Identificação do Estabelecimento
export interface Business {
  id: string;
  name: string;
  original_name: string;
  normalized_name: string;
  trade_name?: string;
  legal_name?: string; // Razão social
  display_name: string;
  alternative_names?: string[];
  previous_names?: string[];
  primary_category: string;
  secondary_categories: string[];
  commercial_segment: string;
  commercial_subsegment?: string;
  establishment_type: string;
  google_place_id?: string;
  cid?: string;
  source_url: string;
  canonical_url?: string;
  final_url?: string;
  listing_status: 'operational' | 'permanently_closed' | 'temporarily_closed';
  opening_date?: string;
  founding_date?: string;
  created_at: string;
  updated_at: string;
  identification_confidence: number; // 0 - 100
  is_duplicate?: boolean;
  duplicate_of_id?: string;
  enrichment_status: EnrichmentStatus;
  lead_score?: number; // 0 - 100
}

// 4.2 Endereço e Localização Geográfica
export interface BusinessAddress {
  id: string;
  business_id: string;
  raw_address: string;
  normalized_address: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  district?: string;
  city: string;
  state: string;
  state_code: string;
  country: string;
  country_code: string;
  postal_code: string; // CEP
  latitude: number;
  longitude: number;
  plus_code?: string;
  administrative_region?: string;
  service_area?: string;
  location_url?: string;
  directions_url?: string;
  timezone: string;
  geo_precision: 'rooftop' | 'interpolated' | 'geometric_center' | 'approximate';
  source: string;
  last_verified_at: string;
}

// 4.3 Contatos Comerciais
export interface BusinessContact {
  id: string;
  business_id: string;
  type: 'phone' | 'mobile' | 'whatsapp' | 'email' | 'contact_form' | 'booking_url';
  label: string;
  raw_value: string;
  normalized_value: string;
  country_code?: string;
  extension?: string;
  whatsapp_direct_link?: string;
  is_primary: boolean;
  source: string;
  collected_at: string;
  validation_method: 'format_check' | 'dns_lookup' | 'dom_link' | 'api';
  validation_status: 'valid' | 'invalid' | 'unverified';
  confidence: number;
}

// 4.4 Site e Presença Digital
export interface BusinessWebsite {
  id: string;
  business_id: string;
  official_url: string;
  initial_url: string;
  canonical_url: string;
  final_url: string;
  protocol: 'https' | 'http';
  domain: string;
  subdomain?: string;
  http_status: number;
  page_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  language?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  twitter_card?: string;
  favicon?: string;
  logo?: string;
  has_sitemap: boolean;
  has_robots: boolean;
  discovered_internal_urls: string[];
  contact_page_url?: string;
  services_page_url?: string;
  about_page_url?: string;
  booking_page_url?: string;
  faq_page_url?: string;
  privacy_page_url?: string;
  terms_page_url?: string;
  has_https: boolean;
  detected_technologies: string[];
  detected_cms?: string;
  detected_framework?: string;
  schema_org_types: string[];
  schema_raw_json?: string;
  accessibility_score?: number;
  technical_issues?: string[];
  last_checked_at: string;
}

// 4.5 Redes Sociais e Perfis Públicos
export interface BusinessSocialProfile {
  id: string;
  business_id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'x' | 'threads' | 'google_business';
  profile_url: string;
  username?: string;
  display_name?: string;
  public_followers_count?: number;
  public_posts_count?: number;
  discovery_source: string;
  access_status: 'active' | 'private' | 'not_found';
  association_confidence: number;
  verified_at: string;
}

// 4.6 Avaliações e Reputação
export interface BusinessReviewMetrics {
  business_id: string;
  average_rating: number; // e.g. 4.8
  rating_scale: number; // 5.0
  total_reviews: number;
  star_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  latest_review_date?: string;
  oldest_review_date?: string;
  review_velocity_per_month?: number;
  source: string;
  collected_at: string;
}

export interface BusinessReviewItem {
  id: string;
  business_id: string;
  author_name: string;
  author_photo_url?: string;
  rating: number;
  text_original: string;
  text_normalized: string;
  publish_date: string;
  review_url?: string;
  owner_response_text?: string;
  owner_response_date?: string;
  language?: string;
  source: string;
}

// 4.7 Fotografias e Identidade Visual
export interface BusinessImage {
  id: string;
  business_id: string;
  image_url: string;
  thumbnail_url?: string;
  high_res_url?: string;
  image_type: 'logo' | 'facade' | 'interior' | 'products' | 'services' | 'team' | 'general';
  alt_text?: string;
  caption?: string;
  dimensions?: string;
  format?: string;
  source_page: string;
  collected_at: string;
}

// 4.8 Horários de Funcionamento
export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  is_closed: boolean;
  is_24_hours: boolean;
  by_appointment_only: boolean;
  time_slots: Array<{
    open: string;  // e.g. "08:00"
    close: string; // e.g. "18:00"
  }>;
  special_notes?: string;
  timezone: string;
  source: string;
  verified_at: string;
}

// 4.9 Serviços, Produtos e Ofertas
export interface BusinessServiceItem {
  id: string;
  business_id: string;
  name: string;
  category?: string;
  description?: string;
  price?: number;
  price_observed_type: 'exact' | 'starting_from' | 'range' | 'inquire';
  currency: string;
  duration_minutes?: number;
  booking_url?: string;
  source: string;
  collected_at: string;
}

// 4.10 Características e Comodidades
export interface BusinessAttribute {
  id: string;
  business_id: string;
  category: 'payment' | 'accessibility' | 'amenity' | 'service_option' | 'health_safety';
  attribute_key: string;
  display_label: string;
  value: boolean | string;
  source: string;
  collected_at: string;
}

// 4.11 Indicadores Públicos de Popularidade
export interface BusinessPopularityMetric {
  business_id: string;
  popular_times_summary?: string;
  busy_hours?: Record<string, string>; // e.g. "monday_14": "Normalmente movimentado"
  average_wait_time_minutes?: number;
  review_growth_rate_pct?: number;
  source: string;
  observation_period: string;
  calculated_at: string;
}

// 4.12 Dados Empresariais e Institucionais Externos (Receita / CNPJ)
export interface BusinessLegalRecord {
  id: string;
  business_id: string;
  cnpj?: string;
  corporate_name?: string; // Razão Social oficial
  trade_name?: string;     // Nome Fantasia oficial
  registration_status?: 'ATIVA' | 'SUSPENSA' | 'INAPTA' | 'BAIXADA';
  registration_date?: string;
  primary_cnae?: {
    code: string;
    description: string;
  };
  secondary_cnaes?: Array<{
    code: string;
    description: string;
  }>;
  legal_nature?: string;
  registered_address?: string;
  is_headquarters?: boolean;
  source: string;
  query_date: string;
  validation_status: 'verified' | 'unverified';
}

// 4.13 Equipe e Profissionais
export interface BusinessProfessional {
  id: string;
  business_id: string;
  public_name: string;
  role: string;
  specialty?: string;
  public_profile_url?: string;
  photo_url?: string;
  source: string;
  collected_at: string;
}

// 4.14 Perguntas e Respostas Públicas
export interface BusinessQuestionAnswer {
  id: string;
  business_id: string;
  question_text: string;
  question_date?: string;
  answer_text?: string;
  answer_date?: string;
  source: string;
}

// 4.15 Filiais e Relações Comerciais
export interface BusinessRelationship {
  id: string;
  business_id: string;
  related_business_id?: string;
  network_name?: string;
  unit_name?: string;
  unit_address?: string;
  unit_phone?: string;
  relationship_type: 'headquarters' | 'branch' | 'affiliate';
  confidence: number;
}

// 4.16 Qualificação e Gestão de Leads
export interface LeadQualification {
  business_id: string;
  commercial_segment: string;
  campaign_name?: string;
  prospecting_region: string;
  lead_status: LeadStatus;
  data_quality_score: number; // 0 - 100
  commercial_potential_score: number; // 0 - 100
  score_reasons: string[];
  flags: {
    missing_website: boolean;
    unresponsive_website: boolean;
    missing_commercial_phone: boolean;
    missing_whatsapp: boolean;
    low_social_presence: boolean;
    high_rating_unclaimed: boolean;
  };
  priority: LeadPriority;
  next_commercial_action?: string;
  commercial_notes?: string;
  updated_at: string;
}

// 4.17 Rastreabilidade da Raspagem e do DOM
export interface ScrapeJob {
  id: string;
  name: string;
  query: string;
  category?: string;
  location: string;
  target_volume: number;
  sources: string[];
  enrichment_enabled: boolean;
  enrichment_depth: number;
  status: ScrapingStatus;
  found_count: number;
  processed_count: number;
  duplicated_count: number;
  error_count: number;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
    business_id?: string;
    field_name?: string;
  }>;
}

export interface ScrapeFieldEvidence {
  id: string;
  job_id: string;
  business_id: string;
  field_name: string;
  raw_value: string;
  normalized_value: string;
  data_type: string;
  source_name: string;
  source_url: string;
  page_type: 'gmaps_listing' | 'gmaps_place' | 'website_home' | 'website_contact' | 'website_about';
  extraction_method: 'css_selector' | 'xpath' | 'json_ld' | 'regex_dom' | 'api';
  css_selector_used?: string;
  html_attribute?: string; // aria-label, href, src, content, text
  html_snippet?: string;
  fallback_used?: boolean;
  confidence: number;
  validation_result: 'valid' | 'fallback' | 'invalid';
  created_at: string;
}

export interface ScrapeSelectorRegistry {
  id: string;
  source_name: string;
  target_url_pattern: string;
  target_field: string;
  primary_css_selector: string;
  attribute_name: string; // text, href, aria-label, src, content
  alternative_css_selector?: string;
  fallback_strategy: string;
  success_count: number;
  failure_count: number;
  last_validated_at: string;
  status: SelectorStatus;
  last_error?: string;
}

// 4.18 Histórico de Alterações
export interface BusinessChangeHistory {
  id: string;
  business_id: string;
  field_name: string;
  previous_value: string;
  new_value: string;
  change_reason: string;
  source: string;
  job_id?: string;
  created_at: string;
}

// 4.19 Campos Extensíveis
export interface CustomFieldDefinition {
  id: string;
  field_key: string;
  display_label: string;
  description: string;
  category: string;
  data_type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'array';
  expected_source: string;
  preferred_css_selector?: string;
  preferred_attribute?: string;
  validation_rule?: string;
  created_at: string;
}

// 4.20 Exportação e Interoperabilidade
export interface ExportJob {
  id: string;
  file_name: string;
  format: 'csv' | 'json' | 'zip_multi_csv';
  delimiter: ',' | ';';
  include_bom: boolean;
  protect_formula_injection: boolean;
  filter_job_id?: string;
  filter_category?: string;
  filter_city?: string;
  records_count: number;
  columns_count: number;
  schema_version: string;
  included_fields: string[];
  file_size_bytes?: number;
  status: 'generating' | 'ready' | 'failed';
  download_url: string;
  created_at: string;
}

export interface ExportManifest {
  export_id: string;
  created_at: string;
  generator: string;
  schema_version: string;
  records_count: number;
  files: Array<{
    name: string;
    rows_count: number;
    description: string;
  }>;
  applied_filters: Record<string, any>;
  field_dictionary: Record<string, { type: string; description: string; source: string }>;
}
