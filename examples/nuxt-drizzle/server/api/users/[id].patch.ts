import { db, schema } from '~/server/database'
import { eq } from 'drizzle-orm'

/**
 * Update user
 * 
 * Example: PATCH /api/users/1
 * Body: { "name": "Jane Doe" }
 */
export default eventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  const body = await readBody(event)
  
  const userUpdate: Record<string, any> = {
    ...body,
    updatedAt: new Date(),
  }
  
  const [user] = await db
    .update(schema.users)
    .set(userUpdate)
    .where(eq(schema.users.id, id))
    .returning()
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found',
    })
  }
  
  return user
})
