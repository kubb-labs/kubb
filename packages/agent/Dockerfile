ARG NODE_VERSION=22
# Space-separated list of packages to pre-install.
# Both @kubb/* scoped and third-party packages are supported.
# Override at build time to add or remove packages:
#   docker build --build-arg KUBB_PACKAGES="kubb @kubb/core @kubb/plugin-ts @kubb/middleware-barrel my-custom-plugin" .
ARG KUBB_PACKAGES="kubb@beta @kubb/core@beta @kubb/cli@beta @kubb/adapter-oas@beta @kubb/parser-ts@beta @kubb/plugin-client@beta @kubb/plugin-cypress@beta @kubb/plugin-faker@beta \
                         @kubb/plugin-mcp@beta @kubb/plugin-msw@beta @kubb/plugin-oas@beta @kubb/plugin-react-query@beta @kubb/plugin-redoc@beta \
                         @kubb/plugin-ts@beta @kubb/plugin-vue-query@beta \
                         @kubb/plugin-zod@beta @kubb/middleware-barrel@beta unplugin-kubb@beta"

# Stage 1: install kubb peer dependencies using a shell-capable image
FROM node:${NODE_VERSION}-alpine AS installer
ARG KUBB_PACKAGES
WORKDIR /tmp
RUN npm install --legacy-peer-deps ${KUBB_PACKAGES}

# Stage 2: distroless runtime (no shell required)
# https://github.com/GoogleContainerTools/distroless/blob/main/nodejs/README.md
FROM gcr.io/distroless/nodejs${NODE_VERSION}
WORKDIR /kubb/agent

# Environment defaults
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    KUBB_AGENT_ROOT=/kubb/agent/data \
    KUBB_AGENT_CONFIG=kubb.config.ts \
    KUBB_AGENT_ALLOW_WRITE=false \
    KUBB_AGENT_ALLOW_ALL=false \
    KUBB_STUDIO_URL=https://studio.kubb.dev \
    KUBB_AGENT_RETRY_TIMEOUT=30000 \
    KUBB_AGENT_HEARTBEAT_INTERVAL=30000 \
    KUBB_AGENT_POOL_SIZE=1

EXPOSE ${PORT}

COPY --link --chown=1000:1000 dist ./dist
COPY --chown=1000:1000 --from=installer /tmp/node_modules ./node_modules
COPY --link --chown=1000:1000 data /kubb/agent/data
COPY --from=installer /etc/passwd /etc/passwd

USER 1000

CMD [ "dist/server/index.mjs" ]
