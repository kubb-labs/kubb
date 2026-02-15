# Nuxt Drizzle Example

This example demonstrates how to use Drizzle ORM in a Nuxt application, providing the same functionality as NuxtHub's `hubDatabase()` but with direct Drizzle access.

## Features

- ✅ Drizzle ORM with Neon Postgres
- ✅ Nuxt-compatible server API routes
- ✅ Type-safe database queries
- ✅ Migration support via Drizzle Kit

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file with your `DATABASE_URL`:

```bash
cp .env.example .env
```

Edit `.env` and add your Neon database connection string.

3. Push the schema to your database:

```bash
pnpm db:push
```

4. Run the development server:

```bash
pnpm dev
```

## API Endpoints

The example includes several API endpoints demonstrating database operations:

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PATCH /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

## Comparison with NuxtHub

### Before (NuxtHub)

```typescript
// server/api/users.get.ts
import { hubDatabase } from '@nuxthub/core'

export default eventHandler(async (event) => {
  const db = hubDatabase()
  const users = await db.query.users.findMany()
  return users
})
```

### After (Drizzle Direct)

```typescript
// server/api/users.get.ts
import { db } from '~/server/database'

export default eventHandler(async (event) => {
  const users = await db.query.users.findMany()
  return users
})
```

The API is identical - just import `db` directly instead of calling `hubDatabase()`.

## Learn More

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Nuxt Server Routes](https://nuxt.com/docs/guide/directory-structure/server)
- [Neon Postgres](https://neon.tech/)
