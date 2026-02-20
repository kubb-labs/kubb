ARG NODE_VERSION=20

# https://github.com/GoogleContainerTools/distroless/blob/main/nodejs/README.md
FROM gcr.io/distroless/nodejs${NODE_VERSION}
WORKDIR /app

ARG PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=${PORT}
EXPOSE ${PORT}

# Copy only the pre-built output
# Expects the build to have been done before docker build (e.g., in CI)
COPY --link packages/agent/.output ./.output

CMD [ ".output/server/index.mjs" ]
