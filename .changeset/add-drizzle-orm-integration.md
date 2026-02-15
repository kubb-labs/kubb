---
"@kubb/root": minor
---

Add Drizzle ORM and Drizzle Kit integration as an alternative to NuxtHub

**Features:**
- Database setup with Drizzle ORM and Neon serverless driver
- Drizzle Kit support for schema migrations
- NuxtHub-compatible API patterns for easy migration
- Complete Nuxt example with CRUD API endpoints
- Database scripts: `db:generate`, `db:push`, `db:studio`, `db:migrate`

**New Directory Structure:**
- `server/database/` - Database schema, client, and migrations
- `examples/nuxt-drizzle/` - Complete Nuxt example application

**Benefits:**
- Direct Drizzle ORM access with full TypeScript support
- Same API as NuxtHub's `hubDatabase()` for easy migration
- Full control over database operations and schema
- Works with any PostgreSQL database (Neon, Supabase, etc.)

**Migration from NuxtHub:**
```typescript
// Before (NuxtHub)
import { hubDatabase } from '@nuxthub/core'
const db = hubDatabase()

// After (Drizzle)
import { db } from '~/server/database'
```

Both use the same Drizzle query builder, so no code changes needed.
