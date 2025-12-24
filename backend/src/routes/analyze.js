/**
 * POST /analyze endpoint
 * Main analysis pipeline: crawl → classify → extract claims → compare
 */

import { Router } from 'express';
import { crawlWebsite } from '../crawler/crawler.js';
import { classifyAllPages } from '../engine/classifier.js';
import { extractClaims } from '../extractor/claims.js';
import { compareClaimsVsDetections } from '../analyzer/comparison.js';

const router = Router();

/**
 * Normalize URL to use HTTPS and ensure proper format
 */
function normalizeUrl(input) {
  let url = input.trim();
  
  // Add https:// if no protocol specified
  if (!url.match(/^https?:\/\//i)) {
    url = 'https://' + url;
  }
  
  // Upgrade http to https
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }
  
  return url;
}

/**
 * Validate URL format
 */
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * POST /analyze
 * Body: { url: string }
 * Returns: Structured JSON report
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    let { url } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: url',
        example: { url: 'https://example.com' }
      });
    }

    // Normalize URL to HTTPS
    url = normalizeUrl(url);

    if (!isValidUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL format. Must be a valid HTTPS URL.',
        provided: url
      });
    }

    console.log(`[Analyze] Starting analysis for: ${url}`);

    // Step 1: Crawl the website
    console.log('[Analyze] Step 1: Crawling website...');
    const crawlResult = await crawlWebsite(url);
    console.log(`[Analyze] Crawled ${crawlResult.totalPages} pages`);

    if (crawlResult.totalPages === 0) {
      return res.status(422).json({
        error: 'Could not crawl any pages from the provided URL',
        crawlErrors: crawlResult.crawlErrors
      });
    }

    // Step 2: Classify all pages
    console.log('[Analyze] Step 2: Classifying pages...');
    const classificationResult = classifyAllPages(crawlResult.snapshots);

    // Step 3: Extract claims from homepage
    console.log('[Analyze] Step 3: Extracting claims...');
    const homepageSnapshot = crawlResult.snapshots[0]; // First page is always homepage
    const claimsResult = extractClaims(homepageSnapshot);

    // Step 4: Compare claims vs detections
    console.log('[Analyze] Step 4: Comparing claims vs detections...');
    const comparisonResult = compareClaimsVsDetections(claimsResult, classificationResult);

    // Build final report
    const report = buildReport({
      url,
      crawlResult,
      classificationResult,
      claimsResult,
      comparisonResult,
      duration: Date.now() - startTime
    });

    console.log(`[Analyze] Complete in ${report.meta.analysisTimeMs}ms`);

    res.json(report);

  } catch (error) {
    console.error('[Analyze] Error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
      duration: Date.now() - startTime
    });
  }
});

/**
 * Build the final structured report
 */
function buildReport({ url, crawlResult, classificationResult, claimsResult, comparisonResult, duration }) {
  return {
    meta: {
      analyzedUrl: url,
      baseDomain: crawlResult.baseDomain,
      analyzedAt: crawlResult.crawledAt,
      analysisTimeMs: duration
    },

    crawl: {
      totalPages: crawlResult.totalPages,
      maxDepth: crawlResult.config.maxDepth,
      maxPages: crawlResult.config.maxPages,
      pages: crawlResult.snapshots.map(s => ({
        url: s.url,
        title: s.title
      })),
      errors: crawlResult.crawlErrors,
      limitations: crawlResult.crawlLimitations
    },

    claims: {
      extractedFrom: claimsResult.url,
      description: claimsResult.description,
      claimedFeatures: claimsResult.claims,
      ctaActions: claimsResult.ctaActions
    },

    detection: {
      pageClassifications: classificationResult.pageClassifications.map(pc => ({
        url: pc.url,
        title: pc.title,
        classifications: pc.classifications.map(c => ({
          pattern: c.patternId,
          name: c.patternName,
          confidence: c.confidence,
          topEvidence: c.evidence.slice(0, 5)
        }))
      })),
      aggregatedFeatures: classificationResult.detectedFeatures.map(f => ({
        pattern: f.patternId,
        name: f.patternName,
        maxConfidence: f.maxConfidence,
        occurrences: f.totalOccurrences,
        pages: f.evidencePages.map(p => p.url)
      }))
    },

    comparison: {
      summary: comparisonResult.summary,
      findings: comparisonResult.findings,
      analysis: comparisonResult.analysis
    },

    reasoning: {
      methodology: 'Pattern-based classification using weighted signals on page snapshots.',
      confidenceExplanation: 'Confidence scores are the sum of matched signal weights. Higher scores indicate more evidence.',
      limitations: [
        'Cannot access authenticated pages',
        'Cannot interpret JavaScript-heavy dynamic content fully',
        'Pattern matching is based on common conventions - unusual implementations may not match',
        `Crawl limited to ${crawlResult.config.maxDepth} levels deep and ${crawlResult.config.maxPages} pages maximum`
      ]
    }
  };
}

export default router;

