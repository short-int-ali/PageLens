/**
 * Pattern-Based Page Classification Engine
 * Deterministic pattern matching with weighted signals
 */

import { PATTERNS, getPatternIds } from './patterns.js';

/**
 * @typedef {Object} SignalMatch
 * @property {string} signalType - Type of signal matched
 * @property {string} matchedValue - The value that matched
 * @property {number} weight - Weight of this signal
 */

/**
 * @typedef {Object} PatternMatch
 * @property {string} patternId - Pattern ID
 * @property {string} patternName - Human-readable pattern name
 * @property {number} confidence - Total confidence score (sum of weights)
 * @property {SignalMatch[]} evidence - List of matched signals
 */

/**
 * Check if a signal matches against the page snapshot
 * @param {Object} signal - Signal definition
 * @param {import('../models/PageSnapshot.js').PageSnapshot} snapshot - Page snapshot
 * @returns {SignalMatch|null}
 */
function checkSignal(signal, snapshot) {
  const { type, value, pattern, weight } = signal;

  switch (type) {
    case 'input_type':
      for (const input of snapshot.inputs) {
        if (input.type === value) {
          return { signalType: type, matchedValue: `input[type="${value}"]`, weight };
        }
      }
      break;

    case 'input_name':
      for (const input of snapshot.inputs) {
        if (pattern.test(input.name)) {
          return { signalType: type, matchedValue: `input[name="${input.name}"]`, weight };
        }
      }
      break;

    case 'input_placeholder':
      for (const input of snapshot.inputs) {
        if (pattern.test(input.placeholder)) {
          return { signalType: type, matchedValue: `placeholder: "${input.placeholder}"`, weight };
        }
      }
      break;

    case 'button_text':
      for (const button of snapshot.buttons) {
        if (pattern.test(button.text)) {
          return { signalType: type, matchedValue: `button: "${button.text}"`, weight };
        }
      }
      break;

    case 'link_text':
      for (const link of snapshot.links) {
        if (pattern.test(link.text)) {
          return { signalType: type, matchedValue: `link: "${link.text}"`, weight };
        }
      }
      break;

    case 'link_href':
      for (const link of snapshot.links) {
        if (pattern.test(link.href)) {
          return { signalType: type, matchedValue: `href: "${link.href}"`, weight };
        }
      }
      break;

    case 'visible_text':
      if (pattern.test(snapshot.visibleText)) {
        const match = snapshot.visibleText.match(pattern);
        const excerpt = match ? match[0].substring(0, 50) : '';
        return { signalType: type, matchedValue: `text: "${excerpt}"`, weight };
      }
      break;

    case 'url':
      if (pattern.test(snapshot.url)) {
        return { signalType: type, matchedValue: `url: "${snapshot.url}"`, weight };
      }
      break;
  }

  return null;
}

/**
 * Classify a single page against all patterns
 * @param {import('../models/PageSnapshot.js').PageSnapshot} snapshot - Page snapshot
 * @returns {PatternMatch[]} - All patterns with confidence > 0, sorted by confidence
 */
export function classifyPage(snapshot) {
  const matches = [];

  for (const patternId of getPatternIds()) {
    const pattern = PATTERNS[patternId];
    const evidence = [];
    let totalConfidence = 0;

    for (const signal of pattern.signals) {
      const match = checkSignal(signal, snapshot);
      if (match) {
        evidence.push(match);
        totalConfidence += match.weight;
      }
    }

    if (totalConfidence > 0) {
      matches.push({
        patternId: pattern.id,
        patternName: pattern.name,
        confidence: totalConfidence,
        evidence
      });
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Get the primary classification for a page (highest confidence)
 * @param {import('../models/PageSnapshot.js').PageSnapshot} snapshot
 * @returns {PatternMatch|null}
 */
export function getPrimaryClassification(snapshot) {
  const matches = classifyPage(snapshot);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Classify multiple pages and aggregate results
 * @param {import('../models/PageSnapshot.js').PageSnapshot[]} snapshots
 * @returns {Object} - Aggregated classification results
 */
export function classifyAllPages(snapshots) {
  const pageClassifications = [];
  const detectedFeatures = {};

  for (const snapshot of snapshots) {
    const matches = classifyPage(snapshot);
    
    pageClassifications.push({
      url: snapshot.url,
      title: snapshot.title,
      classifications: matches
    });

    // Aggregate features across all pages
    for (const match of matches) {
      if (!detectedFeatures[match.patternId]) {
        detectedFeatures[match.patternId] = {
          patternId: match.patternId,
          patternName: match.patternName,
          maxConfidence: 0,
          totalOccurrences: 0,
          evidencePages: []
        };
      }

      const feature = detectedFeatures[match.patternId];
      feature.totalOccurrences++;
      if (match.confidence > feature.maxConfidence) {
        feature.maxConfidence = match.confidence;
      }
      feature.evidencePages.push({
        url: snapshot.url,
        confidence: match.confidence,
        topEvidence: match.evidence.slice(0, 3) // Top 3 signals
      });
    }
  }

  return {
    pageClassifications,
    detectedFeatures: Object.values(detectedFeatures).sort((a, b) => b.maxConfidence - a.maxConfidence)
  };
}

