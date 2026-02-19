ARG NODE_VERSION=20
FROM node:${NODE_VERSION} as build
WORKDIR /app

# Install dependencies
RUN corepack enable
COPY --link package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

# Copy source files
COPY --link . .

# Build application
ENV NITRO_PRESET=node-server
RUN pnpm run build

# https://github.com/GoogleContainerTools/distroless/blob/main/nodejs/README.md
FROM gcr.io/distroless/nodejs${NODE_VERSION} as runtime
WORKDIR /app

ARG PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=${PORT}
EXPOSE ${PORT}

COPY --from=build /app /app

CMD [ ".output/server/index.mjs" ]
