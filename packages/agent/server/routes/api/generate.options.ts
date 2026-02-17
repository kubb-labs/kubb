export default defineEventHandler(() => {
  // OPTIONS request handling for CORS preflight
  return { ok: true }
})
