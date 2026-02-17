export default defineNitroConfig({
  srcDir: 'server',
  debug: false,
  serveStatic: false,
  compatibilityDate: '2026-02-17',
  routeRules: {
    '/api/**': {
      cors: true,
      prerender: true,
      headers: {
        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
      },
    },
  },
})
