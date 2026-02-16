import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  event.headers.set('Access-Control-Allow-Origin', '*')
  event.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  event.headers.set('Access-Control-Allow-Headers', 'Content-Type')
})
