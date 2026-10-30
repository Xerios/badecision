# The demo site as a static nginx image. Build from the repo root:
#   docker build -f packages/website/Dockerfile --build-arg SITE_URL=https://example.com -t badecision-website .
# Dokploy: Build Type "Dockerfile", Docker File packages/website/Dockerfile, Docker Context Path "." (see CLAUDE.md).

FROM node:26-slim AS build
# Corepack is no longer bundled with Node 25+, so install the pinned pnpm directly.
RUN npm install -g pnpm@11.22.0
WORKDIR /repo

# Dependencies first, so source edits keep this layer cached.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/website/package.json packages/website/
RUN pnpm install --frozen-lockfile --filter @badecision/website...

COPY packages/core packages/core
COPY packages/website packages/website
# Imported by src/lib/badecision.js (the package's committed kernel).
COPY packages/badecision/kernel/smol_kernel.wasm packages/badecision/kernel/

# Absolute URLs for canonical/og:url and sitemap.xml (optional).
ARG SITE_URL
ENV SITE_URL=$SITE_URL
RUN pnpm --filter @badecision/website build

FROM nginx:alpine
COPY packages/website/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/packages/website/dist /usr/share/nginx/html
EXPOSE 80
