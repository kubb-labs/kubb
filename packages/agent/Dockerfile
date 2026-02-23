ARG NODE_VERSION=20

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

# Copy only the pre-built output
# Expects the build to have been done before docker build (e.g., in CI)
COPY --link packages/agent/.output ./.output

RUN cd /kubb/agent/.output/server && npm install @kubb/core @kubb/cli @kubb/oas @kubb/plugin-client @kubb/plugin-cypress @kubb/plugin-faker \
                         @kubb/plugin-mcp @kubb/plugin-msw @kubb/plugin-oas @kubb/plugin-react-query @kubb/plugin-redoc \
                         @kubb/plugin-solid-query @kubb/plugin-svelte-query @kubb/plugin-swr @kubb/plugin-ts @kubb/plugin-vue-query \
                         @kubb/plugin-zod kubb unplugin-kubb

CMD [ ".output/server/index.mjs" ]
