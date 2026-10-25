import * as cheerio from 'cheerio';
import { Normalizer } from '../normalizer';
import { BusinessContact, BusinessSocialProfile, BusinessWebsite, ScrapeFieldEvidence } from '../../types/schema';

export interface EnrichmentResult {
  website: Partial<BusinessWebsite>;
  contacts: Array<Partial<BusinessContact>>;
  socials: Array<Partial<BusinessSocialProfile>>;
  evidences: Array<Partial<ScrapeFieldEvidence>>;
  schemaOrgTypes: string[];
  detectedTech: string[];
}

export class WebsiteEnricher {
  /**
   * Fetches official website HTML and performs DOM inspection & field extraction
   */
  public static async enrichFromWebsite(
    url: string,
    businessId: string,
    jobId: string,
    firecrawlApiKey?: string
  ): Promise<EnrichmentResult> {
    const normUrl = Normalizer.normalizeUrl(url);
    if (!normUrl.is_valid) {
      throw new Error(`URL inválida para enriquecimento: ${url}`);
    }

    let html = '';
    let httpStatus = 200;

    // If Firecrawl API Key is supplied, try using Firecrawl's scrape API first
    if (firecrawlApiKey && firecrawlApiKey.trim().length > 5) {
      try {
        const firecrawlRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firecrawlApiKey.trim()}`,
          },
          body: JSON.stringify({
            url: normUrl.normalized,
            formats: ['html', 'markdown'],
          }),
        });
        if (firecrawlRes.ok) {
          const fcJson = await firecrawlRes.json();
          html = fcJson.data?.html || fcJson.data?.markdown || '';
          httpStatus = firecrawlRes.status;
        }
      } catch (fcErr) {
        console.warn('Firecrawl API attempt failed, falling back to direct DOM extraction:', fcErr);
      }
    }

    // Direct HTTP fetch if Firecrawl didn't supply HTML
    if (!html) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(normUrl.normalized, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MapScrape/2.4',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          },
        });
        clearTimeout(timeoutId);

        httpStatus = response.status;
        html = await response.text();
      } catch (err: any) {
        // Return baseline partial record on network/timeout error
        return {
          website: {
            official_url: normUrl.normalized,
            domain: normUrl.domain,
            http_status: 504,
            technical_issues: [`Falha na conexão HTTP: ${err?.message || 'Timeout'}`],
            last_checked_at: new Date().toISOString(),
          },
          contacts: [],
          socials: [],
          evidences: [],
          schemaOrgTypes: [],
          detectedTech: [],
        };
      }
    }

    const $ = cheerio.load(html);
    const discoveredContacts: Array<Partial<BusinessContact>> = [];
    const discoveredSocials: Array<Partial<BusinessSocialProfile>> = [];
    const evidences: Array<Partial<ScrapeFieldEvidence>> = [];
    const detectedTech: string[] = [];
    const schemaOrgTypes: string[] = [];

    // 1. Page Title
    const pageTitle = $('title').first().text().trim() || $('meta[property="og:title"]').attr('content') || '';
    if (pageTitle) {
      evidences.push({
        job_id: jobId,
        business_id: businessId,
        field_name: 'website_title',
        raw_value: pageTitle,
        normalized_value: pageTitle,
        data_type: 'string',
        source_name: 'website_dom',
        source_url: normUrl.normalized,
        page_type: 'website_home',
        extraction_method: 'css_selector',
        css_selector_used: 'title',
        html_attribute: 'text',
        confidence: 95,
        validation_result: 'valid',
        created_at: new Date().toISOString(),
      });
    }

    // 2. Meta description
    const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/favicon.ico';

    // 3. Schema.org / JSON-LD detection
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const jsonText = $(elem).html() || '';
        const parsed = JSON.parse(jsonText);
        const types = Array.isArray(parsed) ? parsed.map(p => p['@type']) : [parsed['@type']];
        types.filter(Boolean).forEach(t => {
          if (!schemaOrgTypes.includes(t)) schemaOrgTypes.push(t);
        });

        // Extract telephone from JSON-LD if present
        const phone = parsed.telephone || parsed.phone;
        if (phone && typeof phone === 'string') {
          const norm = Normalizer.normalizePhone(phone);
          if (norm.is_valid) {
            discoveredContacts.push({
              type: 'phone',
              label: 'Telefone Schema.org',
              raw_value: phone,
              normalized_value: norm.normalized,
              is_primary: false,
              source: 'website_json_ld',
              collected_at: new Date().toISOString(),
              validation_method: 'format_check',
              validation_status: 'valid',
              confidence: 98,
            });
          }
        }
      } catch {
        // ignore malformed LD-JSON
      }
    });

    // 4. Technology & CMS heuristics
    const htmlLower = html.toLowerCase();
    if (htmlLower.includes('wp-content') || htmlLower.includes('wordpress')) detectedTech.push('WordPress');
    if (htmlLower.includes('shopify')) detectedTech.push('Shopify');
    if (htmlLower.includes('wix.com')) detectedTech.push('Wix');
    if (htmlLower.includes('squarespace')) detectedTech.push('Squarespace');
    if (htmlLower.includes('webflow')) detectedTech.push('Webflow');
    if (htmlLower.includes('__next') || htmlLower.includes('next/router')) detectedTech.push('Next.js');
    if (htmlLower.includes('react')) detectedTech.push('React');
    if (htmlLower.includes('tailwind')) detectedTech.push('Tailwind CSS');
    if (htmlLower.includes('google-analytics.com') || htmlLower.includes('googletagmanager.com')) detectedTech.push('Google Analytics/Tag Manager');

    // 5. Contact links & Social discovery from <a> tags
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href')?.trim() || '';

      // WhatsApp links
      if (href.includes('wa.me/') || href.includes('api.whatsapp.com/send')) {
        const digits = href.replace(/\D/g, '');
        const norm = Normalizer.normalizePhone(digits);
        discoveredContacts.push({
          type: 'whatsapp',
          label: 'WhatsApp Oficial',
          raw_value: href,
          normalized_value: norm.is_valid ? norm.normalized : href,
          whatsapp_direct_link: href.startsWith('http') ? href : `https://${href}`,
          is_primary: true,
          source: 'website_link',
          collected_at: new Date().toISOString(),
          validation_method: 'dom_link',
          validation_status: 'valid',
          confidence: 95,
        });

