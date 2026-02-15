import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

/**
 * Database client using Drizzle ORM with Neon serverless driver
 * 
 * This replaces the NuxtHub hubDatabase() pattern with direct Drizzle usage
 * while maintaining compatibility with Nuxt server routes and API handlers.
 * 
 * Usage in Nuxt server routes:
 * ```ts
 * import { db } from '~/server/database'
 * 
 * export default eventHandler(async (event) => {
 *   const users = await db.query.users.findMany()
 *   return users
 * })
 * ```
 */

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = neon(databaseUrl)

export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export { schema }
