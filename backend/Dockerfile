# =============================================================================
# PageLens Backend - Production Dockerfile
# Optimized for Playwright + Chromium on Render
# =============================================================================

# Use Playwright's official image - includes browsers and all dependencies
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
# Skip browser download during npm install (already in image)
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copy package files first (better layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/

# Create non-root user for security (playwright image runs as root by default)
RUN groupadd -r pagelens && useradd -r -g pagelens pagelens \
    && chown -R pagelens:pagelens /app

# Switch to non-root user
USER pagelens

# Expose the port (Render uses PORT env variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "src/index.js"]

