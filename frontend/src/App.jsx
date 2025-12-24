import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Analysis failed');
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAnalyze();
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>PageLens</h1>
        <p>Analyze websites to detect features, extract claims, and identify discrepancies</p>
      </header>

      <section className="input-section">
        <div className="input-group">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            disabled={loading}
          />
          <button
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </section>

      {loading && (
        <div className="loading">
          <div className="loading-spinner" />
          <p>Crawling and analyzing website...</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            This may take 30-60 seconds depending on the website
          </p>
        </div>
      )}

      {error && (
        <div className="error">
          <h3>Analysis Failed</h3>
          <p>{error}</p>
        </div>
      )}

      {report && <ReportView report={report} />}
    </div>
  );
}

function ReportView({ report }) {
  return (
    <div className="report">
      {/* Meta Info */}
      <div className="report-card">
        <div className="report-card-header">
          <span className="icon">📊</span>
          <h3>Analysis Overview</h3>
        </div>
        <div className="report-card-body">
          <div className="meta-grid">
            <div className="meta-item">
              <label>Analyzed URL</label>
              <span>{report.meta.analyzedUrl}</span>
            </div>
            <div className="meta-item">
              <label>Pages Crawled</label>
              <span>{report.crawl.totalPages} / {report.crawl.maxPages}</span>
            </div>
            <div className="meta-item">
              <label>Analysis Time</label>
              <span>{(report.meta.analysisTimeMs / 1000).toFixed(1)}s</span>
            </div>
            <div className="meta-item">
              <label>Timestamp</label>
              <span>{new Date(report.meta.analyzedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="report-card">
        <div className="report-card-header">
          <span className="icon">💡</span>
          <h3>Analysis Summary</h3>
        </div>
        <div className="report-card-body">
          <div className="analysis-summary">
            {report.comparison.analysis || 'No analysis summary available.'}
          </div>
        </div>
      </div>

      {/* Claimed Features */}
      <div className="report-card">
        <div className="report-card-header">
          <span className="icon">📣</span>
          <h3>Claimed Features (from homepage)</h3>
        </div>
        <div className="report-card-body">
          {report.claims.claimedFeatures.length > 0 ? (
            <div className="feature-list">
              {report.claims.claimedFeatures.map((claim, i) => (
                <div key={i} className="feature-item">
                  <span className={`feature-confidence ${getConfidenceClass(claim.confidence)}`}>
                    {claim.confidence}%
                  </span>
                  <span className="feature-name">{claim.label}</span>
                  <span className="feature-evidence">
                    {claim.evidence.slice(0, 2).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No clear feature claims detected on homepage</div>
          )}
        </div>
      </div>

      {/* Detected Features */}
      <div className="report-card">
        <div className="report-card-header">
          <span className="icon">🔍</span>
          <h3>Detected Features</h3>
        </div>
        <div className="report-card-body">
          {report.detection.aggregatedFeatures.length > 0 ? (
            <div className="feature-list">
              {report.detection.aggregatedFeatures.map((feature, i) => (
                <div key={i} className="feature-item">
                  <span className={`feature-confidence ${getConfidenceClass(feature.maxConfidence)}`}>
                    {feature.maxConfidence}
                  </span>
                  <span className="feature-name">{feature.name}</span>
                  <span className="feature-evidence">
                    Found on {feature.occurrences} page(s)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No features detected</div>
          )}
        </div>
      </div>

      {/* Findings */}
      {report.comparison.findings.length > 0 && (
        <div className="report-card">
          <div className="report-card-header">
            <span className="icon">⚠️</span>
            <h3>Findings & Discrepancies</h3>
          </div>
          <div className="report-card-body">
            {report.comparison.findings.map((finding, i) => (
              <div key={i} className={`finding ${getFindingClass(finding.type)}`}>
                <div className="finding-header">
                  <span className="finding-badge">{getFindingLabel(finding.type)}</span>
                  <span className="finding-feature">{finding.feature}</span>
                </div>
                <p className="finding-explanation">{finding.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages Crawled */}
      <div className="report-card">
        <div className="report-card-header">
          <span className="icon">📄</span>
          <h3>Pages Crawled</h3>
        </div>
        <div className="report-card-body">
          <div className="page-list">
            {report.crawl.pages.map((page, i) => {
              const classification = report.detection.pageClassifications.find(
                pc => pc.url === page.url
              );
              return (
                <div key={i} className="page-item">
                  <span className="page-number">{i + 1}</span>
                  <div className="page-info">
                    <div className="page-title">{page.title || 'Untitled'}</div>
                    <div className="page-url">{page.url}</div>
                    {classification && classification.classifications.length > 0 && (
                      <div className="classification-pills">
                        {classification.classifications.slice(0, 3).map((c, j) => (
                          <span key={j} className="classification-pill">
                            {c.name} <span className="score">{c.confidence}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Limitations */}
      {(report.crawl.limitations.length > 0 || report.crawl.errors.length > 0) && (
        <div className="report-card">
          <div className="report-card-header">
            <span className="icon">ℹ️</span>
            <h3>Crawl Limitations</h3>
          </div>
          <div className="report-card-body">
            <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)' }}>
              {report.crawl.limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
              {report.crawl.errors.map((e, i) => (
                <li key={`err-${i}`}>Error crawling {e.url}: {e.error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function getConfidenceClass(confidence) {
  if (confidence >= 50) return 'confidence-high';
  if (confidence >= 25) return 'confidence-medium';
  return 'confidence-low';
}

function getFindingClass(type) {
  switch (type) {
    case 'claimed_not_detected': return 'missing';
    case 'weak_detection': return 'weak';
    case 'detected_not_claimed': return 'unexpected';
    default: return '';
  }
}

function getFindingLabel(type) {
  switch (type) {
    case 'claimed_not_detected': return 'Not Found';
    case 'weak_detection': return 'Weak Evidence';
    case 'detected_not_claimed': return 'Unexpected';
    default: return type;
  }
}

export default App;

