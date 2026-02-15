import { db, schema } from './index'
import { eq } from 'drizzle-orm'

/**
 * Example database operations using Drizzle ORM
 * 
 * These examples show how to use the database in the same way
 * you would use NuxtHub's hubDatabase(), but with direct Drizzle access.
 * 
 * This is compatible with Nuxt server routes and can be used in:
 * - API endpoints
 * - Server middleware
 * - Background jobs
 * - CLI scripts
 */

// Example: Get all users
export async function getUsers() {
  return await db.query.users.findMany()
}

// Example: Get user by ID
export async function getUserById(id: number) {
  return await db.query.users.findFirst({
    where: eq(schema.users.id, id),
  })
}

// Example: Create user
export async function createUser(data: { name: string; email: string }) {
  const [user] = await db
    .insert(schema.users)
    .values({
      name: data.name,
      email: data.email,
    })
    .returning()
  
  return user
}

// Example: Update user
export async function updateUser(id: number, data: { name?: string; email?: string }) {
  const userUpdate: Record<string, any> = {
    ...data,
    updatedAt: new Date(),
  }
  
  const [user] = await db
    .update(schema.users)
    .set(userUpdate)
    .where(eq(schema.users.id, id))
    .returning()
  
  return user
}

// Example: Delete user
export async function deleteUser(id: number) {
  const [user] = await db
    .delete(schema.users)
    .where(eq(schema.users.id, id))
    .returning()
  
  return user
}

// Example: Get user sessions
export async function getUserSessions(userId: number) {
  return await db.query.sessions.findMany({
    where: eq(schema.sessions.userId, userId),
  })
}

// Example: Create session
export async function createSession(data: { userId: number; token: string; expiresAt: Date }) {
  const [session] = await db
    .insert(schema.sessions)
    .values(data)
    .returning()
  
  return session
}
