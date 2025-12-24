/**
 * Expectation vs Reality Comparison Engine
 * Compares claimed features against detected patterns
 */

import { CLAIM_TO_PATTERN_MAP } from '../extractor/claims.js';

const CONFIDENCE_THRESHOLDS = {
  STRONG: 50,
  WEAK: 25
};

/**
 * @typedef {Object} ComparisonFinding
 * @property {string} type - 'claimed_not_detected' | 'weak_detection' | 'detected_not_claimed'
 * @property {string} feature - Feature name
 * @property {number} confidence - Detection confidence (if applicable)
 * @property {string[]} evidencePages - URLs of evidence pages
 * @property {string} explanation - Human-readable explanation
 */

/**
 * Compare claimed features against detected patterns
 * @param {Object} claimsResult - Result from extractClaims()
 * @param {Object} classificationResult - Result from classifyAllPages()
 * @returns {Object} - Comparison report
 */
export function compareClaimsVsDetections(claimsResult, classificationResult) {
  const { claims } = claimsResult;
  const { detectedFeatures } = classificationResult;

  const findings = [];
  const summary = {
    claimedFeatures: [],
    detectedFeatures: [],
    matchedFeatures: [],
    missingFeatures: [],
    weakFeatures: [],
    unexpectedFeatures: []
  };

  // Build a map of detected pattern IDs to their data
  const detectedMap = new Map();
  for (const feature of detectedFeatures) {
    detectedMap.set(feature.patternId, feature);
  }

  // Collect all claim labels
  summary.claimedFeatures = claims.map(c => c.label);

  // Collect all detected pattern names
  summary.detectedFeatures = detectedFeatures.map(f => f.patternName);

  // Check each claim against detections
  const matchedClaimIds = new Set();
  const matchedPatternIds = new Set();

  for (const claim of claims) {
    const relatedPatterns = CLAIM_TO_PATTERN_MAP[claim.id] || [];
    let bestMatch = null;

    for (const patternId of relatedPatterns) {
      const detected = detectedMap.get(patternId);
      if (detected && (!bestMatch || detected.maxConfidence > bestMatch.maxConfidence)) {
        bestMatch = detected;
      }
    }

    if (bestMatch) {
      matchedPatternIds.add(bestMatch.patternId);
      matchedClaimIds.add(claim.id);

      if (bestMatch.maxConfidence >= CONFIDENCE_THRESHOLDS.STRONG) {
        // Strong match
        summary.matchedFeatures.push({
          claim: claim.label,
          detected: bestMatch.patternName,
          confidence: bestMatch.maxConfidence
        });
      } else if (bestMatch.maxConfidence >= CONFIDENCE_THRESHOLDS.WEAK) {
        // Weak detection
        summary.weakFeatures.push(claim.label);
        findings.push({
          type: 'weak_detection',
          feature: claim.label,
          confidence: bestMatch.maxConfidence,
          evidencePages: bestMatch.evidencePages.map(p => p.url),
          explanation: `The website claims to offer "${claim.label}", but the detection confidence is only ${bestMatch.maxConfidence}%. This could indicate a hidden or poorly accessible feature.`
        });
      } else {
        // Very weak - treat as not detected
        summary.missingFeatures.push(claim.label);
        findings.push({
          type: 'claimed_not_detected',
          feature: claim.label,
          confidence: bestMatch.maxConfidence,
          evidencePages: [],
          explanation: `The website claims to offer "${claim.label}", but we found very weak evidence (${bestMatch.maxConfidence}% confidence). The feature may require authentication, use non-standard patterns, or not actually exist.`
        });
      }
    } else {
      // Claimed but no related pattern detected at all
      summary.missingFeatures.push(claim.label);
      findings.push({
        type: 'claimed_not_detected',
        feature: claim.label,
        confidence: 0,
        evidencePages: [],
        explanation: `The website claims to offer "${claim.label}", but no observable evidence was found during crawling. Possible reasons: the feature requires authentication, is hidden behind user actions, or uses non-standard UI patterns.`
      });
    }
  }

  // Find detected features that weren't claimed
  for (const feature of detectedFeatures) {
    if (!matchedPatternIds.has(feature.patternId)) {
      // Check if there's any claim that could relate to this
      const hasRelatedClaim = Object.entries(CLAIM_TO_PATTERN_MAP).some(
        ([claimId, patterns]) => patterns.includes(feature.patternId) && matchedClaimIds.has(claimId)
      );

      if (!hasRelatedClaim && feature.maxConfidence >= CONFIDENCE_THRESHOLDS.WEAK) {
        summary.unexpectedFeatures.push(feature.patternName);
        findings.push({
          type: 'detected_not_claimed',
          feature: feature.patternName,
          confidence: feature.maxConfidence,
          evidencePages: feature.evidencePages.map(p => p.url),
          explanation: `Detected "${feature.patternName}" with ${feature.maxConfidence}% confidence, but this wasn't explicitly mentioned in the website's claims. This could be an underpromoted feature.`
        });
      }
    }
  }

  return {
    summary,
    findings: findings.sort((a, b) => {
      // Sort by severity: claimed_not_detected > weak_detection > detected_not_claimed
      const order = { claimed_not_detected: 0, weak_detection: 1, detected_not_claimed: 2 };
      return order[a.type] - order[b.type];
    }),
    analysis: generateAnalysisSummary(summary, findings)
  };
}

/**
 * Generate a human-readable analysis summary
 */
function generateAnalysisSummary(summary, findings) {
  const lines = [];

  // Overall assessment
  const totalClaimed = summary.claimedFeatures.length;
  const totalMatched = summary.matchedFeatures.length;
  const totalMissing = summary.missingFeatures.length;
  const totalWeak = summary.weakFeatures.length;

  if (totalClaimed === 0) {
    lines.push('Could not extract clear feature claims from the homepage.');
  } else {
    const matchRate = Math.round((totalMatched / totalClaimed) * 100);
    lines.push(`Found evidence for ${totalMatched} of ${totalClaimed} claimed features (${matchRate}% match rate).`);
  }

  if (totalMissing > 0) {
    lines.push(`${totalMissing} claimed feature(s) could not be verified: ${summary.missingFeatures.join(', ')}.`);
  }

  if (totalWeak > 0) {
    lines.push(`${totalWeak} feature(s) had weak detection: ${summary.weakFeatures.join(', ')}.`);
  }

  if (summary.unexpectedFeatures.length > 0) {
    lines.push(`Found ${summary.unexpectedFeatures.length} underpromoted feature(s): ${summary.unexpectedFeatures.join(', ')}.`);
  }

  return lines.join(' ');
}

