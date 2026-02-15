# Drizzle ORM Database Setup

This directory contains the Drizzle ORM database setup, which replaces NuxtHub's `hubDatabase()` with a direct Drizzle implementation while maintaining full compatibility with Nuxt.

## Features

- ✅ **Type-safe** - Full TypeScript support with Drizzle ORM
- ✅ **Nuxt Compatible** - Works seamlessly with Nuxt server routes and API handlers
- ✅ **Schema Migrations** - Managed via Drizzle Kit
- ✅ **Serverless Ready** - Uses Neon serverless driver for edge deployments
- ✅ **Same API as NuxtHub** - Familiar patterns for NuxtHub users

## Setup

### 1. Install Dependencies

Already installed in the root package.json:
- `drizzle-orm` - ORM library
- `drizzle-kit` - Migration tool
- `@neondatabase/serverless` - Neon Postgres driver
- `dotenv` - Environment variables

### 2. Configure Environment

Copy `.env.example` to `.env` and set your `DATABASE_URL`:

```bash
cp .env.example .env
```

For local development with Neon:
```env
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
```

### 3. Generate and Push Schema

```bash
# Generate migration files
pnpm db:generate

# Push schema to database
pnpm db:push

# Or run migrations programmatically
pnpm db:migrate
```

### 4. Open Drizzle Studio (Optional)

```bash
pnpm db:studio
```

## Usage

### In Nuxt Server Routes

```typescript
// server/api/users.get.ts
import { db } from '~/server/database'

export default eventHandler(async (event) => {
  const users = await db.query.users.findMany()
  return users
})
```

### Direct Queries

```typescript
import { db, schema } from '~/server/database'
import { eq } from 'drizzle-orm'

// Select
const users = await db.query.users.findMany()

// Insert
const [user] = await db
  .insert(schema.users)
  .values({ name: 'John', email: 'john@example.com' })
  .returning()

// Update
const [updated] = await db
  .update(schema.users)
  .set({ name: 'Jane' })
  .where(eq(schema.users.id, 1))
  .returning()

// Delete
const [deleted] = await db
  .delete(schema.users)
  .where(eq(schema.users.id, 1))
  .returning()
```

## Schema

The schema is defined in `schema.ts`. Currently includes:

- **users** - User accounts
- **sessions** - User sessions

Add more tables by editing `schema.ts` and running `pnpm db:generate`.

## Migration from NuxtHub

If you're migrating from NuxtHub's `hubDatabase()`:

**Before (NuxtHub):**
```typescript
import { hubDatabase } from '@nuxthub/core'

const db = hubDatabase()
const users = await db.query.users.findMany()
```

**After (Drizzle):**
```typescript
import { db } from '~/server/database'

const users = await db.query.users.findMany()
```

The API is identical - just import from `~/server/database` instead of using `hubDatabase()`.

## Commands

- `pnpm db:generate` - Generate migration files from schema
- `pnpm db:push` - Push schema changes to database (no migrations)
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm db:migrate` - Run migrations programmatically

## Configuration

Database configuration is in `drizzle.config.ts` at the project root.

## Learn More

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Drizzle Kit Docs](https://orm.drizzle.team/docs/kit-overview)
- [Neon Postgres](https://neon.tech/)
