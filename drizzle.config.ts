import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

/**
 * Drizzle Kit configuration for schema migrations
 * 
 * This replaces NuxtHub's automatic migrations with explicit Drizzle Kit commands:
 * - `pnpm db:generate` - Generate migration files
 * - `pnpm db:push` - Push schema changes to database
 * - `pnpm db:studio` - Open Drizzle Studio for database management
 * 
 * Compatible with Nuxt and can be used alongside Nuxt server routes.
 */
export default defineConfig({
  schema: './server/database/schema.ts',
  out: './server/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
