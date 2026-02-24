import { logger } from '~/utils/logger.ts'

export default defineNitroPlugin(() => {
  if (process.env.NODE_ENV !== 'production') {
    globalThis.$fetch = $fetch.create({
      onRequest({ request, options }) {
        logger.info(`→ ${options.method ?? 'GET'} ${request}`)
      },
      onResponse({ request, response, options }) {
        logger.success(`← ${options.method ?? 'GET'} ${request}\n`, JSON.stringify(response._data, null, 2))
      },
      onRequestError({ request, options, error }) {
        logger.error(`← ${options.method ?? 'GET'} ${request}`, error.message)
      },
      onResponseError({ request, response, options }) {
        logger.error(`← ${options.method ?? 'GET'} ${request}`, `${response.status} ${response.statusText}`)
      },
    })
  }
})
