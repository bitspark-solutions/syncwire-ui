# syntax=docker/dockerfile:1.7
# ---------- Build stage ----------
# Installs all deps and runs `next build`. NEXT_PUBLIC_* vars are inlined into
# the client bundles AT BUILD TIME, so the API URL must be a build ARG here —
# setting it at `docker run` time would be too late.
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Where the browser reaches the SyncWire API (baked into the client bundle).
ARG NEXT_PUBLIC_API_URL=http://localhost:18080/api
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY next.config.ts tsconfig.json next-env.d.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

# ---------- Runtime stage ----------
# next.config.ts uses `output: "standalone"`, so the runtime only needs the
# self-contained server bundle + static assets — no node_modules install.
FROM node:24-alpine AS runner

RUN apk add --no-cache dumb-init wget

# Deliberately unusual host-facing port to avoid clashing with the rest of the
# stack (server 18080, postgres 15432, emqx 11883/18084).
ENV NODE_ENV=production \
    PORT=27777 \
    HOSTNAME=0.0.0.0

WORKDIR /app

# Non-root user
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public

USER app

EXPOSE 27777

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:27777/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
