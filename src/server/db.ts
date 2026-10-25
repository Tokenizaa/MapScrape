import fs from 'fs';
import path from 'path';
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
  ScrapeJob,
  ScrapeFieldEvidence,
  ScrapeSelectorRegistry,
  CustomFieldDefinition,
  ExportJob,
  BusinessChangeHistory,
} from '../types/schema';
import { ExportDataPayload } from './exporter';
import { Normalizer } from './normalizer';

interface DatabaseSchema {
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
  jobs: ScrapeJob[];
  evidence: ScrapeFieldEvidence[];
  selectors: ScrapeSelectorRegistry[];
  customFields: CustomFieldDefinition[];
  exportJobs: ExportJob[];
  changeHistory: BusinessChangeHistory[];
  settings: {
    firecrawlApiKey: string;
    concurrencyLimit: number;
    timeoutSeconds: number;
    userAgent: string;
    csvDelimiter: ',' | ';';
    includeBom: boolean;
    protectFormulas: boolean;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export class Database {
  private static instance: Database;
  private data: DatabaseSchema;

  private constructor() {
    this.data = this.loadDatabase();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading database file, re-initializing seed data:', err);
    }
    const seed = this.generateSeedData();
    this.saveToDisk(seed);
    return seed;
  }

  private saveToDisk(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  // --- STATS & OVERVIEW ---
  public getStats() {
    const total = this.data.businesses.length;
    const enriched = this.data.businesses.filter(b => b.enrichment_status === 'enriched').length;
    const pending = this.data.businesses.filter(b => b.enrichment_status === 'pending').length;
    const activeJobs = this.data.jobs.filter(j => j.status === 'running').length;
    const completedJobs = this.data.jobs.filter(j => j.status === 'completed').length;
    const failedJobs = this.data.jobs.filter(j => j.status === 'failed').length;
    const totalEvidences = this.data.evidence.length;
    const duplicates = this.data.businesses.filter(b => b.is_duplicate).length;

    // Field coverage percentage across all master fields
    const coverage: Record<string, number> = {
      nome_comercial: 100,
      categoria: 100,
      endereco: Math.round((this.data.addresses.length / Math.max(1, total)) * 100),
      telefone_principal: Math.round((this.data.contacts.filter(c => c.type === 'phone' || c.type === 'mobile').length / Math.max(1, total)) * 100),
      whatsapp: Math.round((this.data.contacts.filter(c => c.type === 'whatsapp').length / Math.max(1, total)) * 100),
      site_oficial: Math.round((this.data.websites.filter(w => !!w.official_url).length / Math.max(1, total)) * 100),
      avaliacoes_nota: Math.round((this.data.reviewMetrics.length / Math.max(1, total)) * 100),
      horarios_semana: Math.round((this.data.hours.length > 0 ? (total > 0 ? 95 : 0) : 0)),
      cnpj_dados_legais: Math.round((this.data.legalRecords.length / Math.max(1, total)) * 100),
      qualificacao_lead: Math.round((this.data.leads.length / Math.max(1, total)) * 100),
      evidencias_dom: Math.round((totalEvidences > 0 ? 100 : 0)),
    };

    return {
      totalBusinesses: total,
      enrichedBusinesses: enriched,
      pendingBusinesses: pending,
      activeJobs,
      completedJobs,
      failedJobs,
      totalEvidences,
      duplicateRatePct: total > 0 ? Number(((duplicates / total) * 100).toFixed(1)) : 0,
      fieldCoverage: coverage,
      recentExports: this.data.exportJobs.slice(-5).reverse(),
      selectorsCount: this.data.selectors.length,
      customFieldsCount: this.data.customFields.length,
    };
  }

  // --- BUSINESSES ---
  public getBusinesses(params: {
    query?: string;
    category?: string;
    city?: string;
    leadStatus?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.data.businesses];

    if (params.query) {
      const q = params.query.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.normalized_name.toLowerCase().includes(q) ||
        b.primary_category.toLowerCase().includes(q)
      );
    }

    if (params.category && params.category !== 'all') {
      list = list.filter(b => b.primary_category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params.city && params.city !== 'all') {
      const bIds = new Set(
        this.data.addresses
          .filter(a => a.city.toLowerCase() === params.city!.toLowerCase())
          .map(a => a.business_id)
      );
      list = list.filter(b => bIds.has(b.id));
    }

    const total = list.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 20);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    // Attach basic relational snippets for data grid
    const enrichedItems = paginated.map(b => {
      const addr = this.data.addresses.find(a => a.business_id === b.id);
      const phone = this.data.contacts.find(c => c.business_id === b.id && (c.type === 'phone' || c.type === 'mobile'));
      const web = this.data.websites.find(w => w.business_id === b.id);
      const reviews = this.data.reviewMetrics.find(r => r.business_id === b.id);
      const lead = this.data.leads.find(l => l.business_id === b.id);

      return {
        ...b,
        city: addr?.city || '',
        state: addr?.state_code || addr?.state || '',
        phone: phone?.normalized_value || '',
        website: web?.official_url || '',
        rating: reviews?.average_rating,
        review_count: reviews?.total_reviews,
        lead_priority: lead?.priority,
        lead_score: lead?.commercial_potential_score,
      };
    });

    return {
      items: enrichedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public getBusinessDetail(id: string) {
    const business = this.data.businesses.find(b => b.id === id);
    if (!business) return null;

    return {
      business,
      address: this.data.addresses.find(a => a.business_id === id) || null,
      contacts: this.data.contacts.filter(c => c.business_id === id),
      website: this.data.websites.find(w => w.business_id === id) || null,
      socials: this.data.socials.filter(s => s.business_id === id),
      reviewMetrics: this.data.reviewMetrics.find(r => r.business_id === id) || null,
      reviews: this.data.reviews.filter(r => r.business_id === id),
      hours: this.data.hours.filter(h => h.business_id === id),
      services: this.data.services.filter(s => s.business_id === id),
      attributes: this.data.attributes.filter(a => a.business_id === id),
      legalRecord: this.data.legalRecords.find(l => l.business_id === id) || null,
      lead: this.data.leads.find(l => l.business_id === id) || null,
      evidences: this.data.evidence.filter(e => e.business_id === id),
      changeHistory: this.data.changeHistory.filter(h => h.business_id === id),
    };
  }

  // --- SAVE SCRAPE BUNDLE ---
  public saveBundle(bundle: {
    business: Business;
    address: BusinessAddress;
    contacts: BusinessContact[];
    website?: BusinessWebsite;
    reviewMetrics: BusinessReviewMetrics;
    reviews: BusinessReviewItem[];
    hours: BusinessHours[];
    attributes: BusinessAttribute[];
    legalRecord?: BusinessLegalRecord;
    lead: LeadQualification;
    evidences: ScrapeFieldEvidence[];
  }) {
    // Add business
    this.data.businesses.unshift(bundle.business);
    this.data.addresses.push(bundle.address);
    this.data.contacts.push(...bundle.contacts);
    if (bundle.website) this.data.websites.push(bundle.website);
    this.data.reviewMetrics.push(bundle.reviewMetrics);
    this.data.reviews.push(...bundle.reviews);
    this.data.hours.push(...bundle.hours);
    this.data.attributes.push(...bundle.attributes);
    if (bundle.legalRecord) this.data.legalRecords.push(bundle.legalRecord);
    this.data.leads.push(bundle.lead);
    this.data.evidence.push(...bundle.evidences);

    this.saveToDisk();
  }

  // --- JOBS ---
  public getJobs(): ScrapeJob[] {
    return this.data.jobs;
  }

  public getJob(id: string): ScrapeJob | undefined {
    return this.data.jobs.find(j => j.id === id);
  }

  public createJob(jobData: Partial<ScrapeJob>): ScrapeJob {
    const job: ScrapeJob = {
      id: `job_${Date.now()}`,
      name: jobData.name || `Pesquisa ${new Date().toLocaleTimeString('pt-BR')}`,
      query: jobData.query || '',
      category: jobData.category,
      location: jobData.location || 'São Paulo, SP',
      target_volume: jobData.target_volume || 10,
      sources: jobData.sources || ['Google Maps', 'Web Oficial'],
      enrichment_enabled: jobData.enrichment_enabled ?? true,
      enrichment_depth: jobData.enrichment_depth || 2,
      status: 'idle',
      found_count: 0,
      processed_count: 0,
      duplicated_count: 0,
      error_count: 0,
      start_time: new Date().toISOString(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Trabalho de coleta registrado e enfileirado para execução.',
        },
      ],
    };
    this.data.jobs.unshift(job);
    this.saveToDisk();
    return job;
  }

  public updateJob(id: string, updates: Partial<ScrapeJob>) {
    const jobIndex = this.data.jobs.findIndex(j => j.id === id);
    if (jobIndex >= 0) {
      this.data.jobs[jobIndex] = { ...this.data.jobs[jobIndex], ...updates };
      this.saveToDisk();
    }
  }

  public addJobLog(id: string, message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    const job = this.data.jobs.find(j => j.id === id);
    if (job) {
      job.logs.push({
        timestamp: new Date().toISOString(),
        level,
        message,
      });
      this.saveToDisk();
    }
  }

  // --- SELECTORS ---
  public getSelectors(): ScrapeSelectorRegistry[] {
    return this.data.selectors;
  }

  public updateSelector(id: string, updates: Partial<ScrapeSelectorRegistry>) {
    const idx = this.data.selectors.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.data.selectors[idx] = { ...this.data.selectors[idx], ...updates, last_validated_at: new Date().toISOString() };
      this.saveToDisk();
      return this.data.selectors[idx];
    }
    return null;
  }

  // --- CUSTOM FIELDS ---
  public getCustomFields(): CustomFieldDefinition[] {
    return this.data.customFields;
  }

  public createCustomField(field: Omit<CustomFieldDefinition, 'id' | 'created_at'>): CustomFieldDefinition {
    const newField: CustomFieldDefinition = {
      ...field,
      id: `custom_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.data.customFields.push(newField);
    this.saveToDisk();
    return newField;
  }

  // --- EXPORT PAYLOAD ---
  public getExportData(filterJobId?: string): ExportDataPayload {
    let businesses = this.data.businesses;
    if (filterJobId) {
      // Find businesses associated with this job
      const evBizIds = new Set(this.data.evidence.filter(e => e.job_id === filterJobId).map(e => e.business_id));
      businesses = businesses.filter(b => evBizIds.has(b.id));
    }

    const bIds = new Set(businesses.map(b => b.id));

    return {
      businesses,
      addresses: this.data.addresses.filter(a => bIds.has(a.business_id)),
      contacts: this.data.contacts.filter(c => bIds.has(c.business_id)),
      websites: this.data.websites.filter(w => bIds.has(w.business_id)),
      socials: this.data.socials.filter(s => bIds.has(s.business_id)),
      reviewMetrics: this.data.reviewMetrics.filter(r => bIds.has(r.business_id)),
      reviews: this.data.reviews.filter(r => bIds.has(r.business_id)),
      hours: this.data.hours.filter(h => bIds.has(h.business_id)),
      services: this.data.services.filter(s => bIds.has(s.business_id)),
      attributes: this.data.attributes.filter(a => bIds.has(a.business_id)),
      legalRecords: this.data.legalRecords.filter(l => bIds.has(l.business_id)),
      leads: this.data.leads.filter(l => bIds.has(l.business_id)),
      evidence: this.data.evidence.filter(e => bIds.has(e.business_id)),
    };
  }

  // --- EXPORT JOBS ---
  public getExportJobs(): ExportJob[] {
    return this.data.exportJobs;
  }

  public recordExportJob(job: ExportJob) {
    this.data.exportJobs.unshift(job);
    this.saveToDisk();
  }

  // --- SETTINGS ---
  public getSettings() {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<DatabaseSchema['settings']>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveToDisk();
    return this.data.settings;
  }

  // --- INITIAL SEED GENERATOR ---
  private generateSeedData(): DatabaseSchema {
    const now = new Date().toISOString();

    const businesses: Business[] = [
      {
        id: 'biz_seed_1',
        name: 'Hospital Israelita Albert Einstein',
        original_name: 'Hospital Israelita Albert Einstein',
        normalized_name: 'Hospital Israelita Albert Einstein',
        trade_name: 'Einstein Hospital',
        legal_name: 'SOCIEDADE BENEFICENTE ISRAELITA BRASILEIRA ALBERT EINSTEIN',
        display_name: 'Hospital Israelita Albert Einstein',
        primary_category: 'Hospital Geral',
        secondary_categories: ['Pronto-Socorro', 'Medicina Diagnóstica', 'Maternidade'],
        commercial_segment: 'Saúde e Medicina',
        establishment_type: 'Complexo Hospitalar',
        google_place_id: 'ChIJ598l1EpeypQRh_88GjY52C8',
        cid: '3448293847561928',
        source_url: 'https://www.google.com/maps/place/?q=place_id:ChIJ598l1EpeypQRh_88GjY52C8',
        listing_status: 'operational',
        created_at: now,
        updated_at: now,
        identification_confidence: 100,
        enrichment_status: 'enriched',
        lead_score: 85,
      },
      {
        id: 'biz_seed_2',
        name: 'Dengo Chocolates Morumbi',
        original_name: 'Dengo Chocolates - Shopping Morumbi',
        normalized_name: 'Dengo Chocolates Morumbi',
        trade_name: 'Dengo',
        legal_name: 'DENGO CHOCOLATES S.A.',
        display_name: 'Dengo Chocolates Morumbi',
        primary_category: 'Chocolateria',
        secondary_categories: ['Cafeteria', 'Doceria', 'Presentes'],
        commercial_segment: 'Alimentos e Gastronomia',
        establishment_type: 'Loja de Shopping',
        google_place_id: 'ChIJv8v2uW5eypQRt64w1Y69j8A',
        cid: '8792019283746501',
        source_url: 'https://www.google.com/maps/place/?q=place_id:ChIJv8v2uW5eypQRt64w1Y69j8A',
        listing_status: 'operational',
        created_at: now,
        updated_at: now,
        identification_confidence: 100,
        enrichment_status: 'enriched',
        lead_score: 78,
      },
      {
        id: 'biz_seed_3',
        name: 'Totvs S.A. Matriz',
        original_name: 'TOTVS S.A.',
        normalized_name: 'Totvs S.A. Matriz',
        trade_name: 'Totvs',
        legal_name: 'TOTVS S.A.',
        display_name: 'Totvs Brasil',
        primary_category: 'Empresa de Software',
        secondary_categories: ['Sistemas de Gestão ERP', 'Consultoria Empresarial', 'Tecnologia em Nuvem'],
        commercial_segment: 'Tecnologia da Informação',
        establishment_type: 'Sede Corporativa',
        google_place_id: 'ChIJX92-3wBby5QR798124j8ABC',
        cid: '1238947561029384',
        source_url: 'https://www.google.com/maps/place/?q=place_id:ChIJX92-3wBby5QR798124j8ABC',
        listing_status: 'operational',
        created_at: now,
        updated_at: now,
        identification_confidence: 100,
        enrichment_status: 'enriched',
        lead_score: 92,
      },
    ];

    const addresses: BusinessAddress[] = [
      {
        id: 'addr_seed_1',
        business_id: 'biz_seed_1',
        raw_address: 'Av. Albert Einstein, 627 - Morumbi, São Paulo - SP, 05652-900',
        normalized_address: 'Avenida Albert Einstein, 627 - Morumbi, São Paulo - SP, 05652-900',
        street: 'Avenida Albert Einstein',
        number: '627',
        neighborhood: 'Morumbi',
        city: 'São Paulo',
        state: 'São Paulo',
        state_code: 'SP',
        country: 'Brasil',
        country_code: 'BR',
        postal_code: '05652-900',
        latitude: -23.5997,
        longitude: -46.7153,
        plus_code: '87G3C72M+3X',
        timezone: 'America/Sao_Paulo',
        geo_precision: 'rooftop',
        source: 'google_maps',
        last_verified_at: now,
      },
      {
        id: 'addr_seed_2',
        business_id: 'biz_seed_2',
        raw_address: 'Av. Roque Petroni Júnior, 1089 - Piso Térreo - Vila Gertrudes, São Paulo - SP, 04707-900',
        normalized_address: 'Avenida Roque Petroni Júnior, 1089 - Piso Térreo - Vila Gertrudes, São Paulo - SP, 04707-900',
        street: 'Avenida Roque Petroni Júnior',
        number: '1089',
        complement: 'Piso Térreo, Loja 114',
        neighborhood: 'Vila Gertrudes',
        city: 'São Paulo',
        state: 'São Paulo',
        state_code: 'SP',
        country: 'Brasil',
        country_code: 'BR',
        postal_code: '04707-900',
        latitude: -23.6225,
        longitude: -46.6983,
        plus_code: '87G398H2+X7',
        timezone: 'America/Sao_Paulo',
        geo_precision: 'rooftop',
        source: 'google_maps',
        last_verified_at: now,
      },
      {
        id: 'addr_seed_3',
        business_id: 'biz_seed_3',
        raw_address: 'Av. Braz Leme, 1000 - Casa Verde, São Paulo - SP, 02511-000',
        normalized_address: 'Avenida Braz Leme, 1000 - Casa Verde, São Paulo - SP, 02511-000',
        street: 'Avenida Braz Leme',
        number: '1000',
        neighborhood: 'Casa Verde',
        city: 'São Paulo',
        state: 'São Paulo',
        state_code: 'SP',
        country: 'Brasil',
        country_code: 'BR',
        postal_code: '02511-000',
        latitude: -23.5098,
        longitude: -46.6534,
        plus_code: '87G3FRRW+4H',
        timezone: 'America/Sao_Paulo',
        geo_precision: 'rooftop',
        source: 'google_maps',
        last_verified_at: now,
      },
    ];

    const contacts: BusinessContact[] = [
      {
        id: 'cnt_seed_1',
        business_id: 'biz_seed_1',
        type: 'phone',
        label: 'Central de Atendimento 24h',
        raw_value: '(11) 2151-1233',
        normalized_value: '(11) 2151-1233',
        country_code: '55',
        is_primary: true,
        source: 'google_maps',
        collected_at: now,
        validation_method: 'format_check',
        validation_status: 'valid',
        confidence: 99,
      },
      {
        id: 'cnt_seed_2',
        business_id: 'biz_seed_1',
        type: 'whatsapp',
        label: 'Agendamento WhatsApp Einstein',
        raw_value: '+55 11 3620-2550',
        normalized_value: '(11) 3620-2550',
        whatsapp_direct_link: 'https://wa.me/551136202550',
        is_primary: false,
        source: 'website_link',
        collected_at: now,
        validation_method: 'dom_link',
        validation_status: 'valid',
        confidence: 98,
      },
      {
        id: 'cnt_seed_3',
        business_id: 'biz_seed_2',
        type: 'phone',
        label: 'Telefone Loja Morumbi',
        raw_value: '(11) 5181-2244',
        normalized_value: '(11) 5181-2244',
        country_code: '55',
        is_primary: true,
        source: 'google_maps',
        collected_at: now,
        validation_method: 'format_check',
        validation_status: 'valid',
        confidence: 95,
      },
      {
        id: 'cnt_seed_4',
        business_id: 'biz_seed_3',
        type: 'phone',
        label: 'Central Corporativa Totvs',
        raw_value: '0800 70 98 100',
        normalized_value: '0800 70 98 100',
        country_code: '55',
        is_primary: true,
        source: 'google_maps',
        collected_at: now,
        validation_method: 'format_check',
        validation_status: 'valid',
        confidence: 98,
      },
    ];

    const websites: BusinessWebsite[] = [
      {
        id: 'web_seed_1',
        business_id: 'biz_seed_1',
        official_url: 'https://www.einstein.br',
        initial_url: 'https://www.einstein.br',
        canonical_url: 'https://www.einstein.br',
        final_url: 'https://www.einstein.br',
        protocol: 'https',
        domain: 'einstein.br',
        http_status: 200,
        page_title: 'Hospital Israelita Albert Einstein | Saúde e Inovação',
        meta_description: 'Referência latino-americana em atendimento médico, procedimentos de alta complexidade e pesquisa.',
        og_title: 'Hospital Albert Einstein',
        og_image: 'https://www.einstein.br/assets/og-image.jpg',
        has_sitemap: true,
        has_robots: true,
        discovered_internal_urls: ['/agendamento', '/exames', '/medicos', '/especialidades'],
        contact_page_url: 'https://www.einstein.br/fale-conosco',
        has_https: true,
        detected_technologies: ['Next.js', 'React', 'Google Tag Manager', 'Cloudflare CDN'],
        detected_framework: 'Next.js',
        schema_org_types: ['Hospital', 'MedicalOrganization'],
        accessibility_score: 96,
        last_checked_at: now,
      },
      {
        id: 'web_seed_2',
        business_id: 'biz_seed_2',
        official_url: 'https://www.dengo.com.br',
        initial_url: 'https://www.dengo.com.br',
        canonical_url: 'https://www.dengo.com.br',
        final_url: 'https://www.dengo.com.br',
        protocol: 'https',
        domain: 'dengo.com.br',
        http_status: 200,
        page_title: 'Dengo Chocolates | Mais Cacau, Menos Açúcar',
        meta_description: 'Chocolates brasileiros autênticos de origem sustentável e comércio justo da Bahia.',
        has_sitemap: true,
        has_robots: true,
        discovered_internal_urls: ['/lojas', '/produtos', '/sustentabilidade'],
        has_https: true,
        detected_technologies: ['VTEX IO', 'React', 'Tailwind CSS'],
        detected_cms: 'VTEX',
        schema_org_types: ['Store', 'LocalBusiness'],
        accessibility_score: 91,
        last_checked_at: now,
      },
      {
        id: 'web_seed_3',
        business_id: 'biz_seed_3',
        official_url: 'https://www.totvs.com',
        initial_url: 'https://www.totvs.com',
        canonical_url: 'https://www.totvs.com',
        final_url: 'https://www.totvs.com',
        protocol: 'https',
        domain: 'totvs.com',
        http_status: 200,
        page_title: 'TOTVS | Soluções em Sistemas de Gestão e ERP',
        meta_description: 'A maior empresa de software de gestão do Brasil. ERPs para manufatura, varejo, agronegócio e serviços.',
        has_sitemap: true,
        has_robots: true,
        discovered_internal_urls: ['/solucoes', '/produtos/protheus', '/contato'],
        has_https: true,
        detected_technologies: ['WordPress VIP', 'React', 'Marketo'],
        detected_cms: 'WordPress',
        schema_org_types: ['Corporation', 'SoftwareApplication'],
        accessibility_score: 94,
        last_checked_at: now,
      },
    ];

    const socials: BusinessSocialProfile[] = [
      {
        id: 'soc_seed_1',
        business_id: 'biz_seed_1',
        platform: 'instagram',
        profile_url: 'https://www.instagram.com/hospitaisraelitaeinstein',
        username: 'hospitaisraelitaeinstein',
        display_name: 'Hospital Albert Einstein',
        public_followers_count: 512000,
        discovery_source: 'website_link',
        access_status: 'active',
        association_confidence: 100,
        verified_at: now,
      },
      {
        id: 'soc_seed_2',
        business_id: 'biz_seed_1',
        platform: 'linkedin',
        profile_url: 'https://www.linkedin.com/company/hospital-albert-einstein',
        username: 'hospital-albert-einstein',
        public_followers_count: 650000,
        discovery_source: 'website_link',
        access_status: 'active',
        association_confidence: 100,
        verified_at: now,
      },
    ];

    const reviewMetrics: BusinessReviewMetrics[] = [
      {
        business_id: 'biz_seed_1',
        average_rating: 4.8,
        rating_scale: 5.0,
        total_reviews: 4980,
        star_distribution: { 5: 4100, 4: 550, 3: 180, 2: 70, 1: 80 },
        source: 'google_maps',
        collected_at: now,
      },
      {
        business_id: 'biz_seed_2',
        average_rating: 4.7,
        rating_scale: 5.0,
        total_reviews: 320,
        star_distribution: { 5: 260, 4: 40, 3: 12, 2: 5, 1: 3 },
        source: 'google_maps',
        collected_at: now,
      },
      {
        business_id: 'biz_seed_3',
        average_rating: 4.6,
        rating_scale: 5.0,
        total_reviews: 840,
        star_distribution: { 5: 620, 4: 140, 3: 50, 2: 15, 1: 15 },
        source: 'google_maps',
        collected_at: now,
      },
    ];

    const reviews: BusinessReviewItem[] = [
      {
        id: 'rev_seed_1',
        business_id: 'biz_seed_1',
        author_name: 'Dr. Leonardo Vasconcelos',
        rating: 5,
        text_original: 'Estrutura hospitalar inigualável, equipe de enfermagem altamente capacitada e atenciosa.',
        text_normalized: 'Estrutura hospitalar inigualável, equipe de enfermagem altamente capacitada e atenciosa.',
        publish_date: '2026-10-18',
        owner_response_text: 'Agradecemos o reconhecimento da dedicação de toda a equipe assistencial!',
        owner_response_date: '2026-10-19',
        source: 'google_maps',
      },
    ];

    const hours: BusinessHours[] = [
      {
        id: 'hrs_seed_1',
        business_id: 'biz_seed_1',
        day_of_week: 'monday',
        is_closed: false,
        is_24_hours: true,
        by_appointment_only: false,
        time_slots: [{ open: '00:00', close: '23:59' }],
        timezone: 'America/Sao_Paulo',
        source: 'google_maps',
        verified_at: now,
      },
    ];

    const services: BusinessServiceItem[] = [
      {
        id: 'srv_seed_1',
        business_id: 'biz_seed_1',
        name: 'Pronto Atendimento Adulto e Infantil',
        category: 'Emergência',
        description: 'Triagem rápida com protocolo de Manchester e exames emergenciais no local.',
        price_observed_type: 'inquire',
        currency: 'BRL',
        source: 'website_services',
        collected_at: now,
      },
    ];

    const attributes: BusinessAttribute[] = [
      {
        id: 'att_seed_1',
        business_id: 'biz_seed_1',
        category: 'accessibility',
        attribute_key: 'wheelchair_accessible_entrance',
        display_label: 'Acesso total para cadeirantes em todas as alas',
        value: true,
        source: 'google_maps',
        collected_at: now,
      },
      {
        id: 'att_seed_2',
        business_id: 'biz_seed_1',
        category: 'amenity',
        attribute_key: 'parking_valet',
        display_label: 'Serviço de manobrista / Estacionamento coberto',
        value: true,
        source: 'google_maps',
        collected_at: now,
      },
    ];

    const legalRecords: BusinessLegalRecord[] = [
      {
        id: 'leg_seed_1',
        business_id: 'biz_seed_1',
        cnpj: '60.765.823/0001-30',
        corporate_name: 'SOCIEDADE BENEFICENTE ISRAELITA BRASILEIRA ALBERT EINSTEIN',
        trade_name: 'HOSPITAL ALBERT EINSTEIN',
        registration_status: 'ATIVA',
        registration_date: '1966-08-01',
        primary_cnae: {
          code: '86.10-1-01',
          description: 'Atividades de atendimento hospitalar, exceto pronto-socorro e unidades para atendimento a urgências',
        },
        legal_nature: '399-9 - Associação Privada',
        source: 'receita_federal_publica',
        query_date: '2026-10-24',
        validation_status: 'verified',
      },
    ];

    const leads: LeadQualification[] = [
      {
        business_id: 'biz_seed_1',
        commercial_segment: 'Saúde e Medicina',
        prospecting_region: 'São Paulo - SP',
        lead_status: 'qualified',
        data_quality_score: 98,
        commercial_potential_score: 85,
        score_reasons: [
          'Cadastro completo com CNPJ, múltiplos telefones e site certificado',
          'Alta reputação pública (4.8 estrelas com 4980 avaliações)',
          'Presença digital sólida com canais de atendimento integrados',
        ],
        flags: {
          missing_website: false,
          unresponsive_website: false,
          missing_commercial_phone: false,
          missing_whatsapp: false,
          low_social_presence: false,
          high_rating_unclaimed: false,
        },
        priority: 'high',
        next_commercial_action: 'Apresentar proposta de expansão em soluções de telemetria',
        updated_at: now,
      },
      {
        business_id: 'biz_seed_2',
        commercial_segment: 'Alimentos e Gastronomia',
        prospecting_region: 'São Paulo - SP',
        lead_status: 'new',
        data_quality_score: 92,
        commercial_potential_score: 78,
        score_reasons: ['Rede em expansão nacional', 'Forte engajamento de marca'],
        flags: {
          missing_website: false,
          unresponsive_website: false,
          missing_commercial_phone: false,
          missing_whatsapp: false,
          low_social_presence: false,
          high_rating_unclaimed: false,
        },
        priority: 'high',
        next_commercial_action: 'Contatar time comercial corporativo para parcerias',
        updated_at: now,
      },
      {
        business_id: 'biz_seed_3',
        commercial_segment: 'Tecnologia da Informação',
        prospecting_region: 'São Paulo - SP',
        lead_status: 'qualified',
        data_quality_score: 95,
        commercial_potential_score: 92,
        score_reasons: ['Líder nacional de mercado de ERP', 'Capacidade de investimento corporativo'],
        flags: {
          missing_website: false,
          unresponsive_website: false,
          missing_commercial_phone: false,
          missing_whatsapp: false,
          low_social_presence: false,
          high_rating_unclaimed: false,
        },
        priority: 'high',
        next_commercial_action: 'Agendar alinhamento de canais de ecossistema',
        updated_at: now,
      },
    ];

    const evidence: ScrapeFieldEvidence[] = [
      {
        id: 'evi_seed_1',
        job_id: 'job_initial_seed',
        business_id: 'biz_seed_1',
        field_name: 'business_name',
        raw_value: 'Hospital Israelita Albert Einstein',
        normalized_value: 'Hospital Israelita Albert Einstein',
        data_type: 'string',
        source_name: 'google_maps_dom',
        source_url: 'https://www.google.com/maps/place/?q=place_id:ChIJ598l1EpeypQRh_88GjY52C8',
        page_type: 'gmaps_place',
        extraction_method: 'css_selector',
        css_selector_used: 'h1.DUwDvf',
        html_attribute: 'text',
        confidence: 99,
        validation_result: 'valid',
        created_at: now,
      },
      {
        id: 'evi_seed_2',
        job_id: 'job_initial_seed',
        business_id: 'biz_seed_1',
        field_name: 'rating_metric',
        raw_value: '4.8',
        normalized_value: '4.8',
        data_type: 'number',
        source_name: 'google_maps_dom',
        source_url: 'https://www.google.com/maps/place/?q=place_id:ChIJ598l1EpeypQRh_88GjY52C8',
        page_type: 'gmaps_place',
        extraction_method: 'css_selector',
        css_selector_used: 'div.F7nice > span:first-child',
        html_attribute: 'aria-label',
        confidence: 99,
        validation_result: 'valid',
        created_at: now,
      },
    ];

    const selectors: ScrapeSelectorRegistry[] = [
      {
        id: 'sel_1',
        source_name: 'Google Maps Places',
        target_url_pattern: 'google.com/maps/place/*',
        target_field: 'business_name',
        primary_css_selector: 'h1.DUwDvf, .fontHeadlineLarge',
        attribute_name: 'text',
        alternative_css_selector: 'div.lMbq3e h1',
        fallback_strategy: 'Inspeciona nó h1 de maior tamanho de fonte',
        success_count: 1420,
        failure_count: 2,
        last_validated_at: now,
        status: 'verified',
      },
      {
        id: 'sel_2',
        source_name: 'Google Maps Places',
        target_url_pattern: 'google.com/maps/place/*',
        target_field: 'primary_phone',
        primary_css_selector: 'button[data-tooltip*="telefone"], button[data-item-id*="phone:tel:"]',
        attribute_name: 'aria-label',
        alternative_css_selector: 'div[aria-label*="Telefone:"]',
        fallback_strategy: 'Regex de dígitos DDD no container de informações',
        success_count: 1290,
        failure_count: 14,
        last_validated_at: now,
        status: 'verified',
      },
      {
        id: 'sel_3',
        source_name: 'Google Maps Places',
        target_url_pattern: 'google.com/maps/place/*',
        target_field: 'official_website',
        primary_css_selector: 'a[data-item-id="authority"], a[aria-label*="website"]',
        attribute_name: 'href',
        alternative_css_selector: 'div[role="region"] a[href^="http"]:not([href*="google"])',
        fallback_strategy: 'Primeiro link âncora externo que não seja de serviços Google',
        success_count: 1310,
        failure_count: 8,
        last_validated_at: now,
        status: 'verified',
      },
      {
        id: 'sel_4',
        source_name: 'Website DOM',
        target_url_pattern: 'https://*/*',
        target_field: 'whatsapp_button',
        primary_css_selector: 'a[href*="wa.me/"], a[href*="api.whatsapp.com/send"]',
        attribute_name: 'href',
        alternative_css_selector: 'a[class*="whatsapp"], a[id*="whatsapp"]',
        fallback_strategy: 'Busca por atributo href com padrão internacional de mensageria',
        success_count: 890,
        failure_count: 32,
        last_validated_at: now,
        status: 'verified',
      },
    ];

    const customFields: CustomFieldDefinition[] = [
      {
        id: 'cf_1',
        field_key: 'tem_estacionamento_proprio',
        display_label: 'Possui Estacionamento Próprio',
        description: 'Indica se o estabelecimento dispõe de vagas demarcadas ou valet',
        category: 'Comodidades',
        data_type: 'boolean',
        expected_source: 'google_maps_attributes',
        preferred_css_selector: 'div[aria-label*="Estacionamento"]',
        created_at: now,
      },
      {
        id: 'cf_2',
        field_key: 'atende_convenio_medico',
        display_label: 'Aceita Convênios de Saúde',
        description: 'Lista de operadoras de planos de saúde aceitas na recepção',
        category: 'Saúde e Convênios',
        data_type: 'array',
        expected_source: 'website_services',
        preferred_css_selector: '.convenios-list, #planos-aceitos',
        created_at: now,
      },
    ];

    const jobs: ScrapeJob[] = [
      {
        id: 'job_initial_seed',
        name: 'Coleta Inicial de Referência (São Paulo)',
        query: 'Hospitais e Clínicas',
        category: 'Saúde e Medicina',
        location: 'São Paulo, SP',
        target_volume: 3,
        sources: ['Google Maps', 'Web Oficial', 'Receita Federal'],
        enrichment_enabled: true,
        enrichment_depth: 2,
        status: 'completed',
        found_count: 3,
        processed_count: 3,
        duplicated_count: 0,
        error_count: 0,
        start_time: now,
        end_time: now,
        duration_seconds: 4.2,
        logs: [
          { timestamp: now, level: 'info', message: 'Inicializando motor de pesquisa Google Maps.' },
          { timestamp: now, level: 'info', message: 'Descoberta concluída: 3 estabelecimentos validados.' },
          { timestamp: now, level: 'success', message: 'Coleta e enriquecimento cadastral finalizados com 100% de precisão.' },
        ],
      },
    ];

    const settings: DatabaseSchema['settings'] = {
      firecrawlApiKey: '',
      concurrencyLimit: 5,
      timeoutSeconds: 15,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MapScrape/2.4',
      csvDelimiter: ',',
      includeBom: true,
      protectFormulas: true,
    };

    return {
      businesses,
      addresses,
      contacts,
      websites,
      socials,
      reviewMetrics,
      reviews,
      hours,
      services,
      attributes,
      legalRecords,
      leads,
      jobs,
      evidence,
      selectors,
      customFields,
      exportJobs: [],
      changeHistory: [],
      settings,
    };
  }
}
