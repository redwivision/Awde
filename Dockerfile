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
# Run the production server as a non-root user.
RUN groupadd --system app && useradd --system --gid app app
# dist/server.cjs is bundled but keeps external packages (express, multer,
# pdf-parse, @google/genai, postgres, drizzle-orm, dotenv) installed here, so
# we need the runtime (non-dev) dependencies.
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
# Drizzle SQL migrations are read from <cwd>/drizzle at startup (see
# server/db/migrate.ts) — copy them so a DATABASE_URL-enabled container can
# create its tables on boot.
COPY --from=build /app/drizzle ./drizzle
# Keep the documented env template available for operators only; real secrets
# always come from the host's secrets manager at runtime.
COPY --from=build /app/.env.example ./.env.example
RUN npm ci --omit=dev && chown -R app:app /app
USER app
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
