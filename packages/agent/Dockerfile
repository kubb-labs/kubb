ARG NODE_VERSION=20

# Stage 1: install kubb peer dependencies using a shell-capable image
FROM node:${NODE_VERSION}-alpine AS installer
WORKDIR /tmp
RUN npm install @kubb/core @kubb/cli @kubb/oas @kubb/plugin-client @kubb/plugin-cypress @kubb/plugin-faker \
                         @kubb/plugin-mcp @kubb/plugin-msw @kubb/plugin-oas @kubb/plugin-react-query @kubb/plugin-redoc \
                         @kubb/plugin-solid-query @kubb/plugin-svelte-query @kubb/plugin-swr @kubb/plugin-ts @kubb/plugin-vue-query \
                         @kubb/plugin-zod kubb unplugin-kubb

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
    KUBB_AGENT_NO_CACHE=false \
    KUBB_AGENT_ALLOW_WRITE=false \
    KUBB_AGENT_ALLOW_ALL=false \
    KUBB_STUDIO_URL=https://studio.kubb.dev \
    KUBB_AGENT_RETRY_TIMEOUT=30000

EXPOSE ${PORT}

COPY --link packages/agent/.output ./.output
COPY --from=installer /tmp /kubb/deps

ENV NODE_PATH=/kubb/deps/node_modules

CMD [ ".output/server/index.mjs" ]
