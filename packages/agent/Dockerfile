ARG NODE_VERSION=20

# Init stage: scaffold a default kubb.config.ts using a shell-capable image
FROM node:${NODE_VERSION}-alpine AS init
WORKDIR /kubb/agent
RUN npm i -g kubb@latest
RUN npx kubb init -y

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
COPY --from=init /kubb/agent /kubb/agent

CMD [ ".output/server/index.mjs" ]
