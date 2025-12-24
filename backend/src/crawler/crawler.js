/**
 * Playwright-based Web Crawler
 * Strict limits: max depth 2, max pages 15
 */

import { chromium } from 'playwright';
import { createPageSnapshot } from '../models/PageSnapshot.js';

const MAX_DEPTH = 2;
const MAX_PAGES = 15;
const PAGE_TIMEOUT = 30000;

/**
 * Extract base domain from URL
 */
function getBaseDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Normalize URL for deduplication
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, hash, and common tracking params
    let normalized = `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url;
  }
}

/**
 * Check if URL is internal to the base domain
 */
function isInternalUrl(url, baseDomain) {
  try {
    const parsed = new URL(url);
    return parsed.origin === baseDomain;
  } catch {
    return false;
  }
}

/**
 * Check if URL should be skipped
 */
function shouldSkipUrl(url) {
  const skipPatterns = [
    /\.(pdf|zip|doc|docx|xls|xlsx|ppt|pptx|exe|dmg)$/i,
    /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i,
    /\.(mp3|mp4|avi|mov|wav)$/i,
    /\.(css|js|json|xml)$/i,
    /^mailto:/i,
    /^tel:/i,
    /^javascript:/i,
    /#$/,
    /\/(logout|signout|sign-out)/i
  ];

  return skipPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract page data from a Playwright page
 */
async function extractPageData(page) {
  return await page.evaluate(() => {
    // Get visible text (simplified)
    const visibleText = document.body?.innerText || '';

    // Get all inputs
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
      type: el.tagName.toLowerCase() === 'textarea' ? 'textarea' : 
            el.tagName.toLowerCase() === 'select' ? 'select' : 
            (el.type || 'text'),
      name: el.name || el.id || '',
      placeholder: el.placeholder || ''
    }));

    // Get all buttons (including input[type=submit] and links styled as buttons)
    const buttons = [
      ...Array.from(document.querySelectorAll('button')).map(el => ({
        text: (el.innerText || el.textContent || '').trim(),
        type: el.type || 'button'
      })),
      ...Array.from(document.querySelectorAll('input[type="submit"], input[type="button"]')).map(el => ({
        text: el.value || '',
        type: el.type
      })),
      // Also capture links that look like buttons (common CTAs)
      ...Array.from(document.querySelectorAll('a[role="button"], a.btn, a.button, a.cta')).map(el => ({
        text: (el.innerText || el.textContent || '').trim(),
        type: 'link-button'
      }))
    ].filter(b => b.text.length > 0);

    // Get all links
    const links = Array.from(document.querySelectorAll('a[href]')).map(el => ({
      href: el.href || '',
      text: (el.innerText || el.textContent || '').trim().substring(0, 100)
    })).filter(l => l.href);

    return {
      title: document.title || '',
      visibleText: visibleText.substring(0, 50000), // Limit text size
      inputs,
      buttons,
      links
    };
  });
}

/**
 * Main crawler function
 * @param {string} startUrl - URL to start crawling from
 * @returns {Promise<Object>} - Crawl results with snapshots and metadata
 */
export async function crawlWebsite(startUrl) {
  const baseDomain = getBaseDomain(startUrl);
  if (!baseDomain) {
    throw new Error('Invalid URL');
  }

  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const snapshots = [];
  const crawlErrors = [];
  const crawlLimitations = [];

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });

    while (queue.length > 0 && snapshots.length < MAX_PAGES) {
      const { url, depth } = queue.shift();
      const normalizedUrl = normalizeUrl(url);

      if (visited.has(normalizedUrl)) continue;
      if (shouldSkipUrl(url)) continue;

      visited.add(normalizedUrl);

      let page;
      try {
        page = await context.newPage();
        
        // Navigate with timeout
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: PAGE_TIMEOUT 
        });

        // Wait a bit for dynamic content
        await page.waitForTimeout(1000);

        // Extract page data
        const pageData = await extractPageData(page);
        const snapshot = createPageSnapshot({
          url: page.url(),
          ...pageData
        });

        snapshots.push(snapshot);

        // Collect internal links for next depth
        if (depth < MAX_DEPTH) {
          const newLinks = pageData.links
            .map(l => l.href)
            .filter(href => isInternalUrl(href, baseDomain))
            .filter(href => !shouldSkipUrl(href))
            .filter(href => !visited.has(normalizeUrl(href)));

          for (const link of newLinks) {
            if (queue.length + snapshots.length < MAX_PAGES * 2) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }

      } catch (err) {
        crawlErrors.push({
          url,
          error: err.message
        });
      } finally {
        if (page) await page.close();
      }
    }

    // Record limitations
    if (queue.length > 0) {
      crawlLimitations.push(`Stopped at ${MAX_PAGES} pages, ${queue.length} URLs remaining in queue`);
    }
    if (visited.size > snapshots.length) {
      crawlLimitations.push(`${visited.size - snapshots.length} pages skipped due to errors`);
    }

  } finally {
    if (browser) await browser.close();
  }

  return {
    startUrl,
    baseDomain,
    crawledAt: new Date().toISOString(),
    totalPages: snapshots.length,
    snapshots,
    crawlErrors,
    crawlLimitations,
    config: {
      maxDepth: MAX_DEPTH,
      maxPages: MAX_PAGES
    }
  };
}

