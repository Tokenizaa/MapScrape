// Data Normalization & Security Sanitation Engine

export class Normalizer {
  /**
   * Normalizes phone numbers (Brazilian and international)
   * Returns clean E.164-compatible and standard formatted string
   */
  public static normalizePhone(rawPhone: string, defaultCountryCode = '55'): {
    raw: string;
    normalized: string;
    e164: string;
    country_code: string;
    is_valid: boolean;
    is_whatsapp_candidate: boolean;
  } {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return {
        raw: '',
        normalized: '',
        e164: '',
        country_code: defaultCountryCode,
        is_valid: false,
        is_whatsapp_candidate: false,
      };
    }

    const digitsOnly = rawPhone.replace(/\D/g, '');

    // Check if starts with international country code or local DDD
    let countryCode = defaultCountryCode;
    let localDigits = digitsOnly;

    if (digitsOnly.startsWith('55') && digitsOnly.length >= 12) {
      countryCode = '55';
      localDigits = digitsOnly.substring(2);
    } else if (defaultCountryCode === '1' && digitsOnly.startsWith('1') && digitsOnly.length === 11) {
      countryCode = '1';
      localDigits = digitsOnly.substring(1);
    } else if (defaultCountryCode === '55' && (digitsOnly.length === 10 || digitsOnly.length === 11)) {
      countryCode = '55';
      localDigits = digitsOnly;
    }

    // Brazil validation: DDD (2 digits) + 8 or 9 digits = 10 or 11 digits
    let formatted = rawPhone.trim();
    let e164 = '';
    let isValid = false;
    let isWhatsappCandidate = false;

    if (countryCode === '55') {
      if (localDigits.length === 11) {
        // Mobile with 9-digit: (XX) 9XXXX-XXXX
        const ddd = localDigits.substring(0, 2);
        const part1 = localDigits.substring(2, 7);
        const part2 = localDigits.substring(7);
        formatted = `(${ddd}) ${part1}-${part2}`;
        e164 = `+55${localDigits}`;
        isValid = true;
        isWhatsappCandidate = true;
      } else if (localDigits.length === 10) {
        // Landline: (XX) XXXX-XXXX
        const ddd = localDigits.substring(0, 2);
        const part1 = localDigits.substring(2, 6);
        const part2 = localDigits.substring(6);
        formatted = `(${ddd}) ${part1}-${part2}`;
        e164 = `+55${localDigits}`;
        isValid = true;
        isWhatsappCandidate = false;
      } else {
        isValid = localDigits.length >= 8 && localDigits.length <= 15;
        e164 = `+${countryCode}${localDigits}`;
      }
    } else {
      isValid = localDigits.length >= 7 && localDigits.length <= 15;
      e164 = `+${countryCode}${localDigits}`;
    }

    return {
      raw: rawPhone,
      normalized: formatted,
      e164: e164,
      country_code: countryCode,
      is_valid: isValid,
      is_whatsapp_candidate: isWhatsappCandidate,
    };
  }

  /**
   * Normalizes URLs: canonical protocol, cleans tracking UTMs and fragments
   */
  public static normalizeUrl(rawUrl: string): {
    raw: string;
    normalized: string;
    domain: string;
    protocol: 'https' | 'http';
    is_valid: boolean;
  } {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { raw: '', normalized: '', domain: '', protocol: 'https', is_valid: false };
    }

    let trimmed = rawUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', '_ga', 'mc_cid', 'mc_eid'
      ];
      trackingParams.forEach(param => parsed.searchParams.delete(param));

      const protocol = parsed.protocol === 'http:' ? 'http' : 'https';
      let domain = parsed.hostname.toLowerCase();
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }

      // Rebuild canonical URL
      let cleanUrl = `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}`;
      if (cleanUrl.endsWith('/') && parsed.pathname === '/') {
        cleanUrl = `${parsed.protocol}//${parsed.hostname.toLowerCase()}`;
      }
      const remainingSearch = parsed.searchParams.toString();
      if (remainingSearch) {
        cleanUrl += `?${remainingSearch}`;
      }

      return {
        raw: rawUrl,
        normalized: cleanUrl,
        domain: domain,
        protocol: protocol,
        is_valid: true,
      };
    } catch {
      return {
        raw: rawUrl,
        normalized: rawUrl.trim().toLowerCase(),
        domain: '',
        protocol: 'https',
        is_valid: false,
      };
    }
  }

  /**
   * Normalizes business names: proper casing, preserving known corporate suffixes
   */
  public static normalizeName(rawName: string): string {
    if (!rawName) return '';
    const trimmed = rawName.trim().replace(/\s+/g, ' ');
    // If entire name is all uppercase and longer than 4 chars, convert to Title Case
    if (trimmed.length > 4 && trimmed === trimmed.toUpperCase()) {
      const words = trimmed.toLowerCase().split(' ');
      const uppercaseKeep = new Set(['ltda', 'me', 'epp', 's/a', 'sa', 'eireli', 'ti', 'sp', 'rj', 'mg', 'pr', 'rs', 'sc', 'df', 'ba']);
      const lowercaseArticles = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'em', 'com', 'para', 'por']);

      return words
        .map((w, index) => {
          if (uppercaseKeep.has(w)) return w.toUpperCase();
          if (index > 0 && lowercaseArticles.has(w)) return w;
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(' ');
    }
    return trimmed;
  }

  /**
   * Formula Injection Sanitizer (Section 7 and 11)
   * Prevents CSV injection (CSV / DDE exploit) when opened in Excel/Sheets.
   * If value starts with =, +, -, @, tab, or carriage return, prefixes with single quote (')
   */
  public static sanitizeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    let stringVal = String(value);

    // Check for dangerous leading characters that trigger formula execution
    const firstChar = stringVal.charAt(0);
    if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
      stringVal = `'${stringVal}`;
    }

    // Escape quotes for CSV compliance
    if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes(';') || stringVal.includes('\n')) {
      stringVal = `"${stringVal.replace(/"/g, '""')}"`;
    }

    return stringVal;
  }

  /**
   * Clean address string
   */
  public static normalizeAddress(rawAddress: string): string {
    if (!rawAddress) return '';
    return rawAddress
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();
  }
}
