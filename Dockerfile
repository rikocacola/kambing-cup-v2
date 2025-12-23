# ============================================
# Build stage
# ============================================
# FROM node:20-alpine AS build-env
# RUN corepack enable pnpm
# COPY . /app/
# WORKDIR /app
# RUN pnpm install --frozen-lockfile
# RUN pnpm run build

# ============================================
# Production stage - SPA Mode (Static Files)
# ============================================

# Option 1: Using nginx (recommended for production, smaller image)
# Uncomment the lines below to use nginx
# FROM nginx:alpine
# COPY --from=build-env /app/build/client /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

# Option 2: Using Node.js serve package (easier for development)
# Uncomment the lines below to use serve
# FROM node:20-alpine
# RUN npm install -g serve
# COPY --from=build-env /app/build/client /app
# WORKDIR /app
# EXPOSE 3000
# CMD ["serve", "-s", ".", "-l", "3000"]

============================================
SSR Mode (Server-Side Rendering) - DISABLED
============================================
If you enable ssr: true in react-router.config.ts, use these instead:
FROM node:20-alpine AS development-dependencies-env
RUN corepack enable pnpm
COPY . /app
WORKDIR /app
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS production-dependencies-env
RUN corepack enable pnpm
COPY ./package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS build-env
RUN corepack enable pnpm
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN pnpm run build

FROM node:20-alpine
RUN corepack enable pnpm
COPY ./package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["pnpm", "run", "start"]