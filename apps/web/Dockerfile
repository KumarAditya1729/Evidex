FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/api/package.json packages/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/blockchain/package.json packages/blockchain/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY contracts/package.json contracts/package.json
COPY packages/database/prisma packages/database/prisma

# Add build tools required for node-gyp to compile native C++ addons (bufferutil, utf-8-validate)
RUN apk add --no-cache python3 make g++ openssl

RUN pnpm install --frozen-lockfile=false

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @evidex/web build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/package.json apps/web/package.json
COPY --from=builder /app/node_modules node_modules
EXPOSE 3000
CMD ["pnpm", "--filter", "@evidex/web", "start"]
