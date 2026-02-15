import { db, schema } from '~/server/database'

/**
 * Create a new user
 * 
 * Example: POST /api/users
 * Body: { "name": "John Doe", "email": "john@example.com" }
 */
export default eventHandler(async (event) => {
  const body = await readBody(event)
  
  const [user] = await db
    .insert(schema.users)
    .values({
      name: body.name,
      email: body.email,
    })
    .returning()
  
  return user
})
