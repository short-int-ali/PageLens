# PageLens - Web Analysis Platform

MVP system that crawls a public website, classifies its features using pattern matching, compares detected features against claimed features, and outputs an explainable report.

## Features

- **URL Analysis**: Submit any public website URL for analysis
- **Smart Crawling**: Playwright-based crawler with strict limits (depth 2, max 15 pages)
- **Pattern Classification**: Deterministic pattern matching to identify page types (Auth, Search, E-commerce, etc.)
- **Claim Extraction**: Extracts what a website claims to offer from homepage content
- **Gap Analysis**: Compares claimed vs detected features with explainable findings

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React (Vite)
- **Crawler**: Playwright
- **Storage**: In-memory only (no database)

## Project Structure

```
PageLens/
├── backend/
│   └── src/
│       ├── index.js           # Express server
│       ├── routes/
│       │   └── analyze.js     # POST /analyze endpoint
│       ├── crawler/
│       │   └── crawler.js     # Playwright crawler
│       ├── models/
│       │   └── PageSnapshot.js # Page data model
│       ├── engine/
│       │   ├── patterns.js    # Pattern definitions
│       │   └── classifier.js  # Classification engine
│       ├── extractor/
│       │   └── claims.js      # Claim extraction
│       └── analyzer/
│           └── comparison.js  # Claims vs detections comparison
├── frontend/
│   └── src/
│       ├── App.jsx            # Main React app
│       ├── main.jsx           # Entry point
│       └── index.css          # Styles
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   npx playwright install chromium
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Running

1. **Start the backend (Terminal 1):**
   ```bash
   cd backend
   npm start
   ```
   Backend runs on http://localhost:3000

2. **Start the frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:5173

3. Open http://localhost:5173 in your browser

## API

### POST /analyze

Analyze a website URL.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "meta": {
    "analyzedUrl": "https://example.com",
    "baseDomain": "https://example.com",
    "analyzedAt": "2024-01-01T12:00:00.000Z",
    "analysisTimeMs": 15000
  },
  "crawl": {
    "totalPages": 10,
    "pages": [...],
    "errors": [],
    "limitations": []
  },
  "claims": {
    "claimedFeatures": [...],
    "ctaActions": [...]
  },
  "detection": {
    "pageClassifications": [...],
    "aggregatedFeatures": [...]
  },
  "comparison": {
    "summary": {...},
    "findings": [...],
    "analysis": "..."
  },
  "reasoning": {
    "methodology": "...",
    "limitations": [...]
  }
}
```

## Pattern Types

The classifier detects these page types:

| Pattern | Description |
|---------|-------------|
| AUTH_PAGE | Login, signup, password reset |
| SEARCH_PAGE | Search and filter functionality |
| LANDING_PAGE | Marketing/homepage content |
| CONTENT_LISTING | Lists, catalogs, pagination |
| CONTACT_SUPPORT | Contact forms, help pages |
| ECOMMERCE | Shopping cart, checkout |
| DASHBOARD | User dashboards, portals |
| PRICING_PAGE | Pricing plans, subscriptions |
| UPLOAD_PAGE | File upload, media/content submission |

## Crawl Limits

- **Max Depth**: 2 levels from homepage
- **Max Pages**: 15 pages
- **Internal Only**: Only follows same-domain links
- **Skipped**: Auth-required, file downloads, external links

## How It Works

1. **Crawl**: Playwright visits the homepage and follows internal links up to depth 2
2. **Extract**: Each page produces a PageSnapshot (text, inputs, buttons, links)
3. **Classify**: Pattern engine scores each page against all patterns using weighted signals
4. **Extract Claims**: Homepage text is scanned for feature keywords
5. **Compare**: Claimed features are matched against detected patterns
6. **Report**: Structured JSON with evidence and explanations

## Limitations

- Cannot access authenticated pages
- JavaScript-heavy SPAs may not be fully captured
- Pattern matching relies on common UI conventions
- Analysis limited by crawl constraints

## Deployment

### Backend (Render)

The backend is containerized with Docker for easy deployment on Render.

1. **Push your code to GitHub/GitLab**

2. **Create a new Web Service on Render:**
   - Connect your repository
   - Select "Docker" as the runtime
   - Set the root directory to `backend`
   - Render will automatically use the `Dockerfile`

3. **Environment Variables on Render:**
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render's default)

4. **Or use the Blueprint file:**
   - The `backend/render.yaml` file can be used with Render's Blueprint feature

### Frontend (Vercel)

1. **Push your code to GitHub/GitLab**

2. **Import project on Vercel:**
   - Connect your repository
   - Set the root directory to `frontend`
   - Framework: Vite

3. **Environment Variables on Vercel:**
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://pagelens-backend.onrender.com`)

4. **Update CORS on Backend:**
   - Add your Vercel frontend URL to the CORS configuration

### Local Docker Testing

```bash
cd backend
docker-compose up --build
```

The backend will be available at http://localhost:3000

