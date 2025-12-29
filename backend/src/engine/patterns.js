/**
 * Pattern Definitions for Page Classification
 * Each pattern has signals with weights. Total confidence = sum of matched weights.
 */

export const PATTERNS = {
  AUTH_PAGE: {
    id: 'AUTH_PAGE',
    name: 'Authentication Page',
    description: 'Login, signup, or password reset pages',
    signals: [
      // Input signals
      { type: 'input_type', value: 'password', weight: 30 },
      { type: 'input_type', value: 'email', weight: 15 },
      { type: 'input_name', pattern: /^(email|username|user|login)$/i, weight: 15 },
      { type: 'input_name', pattern: /^(password|pass|pwd)$/i, weight: 20 },
      
      // Button signals
      { type: 'button_text', pattern: /^(log\s*in|sign\s*in|login|signin)$/i, weight: 25 },
      { type: 'button_text', pattern: /^(sign\s*up|register|create\s*account)$/i, weight: 25 },
      { type: 'button_text', pattern: /^(forgot\s*password|reset\s*password)$/i, weight: 20 },
      
      // Link signals
      { type: 'link_text', pattern: /forgot.*password/i, weight: 15 },
      { type: 'link_text', pattern: /create.*account|sign.*up|register/i, weight: 15 },
      
      // Text signals
      { type: 'visible_text', pattern: /sign\s*in\s*to\s*your\s*account/i, weight: 20 },
      { type: 'visible_text', pattern: /don'?t\s*have\s*an?\s*account/i, weight: 15 },
      { type: 'visible_text', pattern: /already\s*have\s*an?\s*account/i, weight: 15 },
      
      // URL signals
      { type: 'url', pattern: /\/(login|signin|auth|signup|register)/i, weight: 25 }
    ]
  },

  SEARCH_PAGE: {
    id: 'SEARCH_PAGE',
    name: 'Search / Filter Page',
    description: 'Pages with search or filtering functionality',
    signals: [
      // Input signals
      { type: 'input_type', value: 'search', weight: 35 },
      { type: 'input_name', pattern: /^(search|query|q|keyword|find)$/i, weight: 25 },
      { type: 'input_placeholder', pattern: /search/i, weight: 20 },
      
      // Button signals
      { type: 'button_text', pattern: /^search$/i, weight: 25 },
      { type: 'button_text', pattern: /^(filter|apply\s*filters?)$/i, weight: 20 },
      { type: 'button_text', pattern: /^(find|look\s*up)$/i, weight: 15 },
      
      // Text signals
      { type: 'visible_text', pattern: /search\s*results?/i, weight: 20 },
      { type: 'visible_text', pattern: /no\s*results?\s*found/i, weight: 15 },
      { type: 'visible_text', pattern: /filter\s*by/i, weight: 20 },
      { type: 'visible_text', pattern: /sort\s*by/i, weight: 15 },
      
      // URL signals
      { type: 'url', pattern: /\/(search|find|results|browse)/i, weight: 20 },
      { type: 'url', pattern: /[?&](q|query|search)=/i, weight: 25 }
    ]
  },

  LANDING_PAGE: {
    id: 'LANDING_PAGE',
    name: 'Landing / Marketing Page',
    description: 'Homepage or marketing landing pages',
    signals: [
      // Button signals
      { type: 'button_text', pattern: /^(get\s*started|try\s*(it\s*)?free|start\s*(now|free|trial))$/i, weight: 30 },
      { type: 'button_text', pattern: /^(learn\s*more|see\s*how|discover)$/i, weight: 20 },
      { type: 'button_text', pattern: /^(book\s*a?\s*demo|request\s*demo|schedule\s*demo)$/i, weight: 25 },
      { type: 'button_text', pattern: /^(contact\s*sales|talk\s*to\s*sales)$/i, weight: 20 },
      
      // Text signals
      { type: 'visible_text', pattern: /trusted\s*by|used\s*by.*companies/i, weight: 20 },
      { type: 'visible_text', pattern: /\d+[+k]?\s*(users?|customers?|companies)/i, weight: 15 },
      { type: 'visible_text', pattern: /free\s*trial|no\s*credit\s*card/i, weight: 20 },
      { type: 'visible_text', pattern: /features?|benefits?|why\s*choose/i, weight: 15 },
      { type: 'visible_text', pattern: /pricing|plans?/i, weight: 10 },
      { type: 'visible_text', pattern: /testimonials?|what\s*(our\s*)?(customers?|clients?)\s*say/i, weight: 20 },
      
      // Link signals  
      { type: 'link_text', pattern: /^(pricing|features?|about|blog|contact)$/i, weight: 15 },
      
      // URL signals (homepage indicators)
      { type: 'url', pattern: /^https?:\/\/[^\/]+\/?$/i, weight: 25 },
      { type: 'url', pattern: /\/(home|landing|welcome)$/i, weight: 20 }
    ]
  },

  CONTENT_LISTING: {
    id: 'CONTENT_LISTING',
    name: 'Content / Listing Page',
    description: 'Pages displaying lists of items, articles, or products',
    signals: [
      // Text signals
      { type: 'visible_text', pattern: /showing\s*\d+.*results?/i, weight: 25 },
      { type: 'visible_text', pattern: /page\s*\d+\s*(of\s*\d+)?/i, weight: 20 },
      { type: 'visible_text', pattern: /next\s*page|previous\s*page/i, weight: 15 },
      { type: 'visible_text', pattern: /load\s*more|show\s*more/i, weight: 15 },
      { type: 'visible_text', pattern: /items?\s*per\s*page/i, weight: 15 },
      
      // Link signals (pagination)
      { type: 'link_text', pattern: /^(next|prev(ious)?|\d+|»|«|>|<)$/i, weight: 15 },
      { type: 'link_href', pattern: /[?&]page=\d+/i, weight: 20 },
      
      // URL signals
      { type: 'url', pattern: /\/(products?|items?|listings?|catalog|articles?|posts?|blog)/i, weight: 20 },
      { type: 'url', pattern: /\/category\//i, weight: 15 }
    ]
  },

  CONTACT_SUPPORT: {
    id: 'CONTACT_SUPPORT',
    name: 'Contact / Support Page',
    description: 'Contact forms, support pages, help centers',
    signals: [
      // Input signals
      { type: 'input_name', pattern: /^(name|fullname|first.?name)$/i, weight: 10 },
      { type: 'input_name', pattern: /^(email|e-mail)$/i, weight: 10 },
      { type: 'input_name', pattern: /^(message|subject|inquiry|question)$/i, weight: 20 },
      { type: 'input_type', value: 'textarea', weight: 15 },
      
      // Button signals
      { type: 'button_text', pattern: /^(send|submit|contact\s*us)$/i, weight: 20 },
      { type: 'button_text', pattern: /^(get\s*help|ask\s*a?\s*question)$/i, weight: 20 },
      
      // Text signals
      { type: 'visible_text', pattern: /contact\s*us|get\s*in\s*touch/i, weight: 25 },
      { type: 'visible_text', pattern: /support|help\s*center|faq/i, weight: 20 },
      { type: 'visible_text', pattern: /email\s*us|call\s*us|write\s*to\s*us/i, weight: 20 },
      { type: 'visible_text', pattern: /phone|telephone|address|location/i, weight: 15 },
      { type: 'visible_text', pattern: /business\s*hours|office\s*hours/i, weight: 15 },
      
      // URL signals
      { type: 'url', pattern: /\/(contact|support|help|faq|reach-us)/i, weight: 25 }
    ]
  },

  ECOMMERCE: {
    id: 'ECOMMERCE',
    name: 'E-commerce Page',
    description: 'Shopping, cart, and checkout pages',
    signals: [
      // Button signals
      { type: 'button_text', pattern: /^(add\s*to\s*cart|buy\s*now|purchase)$/i, weight: 35 },
      { type: 'button_text', pattern: /^(checkout|proceed\s*to\s*checkout)$/i, weight: 30 },
      { type: 'button_text', pattern: /^(view\s*cart|shopping\s*cart)$/i, weight: 25 },
      
      // Text signals
      { type: 'visible_text', pattern: /\$\d+\.?\d*|\d+\.?\d*\s*(USD|EUR|GBP)/i, weight: 20 },
      { type: 'visible_text', pattern: /add\s*to\s*cart|in\s*stock|out\s*of\s*stock/i, weight: 25 },
      { type: 'visible_text', pattern: /free\s*shipping|shipping.*\$/i, weight: 20 },
      { type: 'visible_text', pattern: /quantity|qty/i, weight: 15 },
      { type: 'visible_text', pattern: /your\s*cart|shopping\s*cart/i, weight: 25 },
      
      // Link signals
      { type: 'link_text', pattern: /^(cart|checkout|shop|store)$/i, weight: 20 },
      
      // URL signals
      { type: 'url', pattern: /\/(shop|store|cart|checkout|product)/i, weight: 25 }
    ]
  },

  DASHBOARD: {
    id: 'DASHBOARD',
    name: 'Dashboard / App Page',
    description: 'Application dashboards and user portals',
    signals: [
      // Text signals
      { type: 'visible_text', pattern: /dashboard|overview|analytics/i, weight: 25 },
      { type: 'visible_text', pattern: /welcome\s*back|hello,?\s*\w+/i, weight: 20 },
      { type: 'visible_text', pattern: /my\s*account|my\s*profile|settings/i, weight: 20 },
      { type: 'visible_text', pattern: /recent\s*activity|notifications?/i, weight: 15 },
      { type: 'visible_text', pattern: /log\s*out|sign\s*out/i, weight: 20 },
      
      // Link signals
      { type: 'link_text', pattern: /^(dashboard|settings|profile|account|logout)$/i, weight: 20 },
      
      // URL signals
      { type: 'url', pattern: /\/(dashboard|app|portal|admin|account|settings)/i, weight: 25 }
    ]
  },

  PRICING_PAGE: {
    id: 'PRICING_PAGE',
    name: 'Pricing Page',
    description: 'Pricing plans and subscription pages',
    signals: [
      // Text signals
      { type: 'visible_text', pattern: /pricing|plans?\s*&?\s*pricing/i, weight: 30 },
      { type: 'visible_text', pattern: /\$\d+\s*\/?\s*(mo|month|year|yr)/i, weight: 35 },
      { type: 'visible_text', pattern: /free\s*plan|basic\s*plan|pro\s*plan|enterprise/i, weight: 25 },
      { type: 'visible_text', pattern: /per\s*(user|seat|month)/i, weight: 20 },
      { type: 'visible_text', pattern: /billed\s*(monthly|annually|yearly)/i, weight: 25 },
      { type: 'visible_text', pattern: /compare\s*plans?|all\s*features?/i, weight: 20 },
      
      // Button signals
      { type: 'button_text', pattern: /^(choose|select|get)\s*(this\s*)?(plan|started)$/i, weight: 25 },
      { type: 'button_text', pattern: /^(upgrade|subscribe|start\s*free\s*trial)$/i, weight: 25 },
      
      // URL signals
      { type: 'url', pattern: /\/(pricing|plans|subscribe)/i, weight: 30 }
    ]
  },

  UPLOAD_PAGE: {
    id: 'UPLOAD_PAGE',
    name: 'Upload / Submit Page',
    description: 'Pages for uploading files, media, or submitting user content',
    signals: [
      // Input signals - file inputs are the strongest indicator
      { type: 'input_type', value: 'file', weight: 40 },
      { type: 'input_name', pattern: /^(file|upload|attachment|document|media|image|video|photo)s?$/i, weight: 25 },
      
      // Button signals
      { type: 'button_text', pattern: /^(upload|upload\s*file|upload\s*files?)$/i, weight: 30 },
      { type: 'button_text', pattern: /^(choose\s*file|select\s*file|browse\s*files?)$/i, weight: 25 },
      { type: 'button_text', pattern: /^(submit|publish|post|share)$/i, weight: 15 },
      { type: 'button_text', pattern: /^(add\s*(file|image|photo|video|media|document))$/i, weight: 25 },
      
      // Text signals - drag & drop and upload instructions
      { type: 'visible_text', pattern: /drag\s*(and|&)?\s*drop/i, weight: 30 },
      { type: 'visible_text', pattern: /drop\s*(your\s*)?(files?|images?|documents?)\s*here/i, weight: 30 },
      { type: 'visible_text', pattern: /upload\s*(your\s*)?(files?|images?|photos?|videos?|documents?|content)/i, weight: 25 },
      { type: 'visible_text', pattern: /select\s*(a\s*)?(file|image|photo|video|document)\s*to\s*upload/i, weight: 25 },
      { type: 'visible_text', pattern: /supported\s*(file\s*)?(formats?|types?)/i, weight: 20 },
      { type: 'visible_text', pattern: /max(imum)?\s*(file\s*)?size/i, weight: 20 },
      { type: 'visible_text', pattern: /\.(jpg|jpeg|png|gif|pdf|doc|docx|mp4|mov|zip)/i, weight: 15 },
      { type: 'visible_text', pattern: /click\s*(here\s*)?to\s*(upload|browse|select)/i, weight: 20 },
      
      // URL signals
      { type: 'url', pattern: /\/(upload|submit|import|add-file|new-post|create|share)/i, weight: 25 },
      { type: 'url', pattern: /\/(media|files?|documents?|attachments?)/i, weight: 20 }
    ]
  }
};

/**
 * Get all pattern IDs
 */
export function getPatternIds() {
  return Object.keys(PATTERNS);
}

/**
 * Get pattern by ID
 */
export function getPattern(id) {
  return PATTERNS[id] || null;
}

