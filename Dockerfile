# Awde — single-image deploy for persistent hosts (Railway, Fly.io, Render,
# any Docker platform). Runs the bundled Express server that serves the React
# build in /dist AND all /api endpoints (AI, PDF uploads).
#
# Requires these runtime env vars (set in your host):
#   NODE_ENV=production
#   GEMINI_API_KEY=...
#   (optional) GROQ_API_KEY, NVIDIA_API_KEY, APP_URL
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Only the built frontend + server plus the runtime (non-dev) dependencies are
# needed; dist/server.cjs is bundled but keeps external packages (express,
# multer, pdf-parse, @google/genai, dotenv) installed here.
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
