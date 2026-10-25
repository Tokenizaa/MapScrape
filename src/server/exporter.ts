import JSZip from 'jszip';
import { Normalizer } from './normalizer';
import {
  Business,
  BusinessAddress,
  BusinessContact,
  BusinessWebsite,
  BusinessSocialProfile,
  BusinessReviewMetrics,
  BusinessReviewItem,
  BusinessHours,
  BusinessServiceItem,
  BusinessAttribute,
  BusinessLegalRecord,
  LeadQualification,
  ScrapeFieldEvidence,
  ExportManifest,
} from '../types/schema';

export interface ExportDataPayload {
  businesses: Business[];
  addresses: BusinessAddress[];
  contacts: BusinessContact[];
  websites: BusinessWebsite[];
  socials: BusinessSocialProfile[];
  reviewMetrics: BusinessReviewMetrics[];
  reviews: BusinessReviewItem[];
  hours: BusinessHours[];
  services: BusinessServiceItem[];
  attributes: BusinessAttribute[];
  legalRecords: BusinessLegalRecord[];
  leads: LeadQualification[];
  evidence: ScrapeFieldEvidence[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'zip_multi_csv';
  delimiter?: ',' | ';';
  includeBom?: boolean;
  protectFormulaInjection?: boolean;
  selectedFields?: string[];
  filterJobId?: string;
}

export class Exporter {
  /**
   * Helper to format an array of objects into CSV string
   */
  public static toCsv(
    headers: string[],
    rows: Array<Record<string, unknown>>,
    delimiter = ',',
    includeBom = true,
    protectFormulas = true
  ): string {
    const lines: string[] = [];

    // Header row
    lines.push(headers.join(delimiter));

    // Data rows
    for (const row of rows) {
      const lineCells = headers.map(header => {
        const val = row[header];
        if (protectFormulas) {
          return Normalizer.sanitizeCsvValue(val);
        }
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      lines.push(lineCells.join(delimiter));
    }

    const csvContent = lines.join('\r\n');
    return includeBom ? '\uFEFF' + csvContent : csvContent;
  }

  /**
   * Generates Universal Master CSV (1 row per business with flattened core columns)
   */
  public static generateMasterCsv(
    data: ExportDataPayload,
    options: ExportOptions = { format: 'csv', delimiter: ',', includeBom: true, protectFormulaInjection: true }
  ): string {
    const delimiter = options.delimiter || ',';
    const includeBom = options.includeBom ?? true;
    const protectFormulas = options.protectFormulaInjection ?? true;

    const headers = [
      'business_id',
      'business_name',
      'normalized_name',
      'legal_name',
      'primary_category',
      'commercial_segment',
      'establishment_type',
      'listing_status',
      'phone_primary',
      'whatsapp_link',
      'email_primary',
      'website_url',
      'rating',
      'review_count',
      'full_address',
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
      'postal_code',
      'latitude',
      'longitude',
      'google_place_id',
      'source_url',
      'enrichment_status',
      'lead_quality_score',
      'commercial_potential_score',
      'lead_priority',
      'created_at',
      'updated_at',
    ];

    const rows = data.businesses.map(b => {
      const addr = data.addresses.find(a => a.business_id === b.id);
      const primaryPhone = data.contacts.find(c => c.business_id === b.id && (c.type === 'phone' || c.type === 'mobile') && c.is_primary);
      const whatsapp = data.contacts.find(c => c.business_id === b.id && c.type === 'whatsapp');
      const email = data.contacts.find(c => c.business_id === b.id && c.type === 'email');
      const web = data.websites.find(w => w.business_id === b.id);
      const reviewMetric = data.reviewMetrics.find(r => r.business_id === b.id);
      const lead = data.leads.find(l => l.business_id === b.id);
      const legal = data.legalRecords.find(l => l.business_id === b.id);

      return {
        business_id: b.id,
        business_name: b.name,
        normalized_name: b.normalized_name,
        legal_name: legal?.corporate_name || b.legal_name || '',
        primary_category: b.primary_category,
        commercial_segment: b.commercial_segment,
        establishment_type: b.establishment_type,
        listing_status: b.listing_status,
        phone_primary: primaryPhone?.normalized_value || '',
        whatsapp_link: whatsapp?.whatsapp_direct_link || whatsapp?.normalized_value || '',
        email_primary: email?.normalized_value || '',
        website_url: web?.official_url || '',
        rating: reviewMetric?.average_rating ?? '',
        review_count: reviewMetric?.total_reviews ?? '',
        full_address: addr?.normalized_address || addr?.raw_address || '',
        street: addr?.street || '',
        number: addr?.number || '',
        neighborhood: addr?.neighborhood || '',
        city: addr?.city || '',
        state: addr?.state_code || addr?.state || '',
        postal_code: addr?.postal_code || '',
        latitude: addr?.latitude ?? '',
        longitude: addr?.longitude ?? '',
        google_place_id: b.google_place_id || '',
        source_url: b.source_url,
        enrichment_status: b.enrichment_status,
        lead_quality_score: lead?.data_quality_score ?? '',
        commercial_potential_score: lead?.commercial_potential_score ?? '',
        lead_priority: lead?.priority || '',
        created_at: b.created_at,
        updated_at: b.updated_at,
      };
    });

    return this.toCsv(headers, rows, delimiter, includeBom, protectFormulas);
  }

  /**
   * Generates Nested Full JSON
   */
  public static generateNestedJson(data: ExportDataPayload): string {
    const nested = data.businesses.map(b => {
      return {
        business: b,
        address: data.addresses.find(a => a.business_id === b.id) || null,
        contacts: data.contacts.filter(c => c.business_id === b.id),
        website: data.websites.find(w => w.business_id === b.id) || null,
        social_profiles: data.socials.filter(s => s.business_id === b.id),
        reviews_summary: data.reviewMetrics.find(r => r.business_id === b.id) || null,
        reviews_sample: data.reviews.filter(r => r.business_id === b.id),
        hours: data.hours.filter(h => h.business_id === b.id),
        services: data.services.filter(s => s.business_id === b.id),
        attributes: data.attributes.filter(a => a.business_id === b.id),
        legal_record: data.legalRecords.find(l => l.business_id === b.id) || null,
        lead_qualification: data.leads.find(l => l.business_id === b.id) || null,
        field_evidence: data.evidence.filter(e => e.business_id === b.id),
      };
    });

    return JSON.stringify({
      schema_version: '2.0.0',
      export_date: new Date().toISOString(),
      total_records: nested.length,
      data: nested,
    }, null, 2);
  }

  /**
   * Generates Multi-CSV ZIP archive with manifest.json and schema_dictionary.csv
   */
  public static async generateMultiCsvZip(
    data: ExportDataPayload,
    options: ExportOptions = { format: 'zip_multi_csv', delimiter: ',', includeBom: true, protectFormulaInjection: true }
  ): Promise<Buffer> {
    const zip = new JSZip();
    const delimiter = options.delimiter || ',';
    const includeBom = options.includeBom ?? true;
    const protect = options.protectFormulaInjection ?? true;

    // 1. businesses.csv
    const businessHeaders = [
      'id', 'name', 'original_name', 'normalized_name', 'primary_category',
      'commercial_segment', 'establishment_type', 'google_place_id', 'cid',
      'listing_status', 'enrichment_status', 'identification_confidence', 'created_at', 'updated_at'
    ];
    zip.file('businesses.csv', this.toCsv(businessHeaders, data.businesses as any, delimiter, includeBom, protect));

    // 2. addresses.csv
    const addressHeaders = [
      'id', 'business_id', 'raw_address', 'normalized_address', 'street', 'number',
      'neighborhood', 'city', 'state', 'state_code', 'postal_code', 'latitude', 'longitude', 'plus_code', 'timezone', 'last_verified_at'
    ];
    zip.file('addresses.csv', this.toCsv(addressHeaders, data.addresses as any, delimiter, includeBom, protect));

    // 3. contacts.csv
    const contactHeaders = [
      'id', 'business_id', 'type', 'label', 'raw_value', 'normalized_value', 'country_code', 'whatsapp_direct_link', 'is_primary', 'source', 'validation_status', 'confidence'
    ];
    zip.file('contacts.csv', this.toCsv(contactHeaders, data.contacts as any, delimiter, includeBom, protect));

    // 4. websites.csv
    const webHeaders = [
      'id', 'business_id', 'official_url', 'canonical_url', 'domain', 'protocol', 'http_status', 'page_title', 'meta_description', 'og_title', 'detected_cms', 'has_https', 'accessibility_score', 'last_checked_at'
    ];
    zip.file('websites.csv', this.toCsv(webHeaders, data.websites as any, delimiter, includeBom, protect));

    // 5. social_profiles.csv
    const socialHeaders = [
      'id', 'business_id', 'platform', 'profile_url', 'username', 'public_followers_count', 'discovery_source', 'verified_at'
    ];
    zip.file('social_profiles.csv', this.toCsv(socialHeaders, data.socials as any, delimiter, includeBom, protect));

    // 6. reviews.csv
    const reviewHeaders = [
      'id', 'business_id', 'author_name', 'rating', 'text_original', 'text_normalized', 'publish_date', 'owner_response_text', 'source'
    ];
    zip.file('reviews.csv', this.toCsv(reviewHeaders, data.reviews as any, delimiter, includeBom, protect));

    // 7. business_hours.csv
    const hoursHeaders = [
      'id', 'business_id', 'day_of_week', 'is_closed', 'is_24_hours', 'by_appointment_only', 'timezone', 'source', 'verified_at'
    ];
    zip.file('business_hours.csv', this.toCsv(hoursHeaders, data.hours as any, delimiter, includeBom, protect));

    // 8. services.csv
    const serviceHeaders = [
      'id', 'business_id', 'name', 'category', 'description', 'price', 'currency', 'price_observed_type', 'duration_minutes', 'source'
    ];
    zip.file('services.csv', this.toCsv(serviceHeaders, data.services as any, delimiter, includeBom, protect));

    // 9. attributes.csv
    const attrHeaders = [
      'id', 'business_id', 'category', 'attribute_key', 'display_label', 'value', 'source'
    ];
    zip.file('attributes.csv', this.toCsv(attrHeaders, data.attributes as any, delimiter, includeBom, protect));

    // 10. legal_records.csv
    const legalHeaders = [
      'id', 'business_id', 'cnpj', 'corporate_name', 'trade_name', 'registration_status', 'registration_date', 'legal_nature', 'source'
    ];
    zip.file('legal_records.csv', this.toCsv(legalHeaders, data.legalRecords as any, delimiter, includeBom, protect));

    // 11. lead_qualification.csv
    const leadHeaders = [
      'business_id', 'commercial_segment', 'prospecting_region', 'lead_status', 'data_quality_score', 'commercial_potential_score', 'priority', 'next_commercial_action', 'updated_at'
    ];
    zip.file('lead_qualification.csv', this.toCsv(leadHeaders, data.leads as any, delimiter, includeBom, protect));

    // 12. field_sources.csv (Evidence & DOM Traceability)
    const evidenceHeaders = [
      'id', 'job_id', 'business_id', 'field_name', 'raw_value', 'normalized_value', 'data_type', 'source_name', 'extraction_method', 'css_selector_used', 'html_attribute', 'confidence', 'created_at'
    ];
    zip.file('field_sources.csv', this.toCsv(evidenceHeaders, data.evidence as any, delimiter, includeBom, protect));

    // 13. schema_dictionary.csv
    const dictHeaders = ['table_name', 'column_name', 'data_type', 'is_required', 'foreign_key', 'description'];
    const dictRows = [
      { table_name: 'businesses', column_name: 'id', data_type: 'UUID/String', is_required: 'true', foreign_key: 'PRIMARY KEY', description: 'Identificador único do estabelecimento comercial' },
      { table_name: 'businesses', column_name: 'name', data_type: 'String', is_required: 'true', foreign_key: '-', description: 'Nome fantasia ou comercial' },
      { table_name: 'businesses', column_name: 'google_place_id', data_type: 'String', is_required: 'false', foreign_key: '-', description: 'Identificador universal do Google Maps Places' },
      { table_name: 'contacts', column_name: 'business_id', data_type: 'String', is_required: 'true', foreign_key: 'businesses.id', description: 'Chave estrangeira referenciando o estabelecimento' },
      { table_name: 'addresses', column_name: 'business_id', data_type: 'String', is_required: 'true', foreign_key: 'businesses.id', description: 'Chave estrangeira do endereço geográfico' },
      { table_name: 'websites', column_name: 'business_id', data_type: 'String', is_required: 'true', foreign_key: 'businesses.id', description: 'Metadados web e tecnológicos' },
      { table_name: 'lead_qualification', column_name: 'business_id', data_type: 'String', is_required: 'true', foreign_key: 'businesses.id', description: 'Scores de qualidade e potencial comercial' },
      { table_name: 'field_sources', column_name: 'business_id', data_type: 'String', is_required: 'true', foreign_key: 'businesses.id', description: 'Rastreabilidade de seletor CSS e evidência DOM' },
    ];
    zip.file('schema_dictionary.csv', this.toCsv(dictHeaders, dictRows, delimiter, includeBom, protect));

    // 14. manifest.json
    const manifest: ExportManifest = {
      export_id: `export_${Date.now()}`,
      created_at: new Date().toISOString(),
      generator: 'MapScrape Pro Universal Data Engine v2.4.0',
      schema_version: '2.0.0',
      records_count: data.businesses.length,
      files: [
        { name: 'businesses.csv', rows_count: data.businesses.length, description: 'Tabela principal de estabelecimentos' },
        { name: 'addresses.csv', rows_count: data.addresses.length, description: 'Geolocalização, coordenadas e endereços normalizados' },
        { name: 'contacts.csv', rows_count: data.contacts.length, description: 'Telefones, WhatsApp e e-mails validados' },
        { name: 'websites.csv', rows_count: data.websites.length, description: 'Metadados web, CMS, SEO e tecnologias detectadas' },
        { name: 'social_profiles.csv', rows_count: data.socials.length, description: 'Links para Instagram, LinkedIn, Facebook, YouTube' },
        { name: 'reviews.csv', rows_count: data.reviews.length, description: 'Avaliações públicas com notas e datas' },
        { name: 'business_hours.csv', rows_count: data.hours.length, description: 'Grade semanal de horários de funcionamento' },
        { name: 'services.csv', rows_count: data.services.length, description: 'Catálogo de serviços, preços e durações' },
        { name: 'attributes.csv', rows_count: data.attributes.length, description: 'Comodidades, acessibilidade e formas de pagamento' },
        { name: 'legal_records.csv', rows_count: data.legalRecords.length, description: 'Dados cadastrais da Receita Federal / CNPJ' },
        { name: 'lead_qualification.csv', rows_count: data.leads.length, description: 'Score de potencial e qualificação comercial' },
        { name: 'field_sources.csv', rows_count: data.evidence.length, description: 'Rastreabilidade de seletores DOM e fontes' },
        { name: 'schema_dictionary.csv', rows_count: dictRows.length, description: 'Dicionário e contrato de interoperabilidade' },
      ],
      applied_filters: options.filterJobId ? { job_id: options.filterJobId } : { all_records: true },
      field_dictionary: {
        business_id: { type: 'string', description: 'ID estável interno', source: 'engine' },
        business_name: { type: 'string', description: 'Nome de exibição comercial', source: 'gmaps' },
        phone: { type: 'string', description: 'Telefone em formato E.164 e legível', source: 'gmaps / website' },
        whatsapp: { type: 'string', description: 'Link de chat direto WhatsApp', source: 'website' },
        cnpj: { type: 'string', description: 'Cadastro Nacional da Pessoa Jurídica', source: 'receita_federal' },
      },
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  }
}
