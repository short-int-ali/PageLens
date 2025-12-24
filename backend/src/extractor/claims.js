/**
 * Claim Extraction Module
 * Extracts what a website claims to offer based on homepage content
 * Uses keyword matching (no ML)
 */

/**
 * Feature claim keywords - maps claim categories to detection patterns
 */
const CLAIM_PATTERNS = {
  SEARCH_FUNCTIONALITY: {
    keywords: [/search/i, /find\s+(your|what|the)/i, /look\s*up/i, /discover/i, /browse/i],
    label: 'Search functionality'
  },
  USER_ACCOUNTS: {
    keywords: [/sign\s*(up|in)/i, /create.*account/i, /register/i, /log\s*in/i, /member/i, /your\s*account/i],
    label: 'User accounts'
  },
  ECOMMERCE: {
    keywords: [/shop/i, /buy/i, /purchase/i, /add\s*to\s*cart/i, /checkout/i, /order/i, /pricing/i, /\$\d+/],
    label: 'E-commerce / Shopping'
  },
  CONTACT_SUPPORT: {
    keywords: [/contact\s*(us)?/i, /support/i, /help/i, /get\s*in\s*touch/i, /reach\s*(out|us)/i, /faq/i],
    label: 'Contact / Support'
  },
  NEWSLETTER: {
    keywords: [/newsletter/i, /subscribe/i, /stay\s*updated/i, /email\s*list/i, /mailing\s*list/i],
    label: 'Newsletter subscription'
  },
  FREE_TRIAL: {
    keywords: [/free\s*trial/i, /try\s*(it\s*)?free/i, /start\s*free/i, /no\s*credit\s*card/i, /free\s*plan/i],
    label: 'Free trial'
  },
  DEMO: {
    keywords: [/book\s*a?\s*demo/i, /request\s*demo/i, /schedule\s*demo/i, /see\s*it\s*in\s*action/i, /live\s*demo/i],
    label: 'Demo booking'
  },
  API: {
    keywords: [/\bapi\b/i, /developer/i, /integration/i, /sdk/i, /documentation/i],
    label: 'API / Developers'
  },
  MOBILE_APP: {
    keywords: [/mobile\s*app/i, /ios/i, /android/i, /app\s*store/i, /google\s*play/i, /download.*app/i],
    label: 'Mobile app'
  },
  BLOG: {
    keywords: [/\bblog\b/i, /articles?/i, /news/i, /insights?/i, /resources?/i],
    label: 'Blog / Resources'
  },
  PRICING_TIERS: {
    keywords: [/pricing/i, /plans?/i, /packages?/i, /subscription/i, /per\s*(month|user|seat)/i, /enterprise/i],
    label: 'Pricing tiers'
  },
  ANALYTICS: {
    keywords: [/analytics/i, /dashboard/i, /reports?/i, /metrics/i, /insights?/i, /tracking/i],
    label: 'Analytics / Dashboard'
  },
  SOCIAL_LOGIN: {
    keywords: [/sign\s*in\s*with\s*(google|facebook|apple|github)/i, /social\s*login/i, /continue\s*with/i],
    label: 'Social login'
  },
  CHAT_SUPPORT: {
    keywords: [/live\s*chat/i, /chat\s*with\s*us/i, /chat\s*support/i, /chatbot/i, /talk\s*to.*support/i],
    label: 'Chat support'
  },
  TEAM_COLLABORATION: {
    keywords: [/team/i, /collaborate/i, /share\s*with/i, /invite\s*(members|users)/i, /workspace/i],
    label: 'Team collaboration'
  }
};

/**
 * CTA (Call-to-Action) phrases that indicate features
 */
const CTA_PATTERNS = [
  { pattern: /get\s*started/i, claim: 'Easy onboarding' },
  { pattern: /learn\s*more/i, claim: 'Detailed documentation' },
  { pattern: /start\s*free\s*trial/i, claim: 'Free trial' },
  { pattern: /book\s*a?\s*demo/i, claim: 'Demo booking' },
  { pattern: /contact\s*sales/i, claim: 'Sales team' },
  { pattern: /download\s*(now|free)?/i, claim: 'Downloadable content' },
  { pattern: /sign\s*up\s*free/i, claim: 'Free signup' },
  { pattern: /try\s*for\s*free/i, claim: 'Free trial' }
];

/**
 * Extract claimed features from a page snapshot (typically homepage)
 * @param {import('../models/PageSnapshot.js').PageSnapshot} snapshot
 * @returns {Object} - Extracted claims with evidence
 */
export function extractClaims(snapshot) {
  const claims = [];
  const text = snapshot.visibleText;
  const buttonTexts = snapshot.buttons.map(b => b.text).join(' ');
  const linkTexts = snapshot.links.map(l => l.text).join(' ');
  const combinedText = `${text} ${buttonTexts} ${linkTexts}`;

  // Check each claim pattern
  for (const [claimId, config] of Object.entries(CLAIM_PATTERNS)) {
    const matchedKeywords = [];
    
    for (const pattern of config.keywords) {
      if (pattern.test(combinedText)) {
        const match = combinedText.match(pattern);
        if (match) {
          matchedKeywords.push(match[0]);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      claims.push({
        id: claimId,
        label: config.label,
        confidence: Math.min(matchedKeywords.length * 25, 100),
        evidence: matchedKeywords.slice(0, 3)
      });
    }
  }

  // Check CTAs in buttons and prominent links
  const ctaClaims = [];
  for (const cta of CTA_PATTERNS) {
    if (cta.pattern.test(buttonTexts) || cta.pattern.test(linkTexts)) {
      ctaClaims.push(cta.claim);
    }
  }

  // Extract potential product/service description from first visible text
  const description = extractDescription(text);

  return {
    url: snapshot.url,
    claims: claims.sort((a, b) => b.confidence - a.confidence),
    ctaActions: [...new Set(ctaClaims)],
    description
  };
}

/**
 * Extract a brief description of what the site does
 * Looks at first paragraph, headings, meta description patterns
 */
function extractDescription(text) {
  // Try to find the main value proposition (usually in first few lines)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20 && l.length < 200);
  
  // Look for common value proposition patterns
  const valuePropPatterns = [
    /^(?:we\s+)?(?:help|enable|empower|make\s+it\s+easy)/i,
    /^the\s+(?:best|fastest|easiest|most|only)/i,
    /^(?:build|create|manage|automate|streamline|simplify)/i,
    /^(?:your|the)\s+(?:all-in-one|complete|ultimate)/i
  ];

  for (const line of lines.slice(0, 10)) {
    for (const pattern of valuePropPatterns) {
      if (pattern.test(line)) {
        return line;
      }
    }
  }

  // Fall back to first substantial line
  return lines[0] || '';
}

/**
 * Map claim IDs to pattern IDs for comparison
 */
export const CLAIM_TO_PATTERN_MAP = {
  SEARCH_FUNCTIONALITY: ['SEARCH_PAGE'],
  USER_ACCOUNTS: ['AUTH_PAGE', 'DASHBOARD'],
  ECOMMERCE: ['ECOMMERCE', 'PRICING_PAGE'],
  CONTACT_SUPPORT: ['CONTACT_SUPPORT'],
  PRICING_TIERS: ['PRICING_PAGE'],
  ANALYTICS: ['DASHBOARD'],
  FREE_TRIAL: ['LANDING_PAGE', 'PRICING_PAGE'],
  DEMO: ['LANDING_PAGE', 'CONTACT_SUPPORT']
};

