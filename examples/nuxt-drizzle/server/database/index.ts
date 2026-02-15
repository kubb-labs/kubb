import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

/**
 * Database client for Nuxt application
 * 
 * This provides the same functionality as NuxtHub's hubDatabase()
 * but with direct Drizzle ORM access.
 */

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = neon(databaseUrl)

export const db = drizzle(sql, { schema })
export { schema }
