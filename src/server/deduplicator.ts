import { Business, BusinessContact, BusinessWebsite } from '../types/schema';

export interface DeduplicationMatchResult {
  isDuplicate: boolean;
  matchScore: number; // 0 - 100
  matchedBusinessId?: string;
  matchReasons: string[];
  fieldConflicts: Array<{
    field: string;
    existingValue: string;
    incomingValue: string;
  }>;
}

export class Deduplicator {
  /**
   * Compares incoming business candidate with existing list of businesses
   */
  public static findDuplicate(
    candidate: {
      name: string;
      google_place_id?: string;
      cid?: string;
      phone?: string;
      website?: string;
      city?: string;
      state?: string;
    },
    existingBusinesses: Business[],
    existingContacts: BusinessContact[],
    existingWebsites: BusinessWebsite[]
  ): DeduplicationMatchResult {
    let bestScore = 0;
    let bestMatchedId: string | undefined = undefined;
    const matchReasons: string[] = [];

    const candidateNormName = candidate.name.toLowerCase().trim();
    const candidatePhoneDigits = (candidate.phone || '').replace(/\D/g, '');
    const candidateDomain = candidate.website ? candidate.website.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0] : '';

    for (const b of existingBusinesses) {
      let score = 0;
      const reasons: string[] = [];

      // 1. Google Place ID exact match = 100%
      if (candidate.google_place_id && b.google_place_id && candidate.google_place_id === b.google_place_id) {
        score = 100;
        reasons.push(`Correspondência exata por Google Place ID (${candidate.google_place_id})`);
      }

      // 2. CID match = 100%
      if (candidate.cid && b.cid && candidate.cid === b.cid) {
        score = 100;
        reasons.push(`Correspondência exata por CID (${candidate.cid})`);
      }

      // 3. Domain match = 90%
      if (candidateDomain && candidateDomain.length > 3) {
        const busWebsite = existingWebsites.find(w => w.business_id === b.id);
        if (busWebsite && busWebsite.domain && busWebsite.domain.toLowerCase() === candidateDomain) {
          score = Math.max(score, 90);
          reasons.push(`Domínio web idêntico: ${candidateDomain}`);
        }
      }

      // 4. Clean phone digits match (at least 8 digits) = 85%
      if (candidatePhoneDigits && candidatePhoneDigits.length >= 8) {
        const busContacts = existingContacts.filter(c => c.business_id === b.id);
        const hasMatchingPhone = busContacts.some(c => {
          const digits = c.normalized_value.replace(/\D/g, '');
          return digits.length >= 8 && (digits.endsWith(candidatePhoneDigits) || candidatePhoneDigits.endsWith(digits));
        });
        if (hasMatchingPhone) {
          score = Math.max(score, 85);
          reasons.push(`Telefone comercial idêntico (${candidate.phone})`);
        }
      }

      // 5. Normalized name similarity
      const existingNormName = b.normalized_name.toLowerCase().trim();
      if (candidateNormName === existingNormName) {
        score = Math.max(score, 80);
        reasons.push(`Nome normalizado idêntico: "${b.name}"`);
      } else if (candidateNormName.includes(existingNormName) || existingNormName.includes(candidateNormName)) {
        if (Math.min(candidateNormName.length, existingNormName.length) > 6) {
          score = Math.max(score, 65);
          reasons.push(`Nome altamente similar: "${candidate.name}" ~ "${b.name}"`);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatchedId = b.id;
        matchReasons.length = 0;
        matchReasons.push(...reasons);
      }
    }

    return {
      isDuplicate: bestScore >= 75,
      matchScore: bestScore,
      matchedBusinessId: bestMatchedId,
      matchReasons: matchReasons,
      fieldConflicts: [],
    };
  }
}
