# Remotion Render Server for Render.com
# Based on Remotion's official Dockerfile recommendations

FROM node:22-bookworm-slim

# Install Chrome dependencies for headless rendering
RUN apt-get update && apt-get install -y \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libgbm-dev \
  libasound2 \
  libxrandr2 \
  libxkbcommon-dev \
  libxfixes3 \
  libxcomposite1 \
  libxdamage1 \
  libatk-bridge2.0-0 \
  libpango-1.0-0 \
  libcairo2 \
  libcups2 \
  fonts-liberation \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Ensure Chrome is installed for Remotion
RUN npx remotion browser ensure

# Expose the API port
EXPOSE 3001

# Start the render server
CMD ["node", "server.js"]
