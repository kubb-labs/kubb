ARG NODE_VERSION=22
# Space-separated list of @kubb/* packages to pre-install.
# Override at build time to add or remove packages:
#   docker build --build-arg KUBB_PACKAGES="kubb @kubb/core @kubb/plugin-ts @kubb/middleware-barrel" .
ARG KUBB_PACKAGES="kubb @kubb/core @kubb/cli @kubb/adapter-oas @kubb/plugin-client @kubb/plugin-cypress @kubb/plugin-faker \
                         @kubb/plugin-mcp @kubb/plugin-msw @kubb/plugin-oas @kubb/plugin-react-query @kubb/plugin-redoc \
                         @kubb/plugin-ts @kubb/plugin-vue-query \
                         @kubb/plugin-zod @kubb/middleware-barrel unplugin-kubb"

# Stage 1: install kubb peer dependencies using a shell-capable image
FROM node:${NODE_VERSION}-alpine AS installer
ARG KUBB_PACKAGES
WORKDIR /tmp
RUN npm install ${KUBB_PACKAGES}
RUN adduser -D -u 1000 appuser

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

COPY --link .output ./.output
COPY --from=installer /tmp /kubb/deps
COPY --link data /kubb/agent/data
COPY --from=installer /etc/passwd /etc/passwd

ENV NODE_PATH=/kubb/deps/node_modules

RUN chown -R 1000:1000 /kubb
USER 1000

CMD [ ".output/server/index.mjs" ]