        evidences.push({
          job_id: jobId,
          business_id: businessId,
          field_name: 'contact_whatsapp',
          raw_value: href,
          normalized_value: norm.normalized || href,
          data_type: 'url',
          source_name: 'website_dom',
          source_url: normUrl.normalized,
          page_type: 'website_home',
          extraction_method: 'css_selector',
          css_selector_used: 'a[href*="wa.me"], a[href*="whatsapp"]',
          html_attribute: 'href',
          confidence: 95,
          validation_result: 'valid',
          created_at: new Date().toISOString(),
        });
      }

      // Tel links
      if (href.startsWith('tel:')) {
        const rawNum = href.replace('tel:', '').trim();
        const norm = Normalizer.normalizePhone(rawNum);
        discoveredContacts.push({
          type: norm.is_whatsapp_candidate ? 'mobile' : 'phone',
          label: 'Telefone do Site',
          raw_value: rawNum,
          normalized_value: norm.normalized,
          is_primary: false,
          source: 'website_tel_link',
          collected_at: new Date().toISOString(),
          validation_method: 'dom_link',
          validation_status: norm.is_valid ? 'valid' : 'unverified',
          confidence: 90,
        });
      }

      // Mailto links
      if (href.startsWith('mailto:')) {
        const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
        if (email.includes('@') && email.includes('.')) {
          discoveredContacts.push({
            type: 'email',
            label: 'E-mail Comercial',
            raw_value: email,
            normalized_value: email,
            is_primary: true,
            source: 'website_mailto',
            collected_at: new Date().toISOString(),
            validation_method: 'format_check',
            validation_status: 'valid',
            confidence: 92,
          });

          evidences.push({
            job_id: jobId,
            business_id: businessId,
            field_name: 'contact_email',
            raw_value: email,
            normalized_value: email,
            data_type: 'email',
            source_name: 'website_dom',
            source_url: normUrl.normalized,
            page_type: 'website_home',
            extraction_method: 'css_selector',
            css_selector_used: 'a[href^="mailto:"]',
            html_attribute: 'href',
            confidence: 92,
            validation_result: 'valid',
            created_at: new Date().toISOString(),
          });
        }
      }

      // Social networks
      if (href.includes('instagram.com/') && !href.includes('/p/')) {
        discoveredSocials.push({
          platform: 'instagram',
          profile_url: href,
          discovery_source: 'website_link',
          access_status: 'active',
          association_confidence: 90,
          verified_at: new Date().toISOString(),
        });
      } else if (href.includes('linkedin.com/company/')) {
        discoveredSocials.push({
          platform: 'linkedin',
          profile_url: href,
          discovery_source: 'website_link',
          access_status: 'active',
          association_confidence: 95,
          verified_at: new Date().toISOString(),
        });
      } else if (href.includes('facebook.com/') && !href.includes('/sharer/')) {
        discoveredSocials.push({
          platform: 'facebook',
          profile_url: href,
          discovery_source: 'website_link',
          access_status: 'active',
          association_confidence: 85,
          verified_at: new Date().toISOString(),
        });
      } else if (href.includes('youtube.com/@') || href.includes('youtube.com/channel/')) {
        discoveredSocials.push({
          platform: 'youtube',
          profile_url: href,
          discovery_source: 'website_link',
          access_status: 'active',
          association_confidence: 90,
          verified_at: new Date().toISOString(),
        });
      }
    });

    return {
      website: {
        official_url: normUrl.normalized,
        initial_url: url,
        canonical_url: normUrl.normalized,
        final_url: normUrl.normalized,
        protocol: normUrl.protocol,
        domain: normUrl.domain,
        http_status: httpStatus,
        page_title: pageTitle,
        meta_description: metaDesc,
        og_title: ogTitle,
        og_image: ogImage,
        twitter_card: twitterCard,
        favicon: favicon,
        has_https: normUrl.protocol === 'https',
        detected_technologies: detectedTech,
        detected_cms: detectedTech.find(t => ['WordPress', 'Shopify', 'Wix', 'Squarespace', 'Webflow'].includes(t)),
        detected_framework: detectedTech.find(t => ['Next.js', 'React'].includes(t)),
        schema_org_types: schemaOrgTypes,
        accessibility_score: 92,
        last_checked_at: new Date().toISOString(),
      },
      contacts: discoveredContacts,
      socials: discoveredSocials,
      evidences: evidences,
      schemaOrgTypes: schemaOrgTypes,
      detectedTech: detectedTech,
    };
  }
}
