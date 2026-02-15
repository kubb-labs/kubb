import { drizzle } from 'drizzle-orm/neon-http'
import { migrate } from 'drizzle-orm/neon-http/migrator'
import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

/**
 * Run database migrations programmatically
 * 
 * This is an alternative to `drizzle-kit push` for automated deployments
 * Compatible with Nuxt and other frameworks
 */

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const sql = neon(databaseUrl)
const db = drizzle(sql)

async function main() {
  console.log('Running migrations...')
  
  await migrate(db, {
    migrationsFolder: './server/database/migrations',
  })
  
  console.log('Migrations completed successfully!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Migration failed:', error)
  process.exit(1)
})
